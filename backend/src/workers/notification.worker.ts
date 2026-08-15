
/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ FUTURE SCOPE                                                         │
 * │                                                                      │
 * │ This will be handled in a future version, as I don't see a strong    │
 * │ requirement for it at the moment. GitHub already handles email       │
 * │ notifications when the bot posts a comment.                          │
 * │                                                                      │
 * │ However, I do see the utility of this for other communication        │
 * │ platforms such as Slack and Microsoft Teams, so this can be covered  │
 * │ in V2.                                                               │
 * └──────────────────────────────────────────────────────────────────────┘
 */

// import { Worker, Job } from 'bullmq'
// import { reviewNotification, connection, deadLetter } from '../config/queue.ts'
// import { log } from 'node:console'

// export const worker = new Worker(
//     reviewNotification.name,
//     async (job) => {
//         try {

//             const notificationInfo = job.data.body ?? job.data
//             log('Hello there', notificationInfo)
            
//         } catch(error) {
//             throw error
//         }
//     }, { connection }
// )

// // Handle failure after retries fail
// worker.on("failed", async (job: any, error: any) => {
//     if (!job) return;

//     const maxAttempts = job.opts.attempts ?? 1;

//     if (job.attemptsMade >= maxAttempts) {
//         await deadLetter.add("payload", {
//             originalJobId: job.id,
//             payload: job.data.body ?? job.data,
//             error: error?.message,
//         });
//     }
// });

