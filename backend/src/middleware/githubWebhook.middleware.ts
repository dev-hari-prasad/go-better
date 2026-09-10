import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextFunction, Request, Response } from 'express'

type RequestWithRawBody = Request & { rawBody?: Buffer }

export function githubWebhookSignatureMiddleware(
    req: RequestWithRawBody,
    res: Response,
    next: NextFunction,
) {
    const secret = process.env.GITHUB_WEBHOOK_VERIFICATION_SECRET
    const signature = req.headers['x-hub-signature-256']

    if (!secret || typeof signature !== 'string' || !req.rawBody) {
        return res.status(401).json({
            error: 'Invalid GitHub webhook signature',
        })
    }

    const receivedSignature = /^sha256=([0-9a-f]{64})$/i.exec(signature)?.[1]
    if (!receivedSignature) {
        return res.status(401).json({
            error: 'Invalid GitHub webhook signature',
        })
    }

    const expectedSignature = createHmac('sha256', secret)
        .update(req.rawBody)
        .digest('hex')

    const isValid = timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex'),
    )

    if (!isValid) {
        return res.status(401).json({
            error: 'Invalid GitHub webhook signature',
        })
    }

    next()
}