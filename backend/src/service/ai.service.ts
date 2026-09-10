import { generateText, streamText, isStepCount } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import aiMessages, { thumbsFeedback } from '../database/schema/aiMessage.ts';
import { db } from '../database/dbClient.ts';
import { aiConversation, aiMessage, users } from '../database/schema/index.ts';
import { and, eq, asc, lt, gt, lte, sql } from 'drizzle-orm';
import type { openaiInterface } from '../types/ai.types.ts';
import { review, pullRequests } from '../database/schema/index.ts';
import byok from "../database/schema/byok.ts";
import redis from "../lib/redis/redisClient.ts";
import { REDIS_KEYS } from "../lib/redis/redisKeys.ts";
import workspaceSettings from "../database/schema/workspace.ts";
import { syncBuiltinESMExports } from "node:module";
import usageTable from "../database/schema/usage.ts";
import { goBetterBaseURL, goBetterFreeModels, perUserSpendLimit } from "../config/config.ts";
import { decryptApiKey } from "../utils/encryptApi.ts";
import { log } from 'node:console';


type ThumbsFeedback = (typeof thumbsFeedback.enumValues)[number];

type ByokConfig = {
    apiKey: string;
    baseURL?: string | undefined;
};

export function isFreeModel(modelName?: string): boolean {
    if (!modelName) return false;
    const name = modelName.trim().toLowerCase();
    const envBase = process.env.BASE_MODEL?.trim().toLowerCase();
    if (envBase && (name === envBase || name.endsWith(`/${envBase}`) || envBase.endsWith(`/${name}`))) {
        return true;
    }
    if (name in goBetterFreeModels) return true;

    for (const freeKey of Object.keys(goBetterFreeModels)) {
        const keyLower = freeKey.toLowerCase();
        if (
            name === keyLower ||
            name.endsWith(`/${keyLower}`) ||
            keyLower.endsWith(`/${name}`)
        ) {
            return true;
        }
    }
    return false;
}

function isGoBetterFreeModel(modelName?: string, customModelData?: CustomModelPayload): boolean {
    const candidateName = modelName || customModelData?.id || customModelData?.name;
    if (isFreeModel(candidateName)) return true;

    const providerId = customModelData?.providerId?.trim().toLowerCase();
    const platformProviders = ['gobetter', 'inception', 'inceptionlabs', 'mercury-2', 'mercury'];
    if (providerId && platformProviders.includes(providerId)) return true;

    if (customModelData?.baseURL) {
        const cleanBase = customModelData.baseURL.replace(/\/chat\/completions\/?$/, '').toLowerCase().trim();
        const defaultBase = goBetterBaseURL.replace(/\/chat\/completions\/?$/, '').toLowerCase().trim();
        const envBase = process.env.AI_BASE_URL?.replace(/\/chat\/completions\/?$/, '').toLowerCase().trim();
        if (cleanBase === defaultBase || (envBase && cleanBase === envBase)) {
            return true;
        }
    }

    return false;
}

function resolveModelId(modelName: string): string {
    const clean = modelName.trim();
    if (clean in goBetterFreeModels) return clean;
    for (const key of Object.keys(goBetterFreeModels)) {
        if (clean.toLowerCase().endsWith(`/${key.toLowerCase()}`)) {
            return key;
        }
    }
    return clean;
}

export interface CustomModelPayload {
    id?: string;
    name?: string;
    providerId?: string;
    providerLabel?: string;
    baseURL?: string;
    isCustom?: boolean;
}

export function isValidApiKey(key?: string | null): boolean {
    if (!key) return false;
    const trimmed = key.trim();
    if (trimmed.length < 5) return false;
    // Reject bullet character • (value 8226) or any non-ASCII character (causes ByteString error)
    if (trimmed.includes('•') || /[^\x00-\x7F]/.test(trimmed)) return false;
    // Reject placeholder masking dots or symbols
    if (/^[•*xX.\-_ ]+$/.test(trimmed)) return false;
    return true;
}

