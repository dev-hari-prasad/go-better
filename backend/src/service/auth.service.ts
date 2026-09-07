import crypto from 'node:crypto'
import { REDIS_KEYS } from '../lib/redis/redisKeys.ts'
import redis from '../lib/redis/redisClient.ts'
import { db } from '../database/dbClient.ts'
import { session } from '../database/schema/index.ts'
import { eq } from 'drizzle-orm'

// Create user session 
export async function createSession(userId: string, userAgent: object) {
    try{
        // Generates 32 secure random bytes and converts to a hex string
        const sessionId = crypto.randomBytes(32).toString('hex')

        // Determine expiration date and other params
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; 
        const futureTimestamp = new Date(Date.now() + thirtyDaysInMs);

        //Create session with the db
        const sessionDbInfo = await db.insert(session)
            .values({
                userId: userId,
                expiresAt: futureTimestamp,
                userAgent: userAgent ?? 'Unknow'
            }).returning({
                id: session.id,
                userId: session.userId,
                expiresAt: session.expiresAt
            })

        // Set the ID in Redis
        const sessionData = JSON.stringify(sessionDbInfo)
        await redis.set(
            REDIS_KEYS.session(sessionDbInfo[0]!.id),
            sessionData,
            'EX',
            30 * 24 * 60 * 60
        )

        return sessionDbInfo[0]!.id

    }catch(err) {
        return 
            false
    } 
    
}

// Revoke single session
export async function revokeSessionById(sessionId: string) {
    try {
        // Delete session from cache
        await redis.del(REDIS_KEYS.session(sessionId))
        
        // Delete session data from database 
        await db.delete(session).where(
            eq(session.id, sessionId)
        )

        return true
    } catch(err) {
        return false 
    }
}

// Revoke all sessions
export async function revokeAllSession(userId: string) {
    try {

        // Get all active session from database
        const activeSessions = await db.select({
            id: session.id
        })
            .from(session)
            .where(eq(session.userId, userId))

        // Delete sessions from cache
        const sessionKeys = activeSessions.map(({ id }) => REDIS_KEYS.session(id))
        await redis.del(...sessionKeys)

        // Delete session data from database 
        await db.delete(session).where(
            eq(session.userId, userId)
        )

        return true
    } catch(err) {
        return false 
    }
}

// Get all session info 
export async function getAllSessions(userId: string) {
    try {
        // Get all session info from database
        const allSessions = await db.select({
            id: session.id,
            createdAt: session.createdAt,
            userAgent: session.userAgent
        })
        .from(session)
        .where(eq(session.userId, userId))

        return allSessions
    } catch(err) {
        return false
    } 
}