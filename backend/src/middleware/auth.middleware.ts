import { NextFunction, Request, Response } from "express";
import { API_RESPONSE_MESSAGES } from "../constants/apiResponse.ts";
import redis from "../lib/redis/redisClient.ts";
import { REDIS_KEYS } from "../lib/redis/redisKeys.ts";
import { db } from "../database/dbClient.ts";
import { session, users } from "../database/schema/index.ts";
import { eq } from "drizzle-orm";

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

async function authMiddleware
    (req: Request, res: Response, next: NextFunction) {
    try {
    // Extract session from cookies (session or sessionId), Authorization header, or x-session-id
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
        return res.status(401).json({
            error: API_RESPONSE_MESSAGES[401]
        })
    }

    if(sessionId) {

        let sessionInfo: { userId: string } | null = null;

        // Get session from Redis
        const sessionInfoFromRedis = await redis.get(REDIS_KEYS.session(sessionId))
        if (sessionInfoFromRedis !== null) {
            const cachedSessionInfo = JSON.parse(sessionInfoFromRedis) as { userId: string }[];
            const cachedUserId = cachedSessionInfo[0]?.userId;
            if (!cachedUserId) {
                return res.status(401).json({
                    error: API_RESPONSE_MESSAGES[401]
                })
            }
            sessionInfo = { userId: cachedUserId };
            req.userId = cachedUserId;
        }
    
        //Make db call if session info unavilable in redis
        if(sessionInfo == null) {
            const sessionInfoFromDb = await db.select({
                id: session.id,
                userId: session.userId,
                expiresAt: session.expiresAt
            })
            .from(session)
            .where(eq(
                session.id, sessionId
            ))

            // Return unautrozied incase session is not in the database or has expired
            if (sessionInfoFromDb.length === 0) {
                // Fallback: check if sessionId is directly a valid userId in users table
                const userExists = await db.select({ id: users.id }).from(users).where(eq(users.id, sessionId)).limit(1);
                if (userExists.length > 0) {
                    req.userId = userExists[0]!.id;
                    return next();
                }

                return res.status(401).json({
                    error: API_RESPONSE_MESSAGES[401]
                })
            }

            if (
                sessionInfoFromDb[0]?.expiresAt !== null &&
                sessionInfoFromDb[0]?.expiresAt !== undefined &&
                sessionInfoFromDb[0].expiresAt <= new Date()
            ) {
                await db.delete(session)
                    .where(eq(session.id, sessionId))

                return res.clearCookie('session').clearCookie('sessionId').status(401).json({
                    error: API_RESPONSE_MESSAGES[401]
                })
            } 
            
            // Handle session is valid 
            else if (
                sessionInfoFromDb.length !== 0 &&
                (sessionInfoFromDb[0]?.expiresAt === null ||
                    sessionInfoFromDb[0]?.expiresAt === undefined ||
                    sessionInfoFromDb[0]!.expiresAt > new Date())
            ) {
                // Insert session to Redis
                const sessionInfoFromDbString = JSON.stringify(sessionInfoFromDb)
                await redis.set(
                    REDIS_KEYS.session(sessionInfoFromDb[0]!.id),
                    sessionInfoFromDbString,
                    'EX',
                    30 * 24 * 60 * 60
                )
                sessionInfo = sessionInfoFromDb[0]!;

                req.userId = sessionInfoFromDb[0]!.userId;
            }
        }

    }

    // Allow next
    next()

    } catch (error) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }

}

export default authMiddleware