function resolveProviderBaseUrl(providerName?: string, customBaseUrl?: string | null, apiKey?: string): string | undefined {
    if (customBaseUrl) return customBaseUrl;
    const p = (providerName || '').toLowerCase().trim();
    if (p.includes('openrouter') || (apiKey && apiKey.startsWith('sk-or-'))) {
        return 'https://openrouter.ai/api/v1';
    }
    if (p.includes('inception') || p.includes('mercury')) {
        return 'https://api.inceptionlabs.ai/v1';
    }
    if (p.includes('deepseek')) {
        return 'https://api.deepseek.com/v1';
    }
    if (p.includes('google') || p.includes('gemini')) {
        return 'https://generativelanguage.googleapis.com/v1beta/openai';
    }
    return undefined;
}

async function checkByok(
    userId: string, 
    requestedModel?: string, 
    customModelData?: CustomModelPayload
): Promise<ByokConfig> {
    const isFree = isGoBetterFreeModel(requestedModel, customModelData);

    // 1. Fetch user's active BYOK records from Redis cache (or DB on miss)
    // Stored with ENCRYPTED API keys on Redis so we don't rerequest DB all the time
    let byokData: Array<{
        id?: string;
        modelProviderName?: string;
        modelApiKey: string;
        customBaseUrl?: string | null;
        enabled?: boolean | null;
    }> | null = null;

    try {
        const cachedValue = await redis.get(REDIS_KEYS.byok(userId));
        if (cachedValue !== null) {
            byokData = JSON.parse(cachedValue);
        }
    } catch {
        byokData = null;
    }

    if (!byokData) {
        byokData = await db.select({
            id: byok.id,
            modelProviderName: byok.modelProviderName,
            modelApiKey: byok.modelAPIKey,
            customBaseUrl: byok.customBaseURL,
            enabled: byok.enabled,
        })
        .from(byok)
        .where(and(eq(byok.enabled, true), eq(byok.userId, userId)));

        // Store encrypted API keys in Redis
        await redis.set(REDIS_KEYS.byok(userId), JSON.stringify(byokData), 'EX', 86400);
    }

    // Filter to only records that have a genuine, valid (non-masked) API key
    const activeValidByok = (byokData || []).filter((b) => {
        if (!b.modelApiKey) return false;
        try {
            const dec = decryptApiKey(b.modelApiKey);
            return isValidApiKey(dec);
        } catch {
            return false;
        }
    });

    // 2. Check user's current spend to see if they have enough usage
    const [usageStatus] = await db.select({ totalCost: usageTable.totalCost })
        .from(usageTable)
        .where(eq(usageTable.userId, userId))
        .limit(1);

    const currentSpend = Number(usageStatus?.totalCost ?? 0);
    const hasUsage = currentSpend < perUserSpendLimit;

    // 3. Routing:
    // If requesting our free model:
    // "if user dose have usage and that is enough to satisfy it then its ok let them use our free one else dont"
    if (isFree) {
        const hasPlatformKey = isValidApiKey(process.env.AI_API_KEY);
        if (hasUsage && hasPlatformKey) {
            await redis.set(REDIS_KEYS.freeUsage(userId), 'true', 'EX', 3600);
            return {
                apiKey: process.env.AI_API_KEY!,
                baseURL: customModelData?.baseURL || process.env.AI_BASE_URL || goBetterBaseURL,
            };
        } else if (hasUsage && !hasPlatformKey) {
            // Platform key is not set, check if user configured their own BYOK key
            const userByok = activeValidByok[0];
            if (userByok?.modelApiKey) {
                const dec = decryptApiKey(userByok.modelApiKey);
                if (isValidApiKey(dec)) {
                    return {
                        apiKey: dec,
                        baseURL: resolveProviderBaseUrl(userByok.modelProviderName, userByok.customBaseUrl || customModelData?.baseURL, dec),
                    };
                }
            }
            throw new Error(
                'AI service is not configured on the server (missing AI_API_KEY). Please add your own API key in Settings -> BYOK & Keys.'
            );
        } else {
            // Free limit exceeded. Check if user configured their own BYOK key
            const userByok = activeValidByok[0];
            if (userByok?.modelApiKey) {
                const dec = decryptApiKey(userByok.modelApiKey);
                if (isValidApiKey(dec)) {
                    return {
                        apiKey: dec,
                        baseURL: resolveProviderBaseUrl(userByok.modelProviderName, userByok.customBaseUrl || customModelData?.baseURL, dec),
                    };
                }
            }
            await redis.set(REDIS_KEYS.freeUsage(userId), 'false');
            throw new Error(
                'You have exceeded your spending limit. Please configure your LLM providers in dashboard'
            );
        }
    }

    // If NOT our free model (e.g. Custom Model or user BYOK provider):
    let matchedByok: {
        id?: string;
        modelProviderName?: string;
        modelApiKey: string;
        customBaseUrl?: string | null;
        enabled?: boolean | null;
    } | undefined;

    if (customModelData) {
        // Match by providerId or provider name
        if (customModelData.providerId) {
            const pId = customModelData.providerId.toLowerCase().trim();
            matchedByok = activeValidByok.find((b) => {
                const bName = (b.modelProviderName || '').toLowerCase().trim();
                return bName === pId || (b.id && b.id === customModelData.providerId);
            });
        }

        // Match by customBaseUrl / baseURL
        if (!matchedByok && customModelData.baseURL) {
            const reqBase = customModelData.baseURL.replace(/\/chat\/completions\/?$/, '').toLowerCase().trim();
            matchedByok = activeValidByok.find((b) => {
                if (!b.customBaseUrl) return false;
                const bBase = b.customBaseUrl.replace(/\/chat\/completions\/?$/, '').toLowerCase().trim();
                return bBase === reqBase || reqBase.startsWith(bBase) || bBase.startsWith(reqBase);
            });
        }

        // If customModelData isCustom, match any enabled custom provider with a valid key
        if (!matchedByok && customModelData.isCustom) {
            matchedByok = activeValidByok.find((b) => {
                const bName = (b.modelProviderName || '').toLowerCase().trim();
                return bName === 'custom' || Boolean(b.customBaseUrl);
            });
        }
    }

    // Match by requestedModel prefix or name (e.g. 'openrouter/deepseek/r1' -> 'openrouter', 'openai/gpt-4o' -> 'openai')
    if (!matchedByok && requestedModel) {
        const reqLower = requestedModel.toLowerCase().trim();
        const prefix = reqLower.includes('/') ? reqLower.split('/')[0] : '';

        matchedByok = activeValidByok.find((b) => {
            const bName = (b.modelProviderName || '').toLowerCase().trim();
            if (prefix && bName === prefix) return true;
            if (bName && reqLower.includes(bName)) return true;
            return false;
        });
    }

    // If matched BYOK record found with a verified API key:
    if (matchedByok?.modelApiKey) {
        const decKey = decryptApiKey(matchedByok.modelApiKey);
        if (isValidApiKey(decKey)) {
            const resolvedBaseURL = resolveProviderBaseUrl(
                matchedByok.modelProviderName,
                customModelData?.baseURL || matchedByok.customBaseUrl,
                decKey
            );
            return {
                apiKey: decKey,
                baseURL: resolvedBaseURL,
            };
        }
    }

    // Universal gateway fallback: if user has OpenRouter configured with a valid key, it can serve almost any model
    const openRouterByok = activeValidByok.find((b) => (b.modelProviderName || '').toLowerCase().includes('openrouter'));
    if (openRouterByok?.modelApiKey) {
        const decKey = decryptApiKey(openRouterByok.modelApiKey);
        if (isValidApiKey(decKey)) {
            return {
                apiKey: decKey,
                baseURL: resolveProviderBaseUrl(openRouterByok.modelProviderName, openRouterByok.customBaseUrl, decKey),
            };
        }
    }

    // Fallback to first configured valid BYOK provider if available
    if (activeValidByok.length > 0) {
        const fallback = activeValidByok[0];
        if (fallback?.modelApiKey) {
            const decKey = decryptApiKey(fallback.modelApiKey);
            if (isValidApiKey(decKey)) {
                return {
                    apiKey: decKey,
                    baseURL: resolveProviderBaseUrl(fallback.modelProviderName, fallback.customBaseUrl, decKey),
                };
            }
        }
    }

    // Platform fallback if user has platform usage remaining and server has AI_API_KEY configured:
    if (hasUsage && isValidApiKey(process.env.AI_API_KEY)) {
        await redis.set(REDIS_KEYS.freeUsage(userId), 'true', 'EX', 3600);
        return {
            apiKey: process.env.AI_API_KEY!,
            baseURL: customModelData?.baseURL || process.env.AI_BASE_URL || goBetterBaseURL,
        };
    }

    // If user requested a custom model but has no valid key configured:
    if (customModelData?.isCustom) {
        throw new Error(
            `No valid API key configured for custom provider "${customModelData.name || customModelData.providerId || 'Custom'}". Please add your API key in Settings -> BYOK & Keys.`
        );
    }

    if (!hasUsage) {
        await redis.set(REDIS_KEYS.freeUsage(userId), 'false');
        throw new Error(
            'You have exceeded your spending limit. Please configure your LLM providers in dashboard'
        );
    }

    throw new Error(
        'No valid API key configured for the requested model. Please configure your LLM providers in Settings -> BYOK & Keys.'
    );
}

