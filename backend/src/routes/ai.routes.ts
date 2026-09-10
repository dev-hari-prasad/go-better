import express from "express";
import { API_RESPONSE_MESSAGES } from "../constants/apiResponse.ts";
import { db } from "../database/dbClient.ts";
import { and, asc, desc, eq, lt } from "drizzle-orm";
import pullRequests from "../database/schema/pullRequests.ts";
import conversationHistory, { aiGeneratetext, aiStreamText, saveMessage, trackModelUsage } from "../service/ai.service.ts";
import { GENERAL_AI_SYSTEM_PROMPT, TITLE_GENERATION_PROMPT } from "../config/prompts.ts";
import aiConversation from "../database/schema/aiConversations.ts";
import { aiMessage, thumbsFeedback, users } from "../database/schema/index.ts";
import { getDiff, getPRList } from "../harness/tools/toolsIndex.ts";

const router: express.Router = express.Router()
// Reponse route
router.post('/chat', async (req, res) => {
    const body = req.body
    const userId = req.userId!


    // userMessage object
    let userMessage: {
        message?: string;
        prInfo?: unknown;
        previousContext?: object;
    } = {};

    let prDbId: string | null = null;

    // Check if prId is set in the body and build the prompt with context in case it is set
    if (body.prId) {
        const isUuid = typeof body.prId === 'string' && body.prId.includes('-');
        const prInfo = await db
        .select()
        .from(pullRequests)
        .where(
            and(
                isUuid ? eq(pullRequests.id, body.prId) : eq(pullRequests.prId, body.prId),
                eq(pullRequests.userId, userId)
            )
        );
        prDbId = prInfo[0]?.id ?? null;

        userMessage = {
            message: body.message || '',
            prInfo: prInfo
        }
    } else {
        userMessage = {
            previousContext: body.previousContext ?? null,
            message: body.message
        }
    }

    //Handle chat request

    try {

        //Conversation ID
        let conversationId: string = body.conversationId || "";

        //set headers for streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.setHeader('Transfer-Encoding', 'chunked')
        res.setHeader(
            "Cache-Control", 
            "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Connection", "keep-alive");

        const requestedModel = body.llmModel || body.model || body.modelName || body.customModelData?.id || process.env.BASE_MODEL || 'mercury-2';
        const customModelData = body.customModelData || (body.customModel ? { id: requestedModel, isCustom: true } : undefined);

        // Generate conversation id and send to client
        if (!body.conversationId) {

            //Generate title
            let conversationTitle = ''
            try {
                // Try generating a title for the chat
                conversationTitle = await aiGeneratetext(
                    userId,
                    JSON.stringify(userMessage.message),
                    TITLE_GENERATION_PROMPT,
                    requestedModel,
                    customModelData
            )} catch(err) {
                // Use static title from the message if title generation not avilable
                const userMessageForTitle = userMessage.message ?? 'New Chat'; 
                conversationTitle = userMessageForTitle
                    .split(/\s+/)
                    .slice(0, 6)
                    .join(' ');
            }


            const [conversation] = await db.insert(aiConversation).values({
                title: conversationTitle,
                userId: userId,
                connectedPr: body.prTitle ?? null,
                connectedPrId: prDbId,
            }).returning({
                id: aiConversation.id
            })

            conversationId = conversation?.id || "";

            res.write(JSON.stringify({ conversationId: conversation?.id }) + "\n")
        }

        // Generate msg
        const stringMessage = JSON.stringify(userMessage)

        // Tool set avilable at this route
        const toolSet = {
            getDiff: getDiff(userId),
            getPRList: getPRList(userId)
        } 

        const result = await aiStreamText(
            userId, 
            stringMessage, 
            GENERAL_AI_SYSTEM_PROMPT, 
            toolSet, 
            requestedModel,
            customModelData
        );

        let fullResponse = "";
        const executedTools: string[] = [];

        // Stream response and tool events to client
        for await (const part of result.fullStream) {
            if (part.type === 'text-delta') {
                fullResponse = fullResponse + part.text;

                res.write(JSON.stringify({
                    type: "content",
                    content: part.text,
                }) + "\n");
            } else if (part.type === 'tool-call') {
                if (!executedTools.includes(part.toolName)) {
                    executedTools.push(part.toolName);
                }

                res.write(JSON.stringify({
                    type: "tool-call",
                    toolName: part.toolName,
                    toolCallId: part.toolCallId,
                    input: part.input,
                }) + "\n");
            } else if (part.type === 'tool-result') {
                res.write(JSON.stringify({
                    type: "tool-result",
                    toolName: part.toolName,
                    toolCallId: part.toolCallId,
                    output: part.output,
                }) + "\n");
            }
        }

        // Usage & cost (safely extracted so message saving is never interrupted)
        let usageData: any = null;
        try {
            const usage = await result.usage;
            usageData = usage;
            const finalStep = await result.finalStep;
            const gateway = finalStep?.providerMetadata?.gateway;
            const cost = gateway?.cost;
            console.log("Usage:", usage, "Cost:", cost);
        } catch (e) {
            console.warn("Usage/cost resolution skipped:", e);
        }

        // Token usage metric extraction
        const inputTokens = usageData?.inputTokens ?? usageData?.promptTokens ?? undefined;
        const outputToken = usageData?.outputTokens ?? usageData?.completionTokens ?? undefined;
        const cacheInputReadTokens = usageData?.cacheInputReadTokens ?? usageData?.promptTokensDetails?.cachedTokens ?? usageData?.cachedPromptTokens ?? undefined;
        const noCacheInputTokens = usageData?.noCacheInputTokens ?? (inputTokens !== undefined && cacheInputReadTokens !== undefined ? Math.max(0, inputTokens - cacheInputReadTokens) : inputTokens);
        const cacheInputWriteTokens = usageData?.cacheInputWriteTokens ?? undefined;
        const outputTextTokens = usageData?.outputTextTokens ?? usageData?.completionTokensDetails?.textTokens ?? undefined;
        const outputReasoningTokens = usageData?.outputReasoningTokens ?? usageData?.completionTokensDetails?.reasoningTokens ?? usageData?.reasoningTokens ?? undefined;

        // Save msg to msg table in db
        const llmModel = body.llmModel || body.model || body.modelName || body.customModelData?.id || process.env.BASE_MODEL || 'openai/gpt-4o';
        const userMessageToSave = userMessage.message ?? '';
        await saveMessage(
            userMessageToSave,
            fullResponse,
            conversationId,
            llmModel,
            inputTokens,
            outputToken,
            noCacheInputTokens,
            cacheInputReadTokens,
            cacheInputWriteTokens,
            outputTextTokens,
            outputReasoningTokens,
            executedTools.length > 0 ? executedTools : undefined
        );

        await trackModelUsage(userId, llmModel, inputTokens, outputToken);

        // End response
        return res.end()

    } catch (err: any) {
        console.error("Error in AI chat stream:", err);
        if (res.headersSent) {
            res.write(JSON.stringify({
                type: "error",
                error: API_RESPONSE_MESSAGES[500]
            }) + "\n");
            return res.end();
        }
        return res.status(500).json({
            error:  API_RESPONSE_MESSAGES[500]
        })
    }

})

