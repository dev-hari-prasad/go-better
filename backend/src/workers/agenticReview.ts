import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { Job, Worker } from 'bullmq'
import { connection, extractedPrContent, deadLetter, reviewNotification } from '../config/queue.ts'
import { CODE_REVIEW_SYSTEM_PROMPT, REVIEW_MODES } from "../config/prompts.ts";
import { log } from "node:console";

// API key and gateway formation
const apiKey = process.env.AI_GATEWAY_API_KEY;

if (!apiKey) {
  throw new Error("Missing AI_GATEWAY_API_KEY");
}

const openrouter = createOpenRouter({
  apiKey,
});

// Handle quque and process reviews

export const worker = new Worker(
    extractedPrContent.name,
    
    async (job) => {
      
      try {

        // Prepear final prompt and information for review
        
        const extractedPrInfo = job.data.body
        const sanitizedPayload = extractedPrInfo.sanitizedPayload
        const pullRequest = sanitizedPayload.pull_request

        const finalPrompt = {
            systemPrompt: CODE_REVIEW_SYSTEM_PROMPT,
            reviewMode: REVIEW_MODES.FOCUSED,
            context: extractedPrInfo
        }
          
        const { text } = await generateText({
            model: openrouter("nvidia/nemotron-3.5-lightning:free"),
            prompt: JSON.stringify(finalPrompt, null, 2),
        });


        // Update notification queue 
        await reviewNotification.add("notification", {
            repository: {
                id: sanitizedPayload.repository.id,
                name: sanitizedPayload.repository.name,
                fullName: sanitizedPayload.repository.full_name,
            },

            pullRequest: {
                id: pullRequest.id,
                number: sanitizedPayload.number,
                title: pullRequest.title,
                url: pullRequest.urls.html,
                author: {
                    id: pullRequest.author.id,
                    username: pullRequest.author.login,
                },
            },

            review: {
                status: "completed",
                result: text,
            },
        });

        } 
          catch (error) {
            throw error 
        }
    },
    { connection }
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