const value = process.env.OPEN_AI_INTERFACE ?? 'chat';

if (value !== 'chat' && value !== 'responses') {
  throw new Error(
    `Invalid OPEN_AI_INTERFACE: "${value}". Expected "chat" or "responses".`
  );
}

const openaiInterfaceMethod: openaiInterface = value as openaiInterface;

function createUserModel(config: ByokConfig, modelName?: string) {
    const rawBase = config.baseURL;
    const baseURL = rawBase ? rawBase.replace(/\/chat\/completions\/?$/, '') : undefined;

    // Strict ASCII sanitization: strip any non-ASCII characters to guarantee no ByteString/Undici crash
    const sanitizedApiKey = (config.apiKey || '').trim().replace(/[^\x00-\x7F]/g, '');
    if (!sanitizedApiKey || sanitizedApiKey.length < 5) {
        throw new Error(
            'No valid API key configured for the requested model. Please configure a valid API key in Settings -> BYOK & Keys.'
        );
    }

    const openai = createOpenAI({
        apiKey: sanitizedApiKey,
        ...(baseURL ? { baseURL } : {})
    });
    const targetModel = modelName ? resolveModelId(modelName) : (process.env.BASE_MODEL || 'mercury-2');
    return openai[openaiInterfaceMethod](targetModel);
}

