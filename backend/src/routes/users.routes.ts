import express from 'express'
import { db } from '../database/dbClient.ts';
import users from '../database/schema/users.ts';
import { API_RESPONSE_MESSAGES } from '../constants/apiResponse.ts';
import redis from '../lib/redis/redisClient.ts';
import argon2 from 'argon2';
import sendEmail from '../lib/resendEmail.ts';
import { otpEmailData } from '../constants/email.ts';
import otpVerification from '../database/schema/otpVerification.ts';
import { aiConversation, aiMessage, byok, pullRequests, repositories, review, session, usage, workspaceSettings } from '../database/schema/index.ts';
import { eq, inArray } from 'drizzle-orm';
import { REDIS_KEYS } from '../lib/redis/redisKeys.ts';
import { RESPONSE_MESSAGES } from '../constants/responseMessages.ts';

const router: express.Router = express.Router()

router.patch('/', async (req, res) => {
    const { name, email, emailNotification } = req.body ?? {};
    const updates: Partial<typeof users.$inferInsert> = {};

    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({
                error: 'Name must be a non-empty string'
            });
        }
        updates.name = name.trim();
    }

    if (email !== undefined) {
        if (typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({
                error: 'Email must be valid'
            });
        }
        updates.email = email.trim().toLowerCase();
    }

    if (emailNotification !== undefined) {
        if (typeof emailNotification !== 'boolean') {
            return res.status(400).json({
                error: 'emailNotification must be a boolean'
            });
        }
        updates.emailNotification = emailNotification;
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            error: 'At least one profile field is required'
        });
    }

    try {
        const updatedUser = await db.update(users)
            .set(updates)
            .where(eq(users.id, req.userId!))
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                emailNotification: users.emailNotification
            });

        if (updatedUser.length === 0) {
            return res.status(404).json({
                error: API_RESPONSE_MESSAGES[404]
            });
        }

        return res.status(200).json(updatedUser[0]);
    } catch (err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        });
    }
});

router.delete('/', async (req, res) => {
    const userId = req.userId!;

    try {
        const userSessions = await db
            .select({ id: session.id })
            .from(session)
            .where(eq(session.userId, userId));

        await db.transaction(async (tx) => {
            const userConversations = tx
                .select({ id: aiConversation.id })
                .from(aiConversation)
                .where(eq(aiConversation.userId, userId));

            await tx.delete(aiMessage)
                .where(inArray(aiMessage.conversationId, userConversations));
            await tx.delete(aiConversation)
                .where(eq(aiConversation.userId, userId));
            await tx.delete(review)
                .where(inArray(review.pullRequestId, tx
                    .select({ prId: pullRequests.prId })
                    .from(pullRequests)
                    .where(eq(pullRequests.userId, userId))));
            await tx.delete(pullRequests)
                .where(eq(pullRequests.userId, userId));
            await tx.delete(repositories)
                .where(eq(repositories.repositoryOwner, userId));
            await tx.delete(workspaceSettings)
                .where(eq(workspaceSettings.userId, userId));
            await tx.delete(byok)
                .where(eq(byok.userId, userId));
            await tx.delete(usage)
                .where(eq(usage.userId, userId));
            await tx.delete(session)
                .where(eq(session.userId, userId));
            await tx.delete(users)
                .where(eq(users.id, userId));
        });

        const sessionKeys = userSessions.map(({ id }) => REDIS_KEYS.session(id));
        await redis.del(...sessionKeys, REDIS_KEYS.byok(userId));

        return res
            .clearCookie('session')
            .clearCookie('sessionId')
            .status(204)
            .send();
    } catch (err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        });
    }
});



export default router