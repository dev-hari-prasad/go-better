import { Job, Worker } from 'bullmq'
import { connection, extractedPrContent, deadLetter, workerOptions } from '../config/queue.ts'
import { CODE_REVIEW_SYSTEM_PROMPT, REVIEW_MODES } from "../config/prompts.ts";
import { log } from "node:console";
import { db } from "../database/dbClient.ts";
import review from "../database/schema/review.ts";
import pullRequests from "../database/schema/pullRequests.ts";
import { eq } from "drizzle-orm";
import { parseReview } from "../utils/parseReview.ts";
import { aiGeneratetext } from "../service/ai.service.ts";

// API key and gateway formation
const apiKey = process.env.AI_API_KEY;

if (!apiKey) {
  throw new Error("Missing AI_API_KEY");
}

// Handle quque and process reviews
export const worker = new Worker(
    extractedPrContent.name,
    
    async (job) => {
      
      try {

        const startedAt = Date.now()
        log('ai review started')

        // Prepear final prompt and information for review
        
        const extractedPrInfo = job.data.body
        const sanitizedPayload = extractedPrInfo.sanitizedPayload
        const pullRequest = sanitizedPayload.pull_request

        // For when we insert data in db 
                const pullRequestDbID = sanitizedPayload.additionalInfo.pullRequestDbID

                if (!pullRequestDbID) {
                        throw new Error("Missing pullRequestDbID in job payload");
                }

                const [pullRequestOwner] = await db.select({ userId: pullRequests.userId })
                    .from(pullRequests)
                    .where(eq(pullRequests.id, pullRequestDbID))

                if (!pullRequestOwner) {
                    throw new Error("Pull request owner not found");
                }

        const finalPrompt = JSON.stringify({
            reviewMode: REVIEW_MODES.DEEP_DIVE,
            context: extractedPrInfo
        }, null, 2)

        // Review
        const text = await aiGeneratetext(pullRequestOwner.userId, finalPrompt, CODE_REVIEW_SYSTEM_PROMPT)

        log('review coemplted and now inserting to db')

        try {
            const reviewJson = parseReview(text)

            // Insert data into review table
            await db.insert(review).values({
                id: pullRequestDbID,
                pullRequestId: pullRequest.id,
                status: 'completed',
                triggeredBy: 'webhook',
                attemptNumber: job.attemptsMade,
                durationMs: Date.now() - startedAt,
                reviewSummary: reviewJson.summary.overview,
                rawReviewJSON: reviewJson,
                reviewedCommitSha: pullRequest.head.sha,
                completedAt: new Date()
            }).onConflictDoUpdate({
                target: review.id,
                set: {
                    status: 'completed',
                    attemptNumber: job.attemptsMade,
                    durationMs: Date.now() - startedAt,
                    reviewSummary: reviewJson.summary.overview,
                    rawReviewJSON: reviewJson,
                    reviewedCommitSha: pullRequest.head.sha,
                    completedAt: new Date()
                }
            })

            // Update pull request review status in pullRequests table
            const htmlUrl =
                pullRequest?.urls?.html ||
                pullRequest?.html_url ||
                pullRequest?._links?.html?.href ||
                (pullRequest?.head?.repo?.full_name && pullRequest?.number
                    ? `https://github.com/${pullRequest.head.repo.full_name}/pull/${pullRequest.number}`
                    : null);

            await db.update(pullRequests)
                .set({
                    reviewStatus: 'completed',
                    ...(htmlUrl ? { htmlUrl } : {}),
                    updatedAt: new Date()
                })
                .where(eq(pullRequests.id, pullRequestDbID))

            log('Put in table coempelted')
        } catch(err) {
            log(err)
            throw err
        }


        log('review coemplted and inserted to db')

        } 
          catch (error) {
            throw error 
        }
    },
    { connection, ...workerOptions, concurrency: 1 }
)

// Handle failure after retries fail
worker.on("failed", async (job: any, error: any) => {
    if (!job) return;

    const maxAttempts = job.opts.attempts ?? 1;

    if (job.attemptsMade >= maxAttempts) {
        await deadLetter.add("payload", {
            originalJobId: job.id,
            payload: job.data.body,
            error: error.message,
        });
    }
});

