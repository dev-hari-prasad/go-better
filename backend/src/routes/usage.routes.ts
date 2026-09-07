import express from 'express'
import { db } from '../database/dbClient.ts'
import {usage} from '../database/schema/index.ts'
import { eq } from 'drizzle-orm'
import { error } from 'node:console'
import { API_RESPONSE_MESSAGES } from '../constants/apiResponse.ts'
import { perUserSpendLimit } from '../config/config.ts'

const router: express.Router = express.Router()

async function handleGetUsage(req: express.Request, res: express.Response) {
    const userId = req.userId!

    try {
        const usageData = await db.select({
            totalCost: usage.totalCost
        })
        .from(usage)
        .where(eq(
            usage.userId, userId
        ))
        .limit(1)

        const rawCost = usageData[0]?.totalCost
        const costData = {
            utilizedCost: rawCost != null ? Number(rawCost) : 0,
            allowedExpenditureLimit: perUserSpendLimit
        }

        return res.status(200).json(costData)
    } catch(err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }
}

// Get usage data for a given user
router.get('/', handleGetUsage)
router.get('/:userId', handleGetUsage)

export default router