// Track model token usage per 1 million tokens and upsert to usage table
export async function trackModelUsage(
    userId: string, 
    modelName: string, 
    inputTokens?: number, 
    outputTokens?: number
) {
    const resolvedKey = resolveModelId(modelName);
    const cost = goBetterFreeModels[resolvedKey as keyof typeof goBetterFreeModels];
    if (!cost) return;

    const inTokens = inputTokens ?? 0;
    const outTokens = outputTokens ?? 0;
    if (inTokens === 0 && outTokens === 0) return;

    const inputCost = (inTokens * cost.inputCost) / 1_000_000;
    const outputCost = (outTokens * ('outputCost' in cost ? cost.outputCost : (cost as any).outPutCost)) / 1_000_000;

    await db.insert(usageTable)
    .values({
        userId,
        inputCost: String(inputCost),
        outputCost: String(outputCost),
    })
    .onConflictDoUpdate({
        target: usageTable.userId,
        set: {
            inputCost: sql`${usageTable.inputCost} + ${inputCost}`,
            outputCost: sql`${usageTable.outputCost} + ${outputCost}`,
            updatedAt: new Date(),
        },
    });

    log('Wrote usage');
}

//  Generate and return text blob
export async function aiGeneratetext (
    userId: string, 
    inputPrompt: string, 
    systemPrompt: string,
    modelNameParam?: string,
    customModelData?: CustomModelPayload
): Promise<string> {
    const modelName = modelNameParam || customModelData?.id || process.env.BASE_MODEL || 'mercury-2';
    const byokConfig = await checkByok(userId, modelName, customModelData);
    const model = createUserModel(byokConfig, modelName);
    const { text, usage } = await generateText({
            model,
            prompt: inputPrompt,
            system: systemPrompt,
        }
    );

    await trackModelUsage(userId, modelName, usage.inputTokens, usage.outputTokens);

    return text;
}

