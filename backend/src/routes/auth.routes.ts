import express from 'express'
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
import {
    buildGitHubAuthorizationUrl,
    createGitHubOAuthRequest,
    getGitHubOAuthConfiguration,
    resolveClientRedirect,
    statesMatch,
} from '../lib/githubOAuth.ts';
import { encryptApiKey } from '../utils/encryptApi.ts';
import { syncUserRepositories } from '../service/githubRepository.service.ts';

const router: express.Router = express.Router()

const OAUTH_COOKIE_MAX_AGE = 10 * 60 * 1000;
const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

type PendingGitHubOAuth = {
    state: string;
    codeVerifier: string;
    clientUrl: string;
    userId?: string;
    intent?: 'login' | 'connect';
};

function cookieOptions(maxAge: number) {
    const secure = process.env.NODE_ENV === 'production'
        || process.env.API_BASE_URL?.startsWith('https://') === true;

    return {
        httpOnly: true,
        secure,
        // `none` permits a separately hosted frontend to send the session to
        // its API. Local HTTP development must use lax because browsers reject
        // SameSite=None cookies without Secure.
        sameSite: secure ? 'none' as const : 'lax' as const,
        maxAge,
    };
}

function authRedirectUrl(clientUrl: string, result: 'success' | 'error', message?: string) {
    const redirectUrl = new URL(clientUrl);
    redirectUrl.searchParams.set('github_auth', result);
    if (message) {
        redirectUrl.searchParams.set('message', message);
    }

    return redirectUrl.toString();
}

function authRedirect(res: express.Response, clientUrl: string, result: 'success' | 'error', message?: string) {
    return res.redirect(authRedirectUrl(clientUrl, result, message));
}

function readPendingOAuth(value: string | null): PendingGitHubOAuth | null {
    if (!value) {
        return null;
    }

    try {
        const parsed = JSON.parse(value) as Partial<PendingGitHubOAuth>;
        return typeof parsed.state === 'string'
            && typeof parsed.codeVerifier === 'string'
            && typeof parsed.clientUrl === 'string'
            ? parsed as PendingGitHubOAuth
            : null;
    } catch {
        return null;
    }
}

function clearOAuthCookies(res: express.Response) {
    return res
        .clearCookie('github_oauth_state')
        .clearCookie('github_oauth_verifier')
        .clearCookie('github_client_redirect')
        .clearCookie('github_connect_user_id')
        .clearCookie('github_oauth_intent');
}

function clearAndRedirect(res: express.Response, clientUrl: string, message: string) {
    clearOAuthCookies(res);
    return authRedirect(res, clientUrl, 'error', message);
}

