import express from 'express'
import crypto from 'node:crypto'
import { db } from '../database/dbClient.ts';
import users from '../database/schema/users.ts';
import session from '../database/schema/sessions.ts';
import { API_RESPONSE_MESSAGES } from '../constants/apiResponse.ts';
import redis from '../lib/redis/redisClient.ts';
import argon2 from 'argon2';
import { REDIS_KEYS } from '../lib/redis/redisKeys.ts';
import sendEmail from '../lib/resendEmail.ts';
import { otpEmailData } from '../constants/email.ts';
import otpVerification from '../database/schema/otpVerification.ts';
import { eq } from 'drizzle-orm';
import { RESPONSE_MESSAGES } from '../constants/responseMessages.ts';
import { error } from 'node:console';
import { emailConfig, fromEmail } from '../config/config.ts';
import {
    createSession,
    getAllSessions,
    revokeSessionById,
    revokeAllSession
} from '../service/auth.service.ts';

const router: express.Router = express.Router()

const githubCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 10 * 60 * 1000,
};

const sessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000,
};

// Start GitHub App user authorization. The permissions shown by GitHub are
// configured in the GitHub App settings, not supplied by the browser.
router.get('/github', async (req, res) => {
    const clientId = process.env.GITHUB_APP_CLIENT_ID;
    const defaultClientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const clientUrl = (typeof req.query.redirect_uri === 'string' && req.query.redirect_uri)
        || req.headers.referer
        || defaultClientUrl;

    console.log('\n================== [AUTH-GITHUB] INITIATE ==================');
    console.log('[AUTH-GITHUB] Incoming query params:', req.query);
    console.log('[AUTH-GITHUB] Referer:', req.headers.referer);
    console.log('[AUTH-GITHUB] Target client URL for return:', clientUrl);
    console.log('[AUTH-GITHUB] GITHUB_APP_CLIENT_ID configured?:', Boolean(clientId));

    if (!clientId) {
        console.error('[AUTH-GITHUB] ERROR: GITHUB_APP_CLIENT_ID is not configured in env!');
        return res.status(500).json({ error: 'GitHub authentication is not configured' });
    }

    const state = crypto.randomBytes(32).toString('hex');
    const callbackRedirectUri = `${process.env.API_BASE_URL || 'http://localhost:5000'}/auth/github/callback`;
    const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('redirect_uri', callbackRedirectUri);
    authorizeUrl.searchParams.set('state', state);

    console.log('[AUTH-GITHUB] Generated state:', state);
    console.log('[AUTH-GITHUB] Configured callback redirect URI:', callbackRedirectUri);
    console.log('[AUTH-GITHUB] Redirecting user to GitHub authorize URL:', authorizeUrl.toString());

    try {
        // Store OAuth state and redirect URL in Redis with a 10-minute expiry
        await redis.set(`oauth:github:${state}`, clientUrl, 'EX', 600);
        console.log('[AUTH-GITHUB] Stored state in Redis successfully');
    } catch (redisErr) {
        console.warn('[AUTH-GITHUB] Failed to cache OAuth state in Redis, falling back to cookies:', redisErr);
    }
    console.log('============================================================\n');

    return res
        .cookie('github_oauth_state', state, githubCookieOptions)
        .cookie('github_client_redirect', clientUrl, githubCookieOptions)
        .redirect(authorizeUrl.toString());
});