// Generate and Stream text with AI SDK
export async function aiStreamText (
    userId: string, 
    inputPrompt: string, 
    systemPrompt: string, 
    tools?: Record<string, any>,
    modelNameParam?: string,
    customModelData?: CustomModelPayload
): Promise<ReturnType<typeof streamText>> {
    const modelName = modelNameParam || customModelData?.id || process.env.BASE_MODEL || 'mercury-2';
    const byokConfig = await checkByok(userId, modelName, customModelData);
    const model = createUserModel(byokConfig, modelName);
    return streamText({
        model,
        prompt: inputPrompt,
        system: systemPrompt,
        tools: tools ?? {},
        stopWhen: isStepCount(5),
    });
}

// Save conversation msgs to db
export async function saveMessage(
        inputMessage: string,
        outputMessage: string,
        conversationId: string,
        llmModel?: string,
        inputTokens?: number,
        outputToken?: number,
        noCacheInputTokens?: number | undefined,
        cacheInputReadTokens?: number | undefined,
        cacheInputWriteTokens?: number | undefined,
        outputTextTokens?: number | undefined,
        outputReasoningTokens?: number | undefined,
        usedToolCalls?: string[],
    ){
        try {
            const now = new Date();
            await db.insert(aiMessages).values({
                inputMessage,
                noCacheInputTokens,
                cacheInputReadTokens,
                cacheInputWriteTokens,
                outputMessage,
                outputTextTokens,
                outputReasoningTokens,
                usedToolCalls: usedToolCalls ?? null,
                llmModel: llmModel || process.env.BASE_MODEL || 'mercury-2',
                inputTokens,
                outputToken,
                conversationId: conversationId || undefined,
                createdAt: now,
                updatedAt: now,
            });

            if (conversationId) {
                await db.update(aiConversation)
                    .set({ updatedAt: now })
                    .where(eq(aiConversation.id, conversationId));
            }
            
            return true;
        } catch(err) {
            console.error("Error saving message:", err);
            return false;
        }
    }

