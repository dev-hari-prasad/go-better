import express from 'express'
import { db } from '../database/dbClient.ts';
import review from '../database/schema/review.ts';
import pullRequests from '../database/schema/pullRequests.ts';
import { API_RESPONSE_MESSAGES } from '../constants/apiResponse.ts';
import { eq, and, desc,  } from 'drizzle-orm';
import { sanitizedPrPayload } from '../config/queue.ts';
import { reviewData } from '../service/ai.service.ts';
import { log } from 'node:console';

const router: express.Router = express.Router()
//Individual review info
router.get('/information/:prId', async (req, res) => {
    const prId = req.params.prId;
    const currentUserId = req.userId!;

    if(prId) {
        try{
            const reviewDataResult = await reviewData(prId, currentUserId)
            return res.status(200).json(reviewDataResult)
        } catch(err) {
            return res.status(500).json({
                error: API_RESPONSE_MESSAGES[500]
            })
        }
    } else {
        return res.status(400).json({
            message: API_RESPONSE_MESSAGES[400]
        })
    }
})

// Review list for overview page
router.get('/list', async(req, res) => { 
    try {
        const currentUserId = req.userId!;

        const reviewList = await db.select({
            id: review.id,
            prId: pullRequests.prId,
            prDbId: pullRequests.id,
            prNumber: pullRequests.number,
            prTitle: pullRequests.title,
            repoFullName: pullRequests.repositoryName,
            status: review.status,
            startedAt: review.startedAt,
            completedAt: review.completedAt,
            reviewSummary: review.reviewSummary,
            rawReviewJSON: review.rawReviewJSON,
        })
        .from(review)
        .leftJoin(pullRequests, eq(review.pullRequestId, pullRequests.prId))
        .where(eq(pullRequests.userId, currentUserId))
        .orderBy(desc(review.startedAt))
        .limit(3);

        const formatted = reviewList.map((r) => {
            const raw = r.rawReviewJSON as any;
            const comments: any[] = Array.isArray(raw?.comments) ? raw.comments : [];
            const criticalCount = comments.filter((c: any) => String(c?.severity).toUpperCase() === 'CRITICAL').length;
            const warningCount = comments.filter((c: any) => ['MAJOR', 'WARNING'].includes(String(c?.severity).toUpperCase())).length;
            const suggestionCount = comments.filter((c: any) => ['MINOR', 'INFO', 'SUGGESTION'].includes(String(c?.severity).toUpperCase())).length;
            const totalFindings = comments.length || raw?.summary?.findingsCount || (criticalCount + warningCount + suggestionCount);
            
            let score: number = 88;
            if (raw?.confidence?.overall != null) {
                const val = Number(raw.confidence.overall);
                score = val <= 1 ? Math.round(val * 100) : Math.round(val);
            } else if (totalFindings === 0) {
                score = 98;
            } else {
                score = Math.max(50, Math.min(99, 100 - criticalCount * 15 - warningCount * 5 - suggestionCount * 2));
            }

            const rawDate = r.completedAt || r.startedAt;
            const reviewedAt = rawDate instanceof Date ? rawDate.toISOString() : (rawDate || new Date().toISOString());

            return {
                id: r.id,
                prId: r.prId ? String(r.prId) : undefined,
                pullRequestId: r.prId ? String(r.prId) : undefined,
                prDbId: r.prDbId,
                prNumber: r.prNumber ?? 1,
                prTitle: r.prTitle || 'Untitled Pull Request',
                repoFullName: r.repoFullName || 'repository',
                status: r.status,
                score,
                summary: r.reviewSummary || raw?.summary?.overview || '',
                criticalCount,
                warningCount,
                suggestionCount,
                totalFindings,
                reviewedAt,
            };
        });

        return res.status(200).json(formatted);
    } catch(err) {
        log(err)
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }
})

// PR to trigger re-review
router.post('/:prId', async(req, res) => {
    try {
        const prId = req.params.prId || req.body.prId;
        const currentUserId = req.userId!;

        let [rawPrData] = await db.select({
             blob: pullRequests.bodyBlob
        })
        .from(pullRequests)
        .where(
            and(
                eq(pullRequests.prId, prId),
                eq(pullRequests.userId, currentUserId)
            )
        );

        if (!rawPrData?.blob) {
            [rawPrData] = await db.select({
                blob: pullRequests.bodyBlob
            })
            .from(pullRequests)
            .where(eq(pullRequests.prId, prId));
        }

        if (!rawPrData?.blob) {
            return res.status(404).json({ error: 'Pull request not found' })
        }

        const prData = rawPrData.blob
        await sanitizedPrPayload.add('sanitizedPayload', prData)

        return res.status(200).json({ 
            message: "Review started."
        })
    } catch(err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }
})

export default router