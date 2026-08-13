// BullMQ config file
import { Queue } from "bullmq";
import Redis from "../lib/redis/redisClient.ts";

export const connection = Redis

// Queue to store unprocessed webhook payload from GitHub
export const unprocessedWebhookPayload = 
    new Queue('unprocessedWebhookPayload', 
        { 
            connection , 
            defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            },
            removeOnComplete: true
        }
    })

// Queue to store sanitizedPayload that is cleaned with only the required infromation
export const sanitizedPrPayload = 
    new Queue('sanitizedPayload', 
        { 
            connection , 
            defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            },
            removeOnComplete: true
        }
    })

// Queue to store extracted content such as PR diff etc..
export const extractedPrContent = 
    new Queue('extractedContent', 
        { 
            connection , 
            defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            },
            removeOnComplete: true
        }
    })

// Queue to store final noftication 
export const reviewNotification = 
    new Queue('reviewNotification', 
        { 
            connection , 
            defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            },
            removeOnComplete: true
        }
    })

// State storing queue 
export const stateLog = 
    new Queue('stateLog', 
        { 
            connection , 
            defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            },
            removeOnComplete: true
        }
    })

// Dead letter queue
export const deadLetter =
    new Queue('deadLetteQuque', 
        { 
            connection , 
            defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            },
            removeOnComplete: true
        }
    })