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

const router: express.Router = express.Router()

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
        const sessionId = req.cookies.session as string | undefined;

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
            userAgent: session.userAgent
        })
            .from(session)
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
