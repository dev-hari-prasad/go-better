import { Job, Worker } from 'bullmq'
import { sanitizedPrPayload, extractedPrContent, connection, deadLetter } from '../config/queue.ts'

import { log } from 'node:console'

// Worker to extract info from urls such as diff
export const worker = new Worker(
    sanitizedPrPayload.name,
    async (job: Job) => {
        const sanitizedPayload = job.data

        try {

            // Inicate request 
            const [
                patchResponse,
                issueResponse,
                commentsResponse,
                commitsResponse,
                reviewCommentsResponse,
            ] = await Promise.all([
                fetch(sanitizedPayload.pull_request.urls.patch),
                fetch(sanitizedPayload.pull_request.urls.issue),
                fetch(sanitizedPayload.pull_request.urls.comments),
                fetch(sanitizedPayload.pull_request.urls.commits),
                fetch(sanitizedPayload.pull_request.urls.review_comments),
            ]);

            // Extract data from response object
            const contentRequest = {
                patch: await patchResponse.text(),
                issue: await issueResponse.json(),
                comments: await commentsResponse.json(),
                commits: await commitsResponse.json(),
                reviewComments: await reviewCommentsResponse.json(),
            };

            // Prep final payload 
            const extractedContent = {
                sanitizedPayload,
                contentRequest
            }

            // Insert payload to queue
            await extractedPrContent.add('extractedContent', {
                body: extractedContent,
            })

        } catch (error) {
            throw error
        }
    },
    { connection }
)

// Handle failuer to direct information into DLQ
worker.on('failed', async (job, error: any) => {
    if (!job) return

    const maxAttempts = job.opts.attempts ?? 1

    if (job.attemptsMade >= maxAttempts) {
        await deadLetter.add('payload', {
            originalJobId: job.id,
            payload: job.data,
            error: error?.message,
        })
    }
})