// Get recent msgs from conversationId
export default async function 
    conversationHistory(conversationId: string, updatedAt?: string, userId?: string) {
        try {
            const conditions = [
                eq(aiMessage.conversationId, conversationId)
            ];

            if (userId) {
                conditions.push(eq(aiConversation.userId, userId));
            }

            if (updatedAt) {
                conditions.push(lte(aiMessage.updatedAt, new Date(updatedAt)));
            }

            const recentMessages = await db.select({
                id: aiMessage.id,
                messageid: aiMessage.id,
                inputMessage: aiMessage.inputMessage,
                outputMessage: aiMessage.outputMessage,
                usedToolCalls: aiMessage.usedToolCalls,
                thumbsFeedback: aiMessage.thumbsFeedback,
                messageCount: aiMessage.messageCount,
                llmModel: aiMessage.llmModel,
                inputTokens: aiMessage.inputTokens,
                noCacheInputTokens: aiMessage.noCacheInputTokens,
                cacheInputReadTokens: aiMessage.cacheInputReadTokens,
                cacheInputWriteTokens: aiMessage.cacheInputWriteTokens,
                outputToken: aiMessage.outputToken,
                outputTextTokens: aiMessage.outputTextTokens,
                outputReasoningTokens: aiMessage.outputReasoningTokens,
                createdAt: aiMessage.createdAt,
                updatedAt: aiMessage.updatedAt,
            })
            .from(aiMessage)
            .leftJoin(aiConversation, eq(aiMessage.conversationId, aiConversation.id))
            .where(and(...conditions))
            .orderBy(asc(aiMessage.createdAt))
            .limit(100);

            return recentMessages
        } catch(err) {
            console.error("Error fetching conversation history:", err);
            return []
        }
    }

// Funtion to get review data
export async function reviewData(prId: string, userId: string) {
    const reviewData = await db.select({
                //Review info
                id: review.id,
                prId: review.pullRequestId,
                reviewStatus: review.status,
                reviewSummary: review.reviewSummary,
                reviewRawJSON: review.rawReviewJSON,
                reviewdSha: review.reviewedCommitSha,
                reviewStartedAt: review.startedAt,
                reviewCompletedAt: review.completedAt,

                //PR Info
                repositoryId: pullRequests.repositoryId,
                prTitle: pullRequests.title,
                prState: pullRequests.state,
                prIsDraft: pullRequests.draft,
                prIsMerged: pullRequests.merged,
                prHeadBranch: pullRequests.headBranch,
                prBaseBranch: pullRequests.baseBranch,
                prCommitCount: pullRequests.commitsCount,
                prAddtions: pullRequests.additions,
                prDeletions: pullRequests.deletions,
                changedFiles: pullRequests.changedFiles,
                prCreatedAt: pullRequests.createdAt,
                prUpdatedAt: pullRequests.updatedAt,
                prClosedAt: pullRequests.closedAt,
                prMergredAt: pullRequests.mergedAt,
                prDiff: pullRequests.diff,
                prHtmlUrl: pullRequests.htmlUrl,
            })
            .from(review)
            .leftJoin(pullRequests, eq(review.pullRequestId, pullRequests.prId))
            .where(and(
                eq(review.pullRequestId, prId),
                eq(pullRequests.userId, userId)
            ));

    if (reviewData.length === 0) {
        return await db.select({
            id: review.id,
            prId: review.pullRequestId,
            reviewStatus: review.status,
            reviewSummary: review.reviewSummary,
            reviewRawJSON: review.rawReviewJSON,
            reviewdSha: review.reviewedCommitSha,
            reviewStartedAt: review.startedAt,
            reviewCompletedAt: review.completedAt,
            repositoryId: pullRequests.repositoryId,
            prTitle: pullRequests.title,
            prState: pullRequests.state,
            prIsDraft: pullRequests.draft,
            prIsMerged: pullRequests.merged,
            prHeadBranch: pullRequests.headBranch,
            prBaseBranch: pullRequests.baseBranch,
            prCommitCount: pullRequests.commitsCount,
            prAddtions: pullRequests.additions,
            prDeletions: pullRequests.deletions,
            changedFiles: pullRequests.changedFiles,
            prCreatedAt: pullRequests.createdAt,
            prUpdatedAt: pullRequests.updatedAt,
            prClosedAt: pullRequests.closedAt,
            prMergredAt: pullRequests.mergedAt,
            prDiff: pullRequests.diff,
            prHtmlUrl: pullRequests.htmlUrl,
        })
        .from(review)
        .leftJoin(pullRequests, eq(review.pullRequestId, pullRequests.prId))
        .where(eq(review.pullRequestId, prId));
    }

    return reviewData;
}