// Exchange GitHub's temporary code, create/sign in the local user, and issue
// the same session cookie used by email login.
router.get('/github/callback', async (req, res) => {
    const { code, state } = req.query;
    const clientId = process.env.GITHUB_APP_CLIENT_ID;
    const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
    const defaultClientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    console.log('\n================== [AUTH-GITHUB-CALLBACK] RECEIVED ==================');
    console.log('[AUTH-GITHUB-CALLBACK] URL:', req.originalUrl);
    console.log('[AUTH-GITHUB-CALLBACK] Query params:', {
        code: typeof code === 'string' ? `${code.slice(0, 10)}...` : code,
        state: state
    });
    console.log('[AUTH-GITHUB-CALLBACK] Cookies:', req.cookies);

    let redisRedirect: string | null = null;
    if (typeof state === 'string') {
        try {
            redisRedirect = await redis.get(`oauth:github:${state}`);
            console.log('[AUTH-GITHUB-CALLBACK] Redis state lookup result:', redisRedirect);
            if (redisRedirect) {
                await redis.del(`oauth:github:${state}`);
            }
        } catch (redisErr) {
            console.warn('[AUTH-GITHUB-CALLBACK] Failed to get OAuth state from Redis:', redisErr);
        }
    }

    const savedState = req.cookies.github_oauth_state as string | undefined;
    const savedRedirect = req.cookies.github_client_redirect as string | undefined;
    const targetClientUrl = redisRedirect || savedRedirect || defaultClientUrl;

    console.log('[AUTH-GITHUB-CALLBACK] Target redirect client URL:', targetClientUrl);

    if (!clientId || !clientSecret) {
        console.error('[AUTH-GITHUB-CALLBACK] ERROR: GitHub credentials missing in env', { hasClientId: Boolean(clientId), hasClientSecret: Boolean(clientSecret) });
        return res.redirect(`${targetClientUrl}?github_auth=error&message=${encodeURIComponent('GitHub authentication is not configured')}`);
    }

    const isStateValid = Boolean(redisRedirect) || (typeof state === 'string' && typeof savedState === 'string' && state === savedState);
    console.log('[AUTH-GITHUB-CALLBACK] State validation:', { isStateValid, hasRedisRedirect: Boolean(redisRedirect), matchesCookie: Boolean(savedState && state === savedState) });

    if (typeof code !== 'string' || !isStateValid) {
        console.error('[AUTH-GITHUB-CALLBACK] State validation failed!', { state, savedState, hasRedisRedirect: Boolean(redisRedirect) });
        return res.redirect(`${targetClientUrl}?github_auth=error&message=${encodeURIComponent('Invalid GitHub authentication state')}`);
    }

    const callbackRedirectUri = `${process.env.API_BASE_URL || 'http://localhost:5000'}/auth/github/callback`;

    try {
        console.log('[AUTH-GITHUB-CALLBACK] Exchanging code for access token with GitHub...');
        console.log('[AUTH-GITHUB-CALLBACK] Token exchange request payload:', {
            client_id: clientId,
            client_secret: clientSecret ? `${clientSecret.slice(0, 4)}...${clientSecret.slice(-4)}` : undefined,
            code: typeof code === 'string' ? `${code.slice(0, 10)}...` : code,
            redirect_uri: callbackRedirectUri,
        });

        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: callbackRedirectUri,
            }),
        });
        const tokenData = await tokenResponse.json() as { 
            access_token?: string;
            error?: string;
            error_description?: string;
        };

        console.log('[AUTH-GITHUB-CALLBACK] Token response status:', tokenResponse.status);
        console.log('[AUTH-GITHUB-CALLBACK] Token response data:', tokenData);

        if (!tokenResponse.ok || !tokenData.access_token) {
            console.error('[AUTH-GITHUB-CALLBACK] GitHub token exchange error response:', tokenData);
            const errMsg = tokenData.error_description || tokenData.error || 'GitHub token exchange failed';
            return res.redirect(`${targetClientUrl}?github_auth=error&message=${encodeURIComponent(errMsg)}`);
        }

        console.log('[AUTH-GITHUB-CALLBACK] Successfully acquired access token. Fetching GitHub user profile...');
        const githubHeaders = {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${tokenData.access_token}`,
            'X-GitHub-Api-Version': '2022-11-28',
        };
        const profileResponse = await fetch('https://api.github.com/user', { headers: githubHeaders });
        const profile = await profileResponse.json() as {
            id?: number;
            login?: string;
            name?: string | null;
            email?: string | null;
        };

        console.log('[AUTH-GITHUB-CALLBACK] GitHub profile response status:', profileResponse.status);
        console.log('[AUTH-GITHUB-CALLBACK] Profile data:', profile);

        if (!profileResponse.ok || !profile.id || !profile.login) {
            console.error('[AUTH-GITHUB-CALLBACK] Failed to read GitHub profile:', profile);
            return res.redirect(`${targetClientUrl}?github_auth=error&message=${encodeURIComponent('Could not read GitHub profile')}`);
        }

        let email = profile.email?.trim().toLowerCase() || null;
        if (!email) {
            console.log('[AUTH-GITHUB-CALLBACK] Public email not present on profile, requesting /user/emails...');
            const emailsResponse = await fetch('https://api.github.com/user/emails', { headers: githubHeaders });
            if (emailsResponse.ok) {
                const emails = await emailsResponse.json() as Array<{ email?: string; primary?: boolean; verified?: boolean }>;
                console.log('[AUTH-GITHUB-CALLBACK] User emails fetched:', emails);
                email = emails.find((entry) => entry.primary && entry.verified)?.email?.trim().toLowerCase()
                    || emails.find((entry) => entry.verified)?.email?.trim().toLowerCase()
                    || null;
            }
        }
        console.log('[AUTH-GITHUB-CALLBACK] Final resolved user email:', email);

        const githubId = String(profile.id);
        console.log('[AUTH-GITHUB-CALLBACK] Searching database for user with githubID:', githubId, 'or email:', email);
        const existingUsers = await db.select().from(users).where(eq(users.githubID, githubId));
        const emailUser = email
            ? await db.select().from(users).where(eq(users.email, email))
            : [];
        const existingUser = existingUsers[0] || emailUser[0];

        let userRecord;
        if (existingUser) {
            console.log('[AUTH-GITHUB-CALLBACK] Found existing user:', existingUser.id, 'Updating record...');
            userRecord = (await db.update(users).set({
                name: profile.name?.trim() || profile.login,
                email: email || existingUser.email || null,
                githubID: githubId,
                githubProfile: profile.login,
                loginMethod: 'github',
                lastLoginAt: new Date(),
            }).where(eq(users.id, existingUser.id)).returning({ id: users.id, name: users.name, email: users.email }))[0];
        } else {
            console.log('[AUTH-GITHUB-CALLBACK] No existing user found. Creating new user record...');
            userRecord = (await db.insert(users).values({
                name: profile.name?.trim() || profile.login,
                email,
                githubID: githubId,
                githubProfile: profile.login,
                loginMethod: 'github',
                isActive: true,
                emailNotification: true,
            }).returning({ id: users.id, name: users.name, email: users.email }))[0];
        }

        console.log('[AUTH-GITHUB-CALLBACK] Database user record:', userRecord);

        if (!userRecord) {
            console.error('[AUTH-GITHUB-CALLBACK] Database insert/update returned no user record!');
            return res.redirect(`${targetClientUrl}?github_auth=error&message=${encodeURIComponent('Could not create user account')}`);
        }

        const userAgent = {
            browser: req.useragent?.browser,
            os: req.useragent?.os,
            platform: req.useragent?.platform,
        };
        console.log('[AUTH-GITHUB-CALLBACK] Creating session for user ID:', userRecord.id, 'userAgent:', userAgent);
        const sessionToken = await createSession(userRecord.id, userAgent);
        console.log('[AUTH-GITHUB-CALLBACK] Session created result:', sessionToken);

        if (!sessionToken) {
            console.error('[AUTH-GITHUB-CALLBACK] Failed to create session!');
            return res.redirect(`${targetClientUrl}?github_auth=error&message=${encodeURIComponent('Could not create session')}`);
        }

        const redirectUrl = new URL(targetClientUrl);
        redirectUrl.searchParams.set('github_auth', 'success');
        redirectUrl.searchParams.set('session_id', sessionToken);
        redirectUrl.searchParams.set('user_id', userRecord.id);
        redirectUrl.searchParams.set('user_name', userRecord.name);
        if (userRecord.email) {
            redirectUrl.searchParams.set('user_email', userRecord.email);
        }

        console.log('[AUTH-GITHUB-CALLBACK] SUCCESS! Redirecting user to client:', redirectUrl.toString());
        console.log('=====================================================================\n');

        return res
            .clearCookie('github_oauth_state')
            .clearCookie('github_client_redirect')
            .cookie('session', sessionToken, sessionCookieOptions)
            .cookie('sessionId', sessionToken, sessionCookieOptions)
            .redirect(redirectUrl.toString());
    } catch (err) {
        console.error('=====================================================================');
        console.error('[AUTH-GITHUB-CALLBACK] EXCEPTION DURING GITHUB CALLBACK:', err);
        console.error('=====================================================================');
        const errMessage = err instanceof Error ? err.message : 'GitHub authentication failed';
        return res.redirect(`${targetClientUrl}?github_auth=error&message=${encodeURIComponent(errMessage)}`);
    }
});

router.post('/signup', async (req, res) => {
    const body = req.body;

    try {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                error: 'Valid email address is required'
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await argon2.hash(otp);
        const hashedPassword = body.password ? await argon2.hash(body.password) : null;
        const name = body.name || email.split('@')[0];

        const signUpDetails = {
            email,
            hashedPassword,
            hashedOtp,
            operation: 'signup',
            otpExpiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            name,
        };

        const signUpDetailsJSON = JSON.stringify(signUpDetails);

        // Store in Redis (primary cache with 300s TTL)
        let redisSaved = false;
        try {
            await redis.set(
                REDIS_KEYS.signUp(email),
                signUpDetailsJSON,
                'EX',
                300
            );
            redisSaved = true;
        } catch (err) {
            console.warn('Redis storage failed in /signup:', err);
        }

        // Store in database (reliable fallback)
        try {
            await db.delete(otpVerification).where(eq(otpVerification.emailKey, email));
            await db.insert(otpVerification).values({
                emailKey: email,
                value: signUpDetails,
            });
        } catch (err) {
            console.warn('DB otpVerification storage failed in /signup:', err);
            if (!redisSaved) {
                return res.status(500).json({
                    error: API_RESPONSE_MESSAGES[500]
                });
            }
        }

        // Send email to user
        try {
            const emailSent = await sendEmail(
                email,
                otpEmailData.from,
                otpEmailData.subject,
                otpEmailData.getHtml(otp, email)
            );

            if (!emailSent) {
                return res.status(500).json({
                    error: RESPONSE_MESSAGES.OTP_SEND_FAILED || 'Failed to send email'
                });
            }

            return res.status(200).json({
                message: RESPONSE_MESSAGES.OTP_SENT || 'OTP sent to your email'
            });
        } catch (err) {
            console.error('sendEmail exception:', err);
            return res.status(500).json({
                error: RESPONSE_MESSAGES.OTP_SEND_FAILED || 'Failed to send email'
            });
        }
    } catch (err) {
        console.error('Error in /signup route:', err);
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500] || 'Internal server error'
        });
    }
});

// Endpoint to verify user OTP and complete profile verification
router.post('/verify-email', async (req, res) => {
    const body = req.body;

    try {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const otp = typeof body.otp === 'string' ? body.otp.trim() : String(body.otp ?? '').trim();

        if (!email || !otp) {
            return res.status(400).json({
                error: RESPONSE_MESSAGES.OTP_REQUIRED || 'Email and OTP are required'
            });
        }

        let signUpDetails: any = null;

        // 1. Fetch from Redis cache
        try {
            const cached = await redis.get(REDIS_KEYS.signUp(email));
            if (cached) {
                signUpDetails = typeof cached === 'string' ? JSON.parse(cached) : cached;
            }
        } catch (err) {
            console.warn('Redis read failed in /verify-email:', err);
        }

        // 2. Fetch from database if not found in Redis
        if (!signUpDetails) {
            try {
                const dbRecords = await db
                    .select({
                        value: otpVerification.value
                    })
                    .from(otpVerification)
                    .where(eq(otpVerification.emailKey, email));

                if (dbRecords && dbRecords.length > 0) {
                    const rawVal = dbRecords[dbRecords.length - 1]?.value;
                    signUpDetails = typeof rawVal === 'string' ? JSON.parse(rawVal) : rawVal;
                }
            } catch (err) {
                console.error('DB read failed in /verify-email:', err);
            }
        }

        if (!signUpDetails) {
            return res.status(400).json({
                error: RESPONSE_MESSAGES.OTP_EXPIRED || 'Verification code expired or not found. Please request a new one.'
            });
        }

        // Check expiration
        const expiryTime = new Date(signUpDetails.otpExpiry).getTime();
        if (Date.now() > expiryTime) {
            return res.status(400).json({
                message: RESPONSE_MESSAGES.OTP_EXPIRED
            });
        }

        // Verify OTP
        const isOtpCorrect = await argon2.verify(signUpDetails.hashedOtp, otp);
        if (!isOtpCorrect) {
            return res.status(400).json({
                error: RESPONSE_MESSAGES.INCORRECT_OTP
            });
        }

        // Verify password if one was set during signup
        if (signUpDetails.hashedPassword && body.password) {
            const isPasswordCorrect = await argon2.verify(signUpDetails.hashedPassword, body.password);
            if (!isPasswordCorrect) {
                return res.status(400).json({
                    error: 'Invalid password'
                });
            }
        }

        // Create or update user in database
        try {
            let userRecord: any = null;
            const existing = await db
                .select()
                .from(users)
                .where(eq(users.email, email));

            if (existing && existing.length > 0) {
                userRecord = existing[0];
                await db
                    .update(users)
                    .set({ lastLoginAt: new Date() })
                    .where(eq(users.id, userRecord.id));

                const userAgent = {
                    browser: req.useragent!.browser,
                    os: req.useragent!.os,
                    platform: req.useragent!.platform,
                };

                const sessionToken = await createSession(userRecord.id, userAgent);

                try {
                    await redis.del(REDIS_KEYS.signUp(email));
                } catch {}
                try {
                    await db.delete(otpVerification).where(eq(otpVerification.emailKey, email));
                } catch {}

                return res
                    .status(200)
                    .cookie('session', sessionToken, {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'lax',
                        maxAge: 30 * 24 * 60 * 60 * 1000,
                    })
                    .json({
                        message: RESPONSE_MESSAGES.OTP_VERIFIED || 'Email verified successfully',
                        user: {
                            id: userRecord.id,
                            name: userRecord.name,
                            email: userRecord.email,
                        }
                    });
            } else {
                const created = await db
                    .insert(users)
                    .values({
                        name: signUpDetails.name || email.split('@')[0],
                        email: email,
                        passWord: signUpDetails.hashedPassword ?? null,
                        loginMethod: 'email',
                        isActive: true,
                        emailNotification: true,
                    })
                    .returning({
                        id: users.id,
                        name: users.name,
                        email: users.email,
                    });
                userRecord = created[0];

                // Create session
                const userAgent = {
                    browser: req.useragent!.browser,
                    os: req.useragent!.os,
                    platform: req.useragent!.platform,
                };

                const sessionToken = await createSession(userRecord.id, userAgent)

                // Cleanup OTP records
                try {
                    await redis.del(REDIS_KEYS.signUp(email));
                } catch {}
                try {
                    await db.delete(otpVerification).where(eq(otpVerification.emailKey, email));
                } catch {}


                return res
                    .status(200)
                    .cookie('session', sessionToken, {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'lax',
                        maxAge: 30 * 24 * 60 * 60 * 1000,
                    })
                    .json({
                    message: RESPONSE_MESSAGES.OTP_VERIFIED || 'Email verified successfully',
                    user: {
                        id: userRecord.id,
                        name: userRecord.name,
                        email: userRecord.email,
                    }
                });

            }
            
        } catch (dbErr) {
            console.error('Error saving user in /verify-email:', dbErr);
            return res.status(500).json({
                error: API_RESPONSE_MESSAGES[500]
            });
        }
    } catch (err) {
        console.error('Error in /verify-email route:', err);
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        });
    }
});

// Reset password
router.patch('/reset-password', async (req, res) => {
    try {
        const body = req.body

        const userCondition = body.userId
            ? eq(users.id, body.userId)
            : (body.email ? eq(users.email, body.email) : null);

        if (!userCondition) {
            return res.status(400).json({
                error: 'User ID or email is required'
            });
        }

        const oldPasswordHash = await db.select({
            oldPassword: users.passWord,
            userId: users.id,
        })
        .from(users)
        .where(userCondition)

        if (!oldPasswordHash || oldPasswordHash.length === 0 || !oldPasswordHash[0]?.oldPassword) {
            return res.status(401).json({
                error: 'Incorrect current password'
            });
        }

        const verifyPassword = await argon2.verify(
                oldPasswordHash[0].oldPassword,
                body.oldPassword
            ) 

        // Update or reject password update request 
        if(verifyPassword == true) {
            try { 
                const hashedPassword = await argon2.hash(body.password);
                await db.update(users)
                .set({
                    passWord: hashedPassword
                })
                .where(eq(
                    users.id, oldPasswordHash[0].userId
                ))

                return res.status(204).end()
            } catch(err) {
                return res.status(500).json({
                    error: 'There was an error updating your password. Please try again'
                })
            }
        } else {
            return res.status(401).json({
                error: 'Incorrect current password'
            })
        }
    } catch(err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }
}) 

router.patch('/forgot-password', async(req, res) => {
    try {
        const rawEmail = req.body?.email;
        const userEmail = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

        if (!userEmail) {
            return res.status(400).json({
                error: 'Email is required'
            });
        }

        // Check if user exists
        const existingUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, userEmail));

        if (existingUser.length === 0) {
            return res.status(404).json({
                error: 'No account found with this email address'
            });
        }

        // Create and store OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await argon2.hash(otp);

        await redis.set(
            REDIS_KEYS.forgotPassword(userEmail),
            hashedOtp,
            'EX',
            300
        );

        // Store fallback in DB
        try {
            await db.delete(otpVerification).where(eq(otpVerification.emailKey, `forgot:${userEmail}`));
            await db.insert(otpVerification).values({
                emailKey: `forgot:${userEmail}`,
                value: {
                    hashedOtp,
                    otpExpiry: new Date(Date.now() + 5 * 60 * 1000).toISOString()
                }
            });
        } catch (dbErr) {
            console.warn('DB otp fallback failed in /forgot-password:', dbErr);
        }

        // Send OTP
        await sendEmail(
            userEmail,
            otpEmailData.from,
            otpEmailData.subject,
            otpEmailData.getHtml(otp, userEmail)
        );

        return res.status(200).json({
            message: RESPONSE_MESSAGES.OTP_SENT
        });
    } catch(err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        });
    }
});

router.patch('/verify-forgot-password', async(req, res) => {
    try {
        const body = req.body || {};
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const otp = typeof body.otp === 'string' ? body.otp.trim() : String(body.otp ?? '').trim();
        const password = typeof body.password === 'string' ? body.password : '';

        if (!email || !otp || !password) {
            return res.status(400).json({
                error: 'Email, OTP, and new password are required'
            });
        }

        // Verify OTP from Redis, or fallback to database
        let hashedOtp = await redis.get(REDIS_KEYS.forgotPassword(email));

        if (!hashedOtp) {
            try {
                const dbRecords = await db
                    .select({ value: otpVerification.value })
                    .from(otpVerification)
                    .where(eq(otpVerification.emailKey, `forgot:${email}`));

                if (dbRecords && dbRecords.length > 0) {
                    const record = dbRecords[dbRecords.length - 1]?.value as any;
                    if (record && new Date(record.otpExpiry).getTime() > Date.now()) {
                        hashedOtp = record.hashedOtp;
                    }
                }
            } catch (dbErr) {
                console.warn('DB read failed in /verify-forgot-password:', dbErr);
            }
        }

        if (hashedOtp) {
            const verifyOtp = await argon2.verify(hashedOtp, otp);

            if (verifyOtp === true) {
                // Hash the new password
                const hashedPassword = await argon2.hash(password);
                const updatePassword = await db.update(users).set({
                    passWord: hashedPassword
                }).where(eq(
                    users.email, email
                )).returning({
                    email: users.email,
                    userId: users.id
                });

                await redis.del(REDIS_KEYS.forgotPassword(email));
                await db.delete(otpVerification).where(eq(otpVerification.emailKey, `forgot:${email}`)).catch(() => {});

                const userAgent = {
                    browser: req.useragent!.browser,
                    os: req.useragent!.os,
                    platform: req.useragent!.platform,
                };
                const sessionToken = await createSession(updatePassword[0]!.userId, userAgent);

                return res
                    .status(200)
                    .cookie('session', sessionToken, {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'lax',
                        maxAge: 30 * 24 * 60 * 60 * 1000,
                    })
                    .json({
                        message: 'Password reset successfully',
                        updatePassword
                    });
            } else {
                return res.status(401).json({
                    message: RESPONSE_MESSAGES.INCORRECT_OTP
                });
            }
        } else {
            return res.status(401).json({
                message: RESPONSE_MESSAGES.OTP_EXPIRED
            });
        }
    } catch(err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        });
    }
});

// Login routes 
router.post('/login', async(req, res) => {
    const body = req.body

    // Validate inncorect fields in req body
    if(!body.email || !body.password) {
        return res.status(422).json({
            error: API_RESPONSE_MESSAGES[422]
        })
    }

    // Check user exists 
    try {
        const getUserInfo = 
            await db.select({
                id: users.id,
                password: users.passWord,
            })
            .from(users)
            .where(
                eq (users.email, body.email)
            ) 
        
        // Handle user dose not exists 
        if(getUserInfo.length === 0) {
            return res.status(404).json({
                error: API_RESPONSE_MESSAGES[404]
            })
        }

        // Verify hash if user exists 
        if(getUserInfo.length >= 1) {
            const passwordVerification: boolean = 
                await argon2.verify(getUserInfo[0]!.password!, body.password) 

            // Hanlde password verifcation
            if(passwordVerification == true) {

                const userAgent = {
                    browser: req.useragent!.browser,
                    os: req.useragent!.os,
                    platform: req.useragent!.platform,
                };

                const session = await createSession(getUserInfo[0]!.id, userAgent)
                
                return res.status(200)
                    .cookie('session', session, {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'lax',
                        maxAge: 30 * 24 * 60 * 60 * 1000,
                    })
                    .json({
                        message: 'Login successful'
                    })
            } else if(passwordVerification == false) {
                return res.status(403).json({
                    error: API_RESPONSE_MESSAGES[403]
                })
            } 
        }
    } catch(err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
          })
        }
    }
)

// Get current session info
router.get('/session', async (req, res) => {
    try {
        let sessionId: string | undefined = req.cookies?.session || req.cookies?.sessionId;
        if (!sessionId) {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                sessionId = authHeader.startsWith('Bearer ')
                    ? authHeader.slice(7).trim()
                    : authHeader.trim();
            }
        }
        if (!sessionId && req.headers['x-session-id']) {
            sessionId = String(req.headers['x-session-id']).trim();
        }

        if (!sessionId) {
            return res.status(400).json({
                error: API_RESPONSE_MESSAGES[400]
            });
        }

        const sessionInfo = await db.select({
            id: session.id,
            userId: session.userId,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            userAgent: session.userAgent,
            userName: users.name,
            userEmail: users.email,
            loginMethod: users.loginMethod,
        })
            .from(session)
            .innerJoin(users, eq(users.id, session.userId))
            .where(eq(session.id, sessionId));

        return sessionInfo.length === 0
            ? res.status(404).json(API_RESPONSE_MESSAGES[404])
            : res.status(200).json(sessionInfo[0]);
    } catch(err){
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        });
    }
});

// Get all sessions for the current user
router.get('/sessions', async (req, res) => {
    try {
        let sessionId: string | undefined = req.cookies?.session || req.cookies?.sessionId;
        if (!sessionId) {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                sessionId = authHeader.startsWith('Bearer ')
                    ? authHeader.slice(7).trim()
                    : authHeader.trim();
            }
        }
        if (!sessionId && req.headers['x-session-id']) {
            sessionId = String(req.headers['x-session-id']).trim();
        }

        if (!sessionId) {
            return res.status(400).json({
                error: API_RESPONSE_MESSAGES[400]
            });
        }

        const currentSession = await db.select({
            userId: session.userId
        })
            .from(session)
            .where(eq(session.id, sessionId));

        if (currentSession.length === 0) {
            return res.status(404).json(API_RESPONSE_MESSAGES[404]);
        }

        const sessionInfo = await getAllSessions(currentSession[0]!.userId);

        return sessionInfo == false
            ? res.status(404).json(API_RESPONSE_MESSAGES[404])
            : res.status(200).json(sessionInfo);
    } catch(err){
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        });
    }
});

// Delete one session
router.delete('/logout', async (req, res) => {
    const sessionId = req.cookies.session as string | undefined;

    if (!sessionId) {
        return res.status(400).json({
            error: API_RESPONSE_MESSAGES[400]
        });
    }

    const deleted = await revokeSessionById(sessionId);

    return deleted
        ? res.clearCookie('session').status(204).end()
        : res.status(500).json({ error: API_RESPONSE_MESSAGES[500] });
});

// Delete all sessions for one user
router.delete('/logout-all', async (req, res) => {
    try {
        const sessionId = req.cookies.session as string | undefined;

        if (!sessionId) {
            return res.status(400).json({
                error: API_RESPONSE_MESSAGES[400]
            });
        }

        const currentSession = await db.select({
            userId: session.userId
        })
            .from(session)
            .where(eq(session.id, sessionId));

        if (currentSession.length === 0) {
            return res.status(404).json(API_RESPONSE_MESSAGES[404]);
        }

        const deleted = await revokeAllSession(currentSession[0]!.userId);

        return deleted
            ? res.clearCookie('session').status(204).end()
            : res.status(500).json({ error: API_RESPONSE_MESSAGES[500] });
    } catch(err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        });
    }
});

export default router