// Start the GitHub OAuth authorization-code flow. The callback URL is fixed
// by API_BASE_URL; callers can only choose a return URL on CLIENT_URL's origin.
router.get('/github', async (req, res) => {
    let configuration;
    try {
        configuration = getGitHubOAuthConfiguration();
    } catch (err) {
        console.error('[AUTH-GITHUB] Invalid OAuth URL configuration', err);
        return res.status(500).json({ error: 'GitHub authentication is not configured' });
    }

    if (!configuration.clientId) {
        console.error('[AUTH-GITHUB] OAuth client ID is not configured');
        return res.status(500).json({ error: 'GitHub authentication is not configured' });
    }

    const requestedRedirect = typeof req.query.redirect_uri === 'string'
        ? req.query.redirect_uri
        : undefined;
    const clientUrl = resolveClientRedirect(requestedRedirect, configuration.clientUrl);

    let sessionId: string | undefined = req.cookies?.session || req.cookies?.sessionId;
    if (!sessionId && typeof req.query.session_id === 'string') {
        sessionId = req.query.session_id.trim();
    }
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

    let connectingUserId: string | undefined;
    if (sessionId) {
        try {
            const sessionData = await redis.get(REDIS_KEYS.session(sessionId));
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                if (Array.isArray(parsed) && parsed[0]?.userId) {
                    connectingUserId = parsed[0].userId;
                } else if (parsed?.userId) {
                    connectingUserId = parsed.userId;
                }
            }
            if (!connectingUserId) {
                const [dbSession] = await db.select({ userId: session.userId }).from(session).where(eq(session.id, sessionId));
                if (dbSession) {
                    connectingUserId = dbSession.userId;
                }
            }
        } catch (err) {
            console.warn('[AUTH-GITHUB] Error reading session for connect intent', err);
        }
    }

    const isConnect = req.query.intent === 'connect' || (Boolean(connectingUserId) && req.query.intent === 'connect');
    const oauthRequest = createGitHubOAuthRequest();
    const pendingOAuth: PendingGitHubOAuth = {
        ...oauthRequest,
        clientUrl,
        ...(isConnect && connectingUserId ? { userId: connectingUserId, intent: 'connect' } : {}),
    };

    try {
        await redis.set(`oauth:github:${oauthRequest.state}`, JSON.stringify(pendingOAuth), 'EX', 600);
    } catch (err) {
        // The HTTP-only cookie is a short-lived fallback for a transient Redis
        // failure. Session creation still requires Redis and will fail closed.
        console.warn('[AUTH-GITHUB] Could not cache OAuth request', err);
    }

    let response = res
        .cookie('github_oauth_state', oauthRequest.state, cookieOptions(OAUTH_COOKIE_MAX_AGE))
        .cookie('github_oauth_verifier', oauthRequest.codeVerifier, cookieOptions(OAUTH_COOKIE_MAX_AGE))
        .cookie('github_client_redirect', clientUrl, cookieOptions(OAUTH_COOKIE_MAX_AGE));

    if (isConnect && connectingUserId) {
        response = response
            .cookie('github_connect_user_id', connectingUserId, cookieOptions(OAUTH_COOKIE_MAX_AGE))
            .cookie('github_oauth_intent', 'connect', cookieOptions(OAUTH_COOKIE_MAX_AGE));
    }

    const connectScope = process.env.GITHUB_CONNECT_SCOPE || 'repo,user:email';
    return response.redirect(buildGitHubAuthorizationUrl(configuration, oauthRequest, isConnect ? connectScope : undefined));
});

