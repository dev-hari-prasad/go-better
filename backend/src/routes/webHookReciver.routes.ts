import express from "express"
import { log } from 'node:console'
import { unprocessedWebhookPayload } from '../config/queue.ts' 
import { API_RESPONSE_MESSAGES } from "../constants/apiResponse.ts";
import { webhookToDatabase } from "../service/gitHubWebhook.service.ts";

const router: express.Router = express.Router()

router.get('/', (_req, res) => {
    res.status(200).json({
        "message": API_RESPONSE_MESSAGES[200]
    })
} )

router.post('/', async (req, res) => {

    const githubWebhookEvent = req.headers["x-github-event"]

    // Handle github events that are not suppourted
    if(githubWebhookEvent !== "pull_request"){
        return res.status(422).json({
            "error": API_RESPONSE_MESSAGES[422],
            "message": "Event type not supported"
        })
    }

    const body = req.body

    try {
        // Insert PR data into database
        const pullRequestDbId = await webhookToDatabase(body)

        // Insert PR webhook data to Bull Queue
        await unprocessedWebhookPayload.add('webhook',{body, pullRequestDbId})

        log("New webhook event received and processed")
       
        return res.status(200).json({
            "message": API_RESPONSE_MESSAGES[200]
        })
            
    } catch (err) {
        console.error('Failed to enqueue webhook payload', err)
        return res.status(500).json({
            "error": API_RESPONSE_MESSAGES[500],
            "message": "Failed to process webhook payload"
        })
    }
})

export default router