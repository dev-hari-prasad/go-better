import express from 'express'
import { db } from '../database/dbClient.ts'
import { desc, eq, gte, sql, and, ilike, asc, lte, inArray } from 'drizzle-orm'
import pullRequests from '../database/schema/pullRequests.ts'
import repository from '../database/schema/repositories.ts'
import { API_RESPONSE_MESSAGES } from '../constants/apiResponse.ts'
import review from '../database/schema/review.ts'
import { title } from 'node:process'
import { reivewStatus } from '../types/ProcessingState.type.ts'

const router: express.Router = express.Router()
// Return a list of PRs
router.get(['/list', '/list/:lastUpdatedAt'], async (req, res) => {
    try {
        const currentUserId = req.userId!;

        const rawDate = req.params.lastUpdatedAt || req.query.lastUpdatedAt || req.query.updatedAt;
        let parsedDate: Date | null = null;
        if (rawDate) {
            const dateObj = isNaN(Number(rawDate))
                ? new Date(rawDate as string)
                : new Date(Number(rawDate));
            if (!isNaN(dateObj.getTime())) {
                parsedDate = dateObj;
            }
        }

        const conditions = [eq(pullRequests.userId, currentUserId)];
        if (parsedDate) {
            conditions.push(lte(pullRequests.updatedAt, parsedDate));
        }

        const query = req.query
        const searchQuery: string = typeof query.search === 'string' ? query.search : ''
        const statusQuery: string = typeof query.reviewStatus === 'string' ? query.reviewStatus : ''
        const repoQuery: string[] = Array.isArray(query.repo)
            ? (query.repo as string[])
            : typeof query.repo === 'string'
            ? [query.repo]
            : []

        const orderParam = typeof query.order === 'string' ? query.order.toLowerCase() : 'desc';
        const orderByClause = orderParam === 'asc' ? asc(pullRequests.updatedAt) : desc(pullRequests.updatedAt);

        const listData = await db.select({
            title: pullRequests.title,
            prId: pullRequests.prId,
            number: pullRequests.number,
            repositoryName: pullRequests.repositoryName,
            diff: pullRequests.diff,
            additions: pullRequests.additions,
            deletions: pullRequests.deletions,
            status: pullRequests.reviewStatus,
            createdAt: pullRequests.createdAt,
            headBranch: pullRequests.headBranch,
            baseBranch: pullRequests.baseBranch,
            updatedAt: pullRequests.updatedAt,
            htmlUrl: pullRequests.htmlUrl,
        })
        .from(pullRequests)
        .where(
            and(
                ...conditions,
                searchQuery ? ilike(pullRequests.title, `%${searchQuery}%`) : undefined,
                statusQuery && statusQuery !== 'all' ? ilike(pullRequests.reviewStatus, `%${statusQuery}%`) : undefined,
                repoQuery.length > 0 ? inArray(pullRequests.repositoryName, repoQuery) : undefined
            )
        )
        .limit(20)
        .orderBy(orderByClause);

        return res.status(200).json(listData);
    } catch(err) {
        console.error("Error fetching PR list:", err);
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        });
    }
})

//Condesed list for chat area
router.get('/list/summary', async (req, res) => {
    const userId = req.userId!
   
    const lastUpdatedAt = req.query.time ? 
            new Date(req.query.updatedAt as string)
            : new Date();
    
    const searchParam = req.query.search ? req.query.search : ''

    try {

        //Db operation
        const prList = await db.select({
            id: pullRequests.id,
            prId: pullRequests.prId,
            number: pullRequests.number,
            title: pullRequests.title,
            createdAt: pullRequests.createdAt,
            htmlUrl: pullRequests.htmlUrl,
        })
        .from(pullRequests)
        .where(and(
            gte(pullRequests.updatedAt, lastUpdatedAt),
            eq(pullRequests.userId, userId),
            ilike(pullRequests.title, `%${searchParam}%`)
        ))
        .limit(20)

        return res.status(200).json(prList)
    } catch(err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }
})


export default router