// Exchange GitHub's temporary code, create/sign in the local user, and issue
// the same HTTP-only session cookie used by email login.
router.get('/github/callback', async (req, res) => {
    let configuration;
    try {
        configuration = getGitHubOAuthConfiguration();
    } catch (err) {
        console.error('[AUTH-GITHUB] Invalid OAuth URL configuration', err);
        return res.status(500).json({ error: 'GitHub authentication is not configured' });
    }

    const state = req.query.state;
    const savedState = req.cookies.github_oauth_state as string | undefined;
    const savedVerifier = req.cookies.github_oauth_verifier as string | undefined;
    const savedRedirect = req.cookies.github_client_redirect as string | undefined;
    const savedConnectUserId = req.cookies.github_connect_user_id as string | undefined;
    const savedIntent = req.cookies.github_oauth_intent as string | undefined;
    let redisOAuth: PendingGitHubOAuth | null = null;

    if (typeof state === 'string') {
        try {
            redisOAuth = readPendingOAuth(await redis.get(`oauth:github:${state}`));
        } catch (err) {
            console.warn('[AUTH-GITHUB] Could not read OAuth request', err);
        }
    }

    const validRedisState = Boolean(redisOAuth && statesMatch(redisOAuth.state, state));
    const validCookieState = Boolean(savedVerifier && statesMatch(savedState, state));
    const targetClientUrl = resolveClientRedirect(
        validRedisState ? redisOAuth?.clientUrl : savedRedirect,
        configuration.clientUrl,
    );
    const codeVerifier = validRedisState ? redisOAuth?.codeVerifier : savedVerifier;
    const connectUserId = redisOAuth?.userId || (savedIntent === 'connect' ? savedConnectUserId : undefined);
    const isConnectFlow = Boolean(connectUserId && (redisOAuth?.intent === 'connect' || savedIntent === 'connect'));

    if (!validRedisState && !validCookieState) {
        console.warn('[AUTH-GITHUB] Rejected callback with invalid OAuth state');
        return authRedirect(res, targetClientUrl, 'error', 'Invalid GitHub authentication state');
    }

    if (typeof state === 'string' && validRedisState) {
        try {
            await redis.del(`oauth:github:${state}`);
        } catch (err) {
            console.warn('[AUTH-GITHUB] Could not consume OAuth state', err);
        }
    }

    if (!configuration.clientId || !configuration.clientSecret || !codeVerifier) {
        console.error('[AUTH-GITHUB] OAuth credentials are not configured');
        return clearAndRedirect(res, targetClientUrl, 'GitHub authentication is not configured');
    }

    if (typeof req.query.error === 'string') {
        return clearAndRedirect(res, targetClientUrl, 'GitHub authorization was cancelled');
    }

    const code = req.query.code;
    if (typeof code !== 'string') {
        return clearAndRedirect(res, targetClientUrl, 'GitHub did not return an authorization code');
    }

    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: configuration.clientId,
                client_secret: configuration.clientSecret,
                code,
                redirect_uri: configuration.callbackUrl,
                code_verifier: codeVerifier,
            }),
        });
        const tokenData = await tokenResponse.json().catch(() => ({})) as {
            access_token?: string;
        };

        if (!tokenResponse.ok || !tokenData.access_token) {
            console.error('[AUTH-GITHUB] Token exchange failed', { status: tokenResponse.status });
            return clearAndRedirect(res, targetClientUrl, 'GitHub token exchange failed');
        }

        const githubHeaders = {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${tokenData.access_token}`,
            'X-GitHub-Api-Version': '2022-11-28',
        };
        const profileResponse = await fetch('https://api.github.com/user', { headers: githubHeaders });
        const profile = await profileResponse.json().catch(() => ({})) as {
            id?: number;
            login?: string;
            name?: string | null;
            email?: string | null;
        };

        if (!profileResponse.ok || !profile.id || !profile.login) {
            console.error('[AUTH-GITHUB] Profile lookup failed', { status: profileResponse.status });
            return clearAndRedirect(res, targetClientUrl, 'Could not read GitHub profile');
        }

        let email = profile.email?.trim().toLowerCase() || null;
        if (!email) {
            const emailsResponse = await fetch('https://api.github.com/user/emails', { headers: githubHeaders });
            if (emailsResponse.ok) {
                const emails = await emailsResponse.json().catch(() => []) as Array<{
                    email?: string;
                    primary?: boolean;
                    verified?: boolean;
                }>;
                email = emails.find((entry) => entry.primary && entry.verified)?.email?.trim().toLowerCase()
                    || emails.find((entry) => entry.verified)?.email?.trim().toLowerCase()
                    || null;
            }
        }

        if (!email) {
            return clearAndRedirect(res, targetClientUrl, 'GitHub did not provide a verified email address');
        }

        const githubId = String(profile.id);
        const [githubUser] = await db.select().from(users).where(eq(users.githubID, githubId));
        const [emailUser] = await db.select().from(users).where(eq(users.email, email));

        if (isConnectFlow && connectUserId) {
            const [targetUser] = await db.select().from(users).where(eq(users.id, connectUserId));
            if (!targetUser) {
                return clearAndRedirect(res, targetClientUrl, 'User account not found');
            }

            if (githubUser && githubUser.id !== connectUserId) {
                console.warn('[AUTH-GITHUB] GitHub identity is already linked to another account');
                return clearAndRedirect(res, targetClientUrl, 'This GitHub account is already connected to another user account');
            }

            if (targetUser.githubID && String(targetUser.githubID) !== githubId) {
                console.warn('[AUTH-GITHUB] Refused to replace an existing GitHub account link');
                return clearAndRedirect(res, targetClientUrl, 'Your account is already linked to a different GitHub account');
            }

            const encryptedToken = encryptApiKey(tokenData.access_token);

            await db.update(users).set({
                githubID: githubId,
                githubProfile: profile.login,
                githubAccessToken: encryptedToken,
                isGithubConnected: true,
                lastLoginAt: new Date(),
            }).where(eq(users.id, connectUserId));

            try {
                await syncUserRepositories(connectUserId, tokenData.access_token);
            } catch (repoErr) {
                console.warn('[AUTH-GITHUB] Failed to sync repositories on connect:', repoErr);
            }

            let sessionToken = req.cookies?.session || req.cookies?.sessionId;
            if (!sessionToken) {
                sessionToken = await createSession(connectUserId, {
                    browser: req.useragent?.browser,
                    os: req.useragent?.os,
                    platform: req.useragent?.platform,
                });
            }

            let resBuilder = clearOAuthCookies(res);
            if (sessionToken) {
                resBuilder = resBuilder.cookie('session', sessionToken, cookieOptions(SESSION_COOKIE_MAX_AGE));
            }
            return resBuilder.redirect(authRedirectUrl(targetClientUrl, 'success', 'GitHub account connected successfully'));
        }

        if (githubUser && emailUser && githubUser.id !== emailUser.id) {
            console.warn('[AUTH-GITHUB] GitHub identity and email resolve to different accounts');
            return clearAndRedirect(res, targetClientUrl, 'This GitHub account conflicts with an existing account');
        }

        const existingUser = githubUser || emailUser;
        if (existingUser?.githubID && String(existingUser.githubID) !== githubId) {
            console.warn('[AUTH-GITHUB] Refused to replace an existing GitHub account link');
            return clearAndRedirect(res, targetClientUrl, 'This email is already linked to another GitHub account');
        }

        const encryptedToken = encryptApiKey(tokenData.access_token);

        const userValues = {
            name: profile.name?.trim() || profile.login,
            email,
            githubID: githubId,
            githubProfile: profile.login,
            githubAccessToken: encryptedToken,
            loginMethod: 'github' as const,
            isGithubConnected: true,
            lastLoginAt: new Date(),
        };
        const userRecord = existingUser
            ? (await db.update(users).set(userValues).where(eq(users.id, existingUser.id)).returning({
                id: users.id,
            }))[0]
            : (await db.insert(users).values({
                ...userValues,
                isActive: true,
                emailNotification: true,
            }).returning({ id: users.id }))[0];

        if (!userRecord) {
            console.error('[AUTH-GITHUB] User upsert returned no record');
            return clearAndRedirect(res, targetClientUrl, 'Could not create user account');
        }

        try {
            await syncUserRepositories(userRecord.id, tokenData.access_token);
        } catch (repoErr) {
            console.warn('[AUTH-GITHUB] Failed to sync repositories on login:', repoErr);
        }

        const sessionToken = await createSession(userRecord.id, {
            browser: req.useragent?.browser,
            os: req.useragent?.os,
            platform: req.useragent?.platform,
        });
        if (!sessionToken) {
            console.error('[AUTH-GITHUB] Session creation failed');
            return clearAndRedirect(res, targetClientUrl, 'Could not create session');
        }

        return clearOAuthCookies(res)
            .cookie('session', sessionToken, cookieOptions(SESSION_COOKIE_MAX_AGE))
            .redirect(authRedirectUrl(targetClientUrl, 'success'));
    } catch (err) {
        console.error('[AUTH-GITHUB] Callback failed', err);
        return clearAndRedirect(res, targetClientUrl, 'GitHub authentication failed');
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
                    .cookie('session', sessionToken, cookieOptions(SESSION_COOKIE_MAX_AGE))
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
                    .cookie('session', sessionToken, cookieOptions(SESSION_COOKIE_MAX_AGE))
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
                    .cookie('session', sessionToken, cookieOptions(SESSION_COOKIE_MAX_AGE))
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
                    .cookie('session', session, cookieOptions(SESSION_COOKIE_MAX_AGE))
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
            return res.status(200).json({ authenticated: false });
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
            isGithubConnected: users.isGithubConnected,
            githubProfile: users.githubProfile,
            githubID: users.githubID,
        })
            .from(session)
            .innerJoin(users, eq(users.id, session.userId))
            .where(eq(session.id, sessionId));

        const sess = sessionInfo[0];
        if (!sess) {
            return res.status(200).json({ authenticated: false });
        }

        return res.status(200).json({
            authenticated: true,
            ...sess,
            isGithubConnected: Boolean(sess.isGithubConnected || sess.githubID),
            githubProfile: sess.githubProfile ?? null,
            githubID: sess.githubID ?? null,
        });
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