// Retrive conversation history
router.post('/chat/:id', async(req, res) => {
    const conversationId = req.params.id
    const userId = req.userId!

    if (conversationId) {
        try {
            // Get messages in conversation
            const updatedAt = req.body?.updatedAt;
            const recentConversations: any = 
                await conversationHistory(conversationId, updatedAt, userId);

            // Send response to client 
            if (recentConversations && recentConversations.length > 0) {
                return res.status(200).json(recentConversations);
            } else {
                return res.status(204).send();
            }

        } catch(err) {
            console.error("Error fetching conversation messages:", err);
            return res.status(500).json({
                error: API_RESPONSE_MESSAGES[500]
            })
        }
    } else {
        // Handle missing conversation id in param
        return res.status(400).send()
    }
})

// Send list of recent conversations
router.get('/', async(req, res) => {
    const userId = req.userId!
    const lastUpdatedAt = req.query.lastUpdatedAt as string | undefined;

    if (lastUpdatedAt && isNaN(new Date(lastUpdatedAt).getTime())) {
        return res.status(422).json({
            message: "Invalid lastUpdatedAt, must be a valid date string"
        })
    }

    //List of recent conversations based on curosr pagination
    const recentConversations = await db.select({
        id: aiConversation.id,
        title: aiConversation.title,
        updatedAt: aiConversation.updatedAt,
    })
    .from(aiConversation) 
    .where(
            lastUpdatedAt
                ? and(
                    eq(aiConversation.userId, userId),
                    lt(aiConversation.updatedAt, new Date(lastUpdatedAt))
                )
                : eq(aiConversation.userId, userId)
        )
    .limit(20)
    .orderBy(desc(aiConversation.updatedAt))

    // Validate and share recentConversations list
    if(recentConversations.length === 0){
        // Handle empty responses with no conversations
        return res.status(204).json({
            message: "No recent conversation found"
        })
    } else {
        return res.status(200).json(recentConversations)
    }

})

// Feedback for msgs
router.patch('/feedback', async (req, res) => {
    try {
        const body = req.body;
        const userId = req.userId!;
        
        // Feedback
        // Can be either postive or negitive
        const userFeedback = body.userFeedback;
        const regeneratedMsg = body.regeneratedMsg;
        const messageId = body.messageId;

        if (!messageId) {
            return res.status(400).json({
                error: API_RESPONSE_MESSAGES[400],
                message: "messageId is required"
            });
        }

        // Validate user ownership by checking aiConversation.userId matches current userId
        const messageRecord = await db
            .select({
                id: aiMessage.id
            })
            .from(aiMessage)
            .innerJoin(aiConversation, eq(aiMessage.conversationId, aiConversation.id))
            .where(
                and(
                    eq(aiMessage.id, messageId),
                    eq(aiConversation.userId, userId)
                )
            )
            .limit(1);

        if (!messageRecord || messageRecord.length === 0) {
            return res.status(404).json({
                error: API_RESPONSE_MESSAGES[404],
                message: "Message not found or unauthorized"
            });
        }

        const updateData: {
            thumbsFeedback?: typeof thumbsFeedback.enumValues[number] | null;
            regenerated?: boolean;
        } = {};

        if (userFeedback !== undefined) {
            updateData.thumbsFeedback = userFeedback;
        }
        if (regeneratedMsg !== undefined) {
            updateData.regenerated = regeneratedMsg;
        }

        await db.update(aiMessage)
            .set(updateData)
            .where(eq(aiMessage.id, messageId));

        return res.status(202).json({
            message: 'updated'
        });

    } catch (err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        });
    }
});

export default router