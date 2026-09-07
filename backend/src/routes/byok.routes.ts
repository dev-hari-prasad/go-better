import express from 'express'
import { db } from '../database/dbClient.ts'
import { API_RESPONSE_MESSAGES } from '../constants/apiResponse.ts'
import byok from '../database/schema/byok.ts'
import { encryptApiKey, decryptApiKey } from '../utils/encryptApi.ts'
import { FetchModelListParams, getModelList, getCleanModelList, parseAndCleanModels } from '../service/byok.service.ts'
import { and, desc, eq, sql } from 'drizzle-orm'
import { goBetterBaseUrl, goBetterFreeModels } from '../config/config.ts'
import redis from '../lib/redis/redisClient.ts'
import { REDIS_KEYS } from '../lib/redis/redisKeys.ts'

const router: express.Router = express.Router()

function getProviderNameAliases(nameOrId: string): string[] {
    const raw = String(nameOrId || '').trim().toLowerCase()
    if (!raw) return []

    const set = new Set<string>([raw])
    if (raw === 'inception' || raw === 'inceptionlabs' || raw === 'inception labs' || raw === 'mercury') {
        set.add('inception')
        set.add('inceptionlabs')
        set.add('inception labs')
        set.add('mercury')
    } else if (raw === 'openai' || raw === 'open-ai' || raw === 'open ai') {
        set.add('openai')
        set.add('open-ai')
        set.add('open ai')
    } else if (raw === 'openrouter' || raw === 'open-router' || raw === 'open router') {
        set.add('openrouter')
        set.add('open-router')
        set.add('open router')
    } else if (raw === 'vercel' || raw === 'vercel ai gateway' || raw === 'vercel-ai-gateway') {
        set.add('vercel')
        set.add('vercel ai gateway')
        set.add('vercel-ai-gateway')
    }
    return Array.from(set)
}

// Get list of APIs setup by user
router.get('/', async(req, res) => {
    const userId = req.userId!
    try {
        const byokList = await db.select({
            id: byok.id,
            modelProviderName: byok.modelProviderName,
            customModels: byok.customModels,
            customBaseUrl: byok.customBaseURL,
            enabled: byok.enabled,
            availableModels: byok.availableModels,
            createdAt: byok.createdAt
        }).from(byok).where(
            eq(byok.userId, userId)
        ).orderBy(
            desc(byok.createdAt)
        )

        res.status(200).json(byokList)
    } catch(err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }
})

// Register / update BYOK API key and parse cleaned model metadata
router.post('/', async (req, res) => {
    const body = req.body

    if (!body || !body.apiKey) {
        return res.status(400).json({
            error: 'API key is required'
        })
    }

    try {
        const isMaskedKey = (key?: string) => {
            if (!key) return true;
            const trimmed = key.trim();
            return trimmed.includes('•') || /[^\x00-\x7F]/.test(trimmed) || /^[•*xX.\-_ ]+$/.test(trimmed);
        };

        const providerName = body.modelProviderName || body.modelProvider || 'custom'
        const customUrl = body.customBaseUrl || body.customBaseURL || null
        const isCustomModel = Boolean(
            Array.isArray(body.customModels)
                ? body.customModels.length > 0
                : body.customModel || body.customModels
        )

        // Parse cleaned model metadata if custom models / selections are provided
        let cleanedModels: any[] = []
        if (Array.isArray(body.customModels) && body.customModels.length > 0) {
            try {
                cleanedModels = parseAndCleanModels(body.customModels, body.customModels)
            } catch {
                cleanedModels = []
            }
        }

        const targetUserId = req.userId!
        const isUuid = Boolean(body.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(body.id)))
        const aliases = getProviderNameAliases(providerName)

        // Check if key for this user & provider exists to update or insert
        const existing = await db
            .select({ id: byok.id, modelAPIKey: byok.modelAPIKey })
            .from(byok)
            .where(
                and(
                    eq(byok.userId, targetUserId),
                    isUuid
                        ? eq(byok.id, body.id)
                        : sql`LOWER(${byok.modelProviderName}) IN (${sql.join(aliases.map(a => sql`${a}`), sql`, `)})`
                )
            )

        const existingRecord = Array.isArray(existing) && existing.length > 0 ? existing[0] : null
        let savedId = existingRecord?.id

        if (existingRecord?.id) {
            const updatePayload: any = {
                modelProviderName: providerName,
                customModels: isCustomModel,
                customBaseURL: customUrl,
                enabled: body.enabled ?? true,
                availableModels: cleanedModels.length > 0 ? cleanedModels : null,
                updatedAt: new Date(),
            };

            // Only update the encrypted key if a REAL new API key was provided (not masked bullets)
            if (!isMaskedKey(body.apiKey)) {
                updatePayload.modelAPIKey = encryptApiKey(body.apiKey.trim());
            }

            await db
                .update(byok)
                .set(updatePayload)
                .where(eq(byok.id, existingRecord.id))
        } else {
            if (isMaskedKey(body.apiKey)) {
                return res.status(400).json({
                    error: 'Cannot register provider with masked placeholder key. Please provide a real API key.'
                });
            }

            const encryptedApi: string = encryptApiKey(body.apiKey.trim())
            const inserted = await db.insert(byok).values({
                userId: targetUserId,
                modelProviderName: providerName,
                modelAPIKey: encryptedApi,
                customModels: isCustomModel,
                customBaseURL: customUrl,
                enabled: body.enabled ?? true,
                availableModels: cleanedModels.length > 0 ? cleanedModels : null,
            }).returning({ id: byok.id })
            savedId = inserted[0]?.id
        }

        // Invalidate Redis BYOK cache so next lookup fetches fresh encrypted keys
        await redis.del(REDIS_KEYS.byok(targetUserId))

        return res.status(201).json({
            message: API_RESPONSE_MESSAGES[201],
            id: savedId,
            models: cleanedModels,
        })

    } catch(err) {
        console.error('Failed to register BYOK key:', err)
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500] || 'Internal server error'
        })
    }
})

// Try to get list of models
router.post('/model-list', async (req, res) => {
    const body = req.body

    const modelListParams: FetchModelListParams = {
        modelProviderName: body.modelProviderName || body.modelProvider,
        customBaseUrl: (body.customBaseURL || body.customBaseUrl) ?? null,
        apiKey: body.apiKey ?? null
    }
    const rawModels = await getModelList(modelListParams)
    const byokModels: any[] = Array.isArray(rawModels) ? [...rawModels] : rawModels ? [rawModels] : []
    const goBetterModels = {
        id: '1',
        modelProviderName: "goBetter",
        customModels: false,
        customBase: goBetterBaseUrl,
        availableModels: [
            goBetterFreeModels
        ]
    }

    byokModels.push(goBetterModels)

    if (byokModels.length > 0) {
        return res.status(200).json({
            byokModels
        })
    } else {
        return res.status(204).json({
            message: API_RESPONSE_MESSAGES[204]
        })
    }
})

// Get model list for rendering models in the UI (with Redis lookup for Vercel, OpenRouter, and OpenAI)
router.get('/model-list', async(req, res) => {
    const userId = req.userId!
    try {
        const byokList = await db.select({
            id: byok.id,
            modelProviderName: byok.modelProviderName,
            modelAPIKey: byok.modelAPIKey,
            customModels: byok.customModels,
            customBase: byok.customBaseURL,
            availableModels: byok.availableModels,
        })
        .from(byok)
        .where(
            and(
                eq(byok.userId, userId),
                eq(byok.enabled, true),
        ))
        .orderBy(desc(byok.createdAt))

        // Wire Redis model lookup from byok.service.ts for each provider
        const enrichedList = await Promise.all(
            byokList.map(async (entry) => {
                let available = entry.availableModels

                if (!available || !Array.isArray(available) || available.length === 0) {
                    try {
                        let apiKey: string | undefined = undefined
                        if (entry.modelAPIKey) {
                            apiKey = decryptApiKey(entry.modelAPIKey)
                        }
                        const rawModels = await getModelList({
                            modelProviderName: entry.modelProviderName,
                            customBaseUrl: entry.customBase ?? undefined,
                            apiKey,
                        })
                        if (rawModels) {
                            const listArray = Array.isArray(rawModels) ? rawModels : rawModels?.data || []
                            available = parseAndCleanModels(listArray)
                        }
                    } catch (err) {
                        console.error(`Failed to lookup models for provider ${entry.modelProviderName}:`, err)
                    }
                }

                return {
                    id: entry.id,
                    modelProviderName: entry.modelProviderName,
                    customModels: entry.customModels,
                    customBase: entry.customBase,
                    availableModels: available || null,
                }
            })
        )

        const goBetterModels = {
            id: '1',
            modelProviderName: "goBetter",
            customModels: false,
            customBase: goBetterBaseUrl,
            availableModels: [
                goBetterFreeModels
            ]
        }
        enrichedList.push(goBetterModels)

        res.status(200).json(enrichedList)
    } catch(err) {
        console.error('Failed to get model list:', err)
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }
})

// Endpoint to get providers list
router.get('/providers', async(req, res) => {
    const userId = req.userId!
    try {
        const providerList  = await db
            .select({
                id: byok.id,
                modelProviderName: byok.modelProviderName,
                enabled: byok.enabled,
                customModels: byok.customModels,
                customBaseURL: byok.customBaseURL,
                availabelModel: byok.availableModels
            })
            .from(byok)
            .where(eq(byok.userId, userId))
            .orderBy(desc(byok.updatedAt))

            return res.status(200).json(providerList)
    } catch(err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }
})

router.delete('/providers/:providerId', async(req, res) => {
    const userId = req.userId!
    const providerId = req.params.providerId

    try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerId)
        const aliases = getProviderNameAliases(providerId)

        await db.delete(byok)
        .where(and(
            eq(byok.userId, userId),
            isUuid
                ? eq(byok.id, providerId)
                : sql`LOWER(${byok.modelProviderName}) IN (${sql.join(aliases.map(a => sql`${a}`), sql`, `)})`
        ))

        await redis.del(REDIS_KEYS.byok(userId))

        return res.status(204).send()
    } catch(err) {
        console.error('Failed to delete BYOK provider:', err)
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }
})

// PATCH handler to partially update BYOK provider fields using whitelist filtering
const handlePatchProvider = async (req: express.Request, res: express.Response) => {
    const userId = req.userId!
    const providerId = req.params.providerId || req.body?.id || req.body?.providerId || req.body?.modelProviderName || req.body?.modelProvider
    const body = req.body || {}

    if (!providerId) {
        return res.status(400).json({
            error: 'Provider ID is required for update'
        })
    }

    // Support camelCase aliases if sent by client
    if (body.customBaseUrl !== undefined && body.customBaseURL === undefined) {
        body.customBaseURL = body.customBaseUrl
    }
    if (body.availabelModel !== undefined && body.availableModels === undefined) {
        body.availableModels = body.availabelModel
    }

    const allowedFields = [
        'modelProviderName',
        'customModels',
        'customBaseURL',
        'enabled',
        'availableModels',
    ]

    const updates = Object.fromEntries(
        allowedFields
            .filter((field) => body[field] !== undefined)
            .map((field) => [field, body[field]])
    )

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            error: 'No valid fields provided for update'
        })
    }

    try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerId)
        const aliases = getProviderNameAliases(providerId)

        const result = await db
            .update(byok)
            .set({
                ...updates,
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(byok.userId, userId),
                    isUuid
                        ? eq(byok.id, providerId)
                        : sql`LOWER(${byok.modelProviderName}) IN (${sql.join(aliases.map(a => sql`${a}`), sql`, `)})`
                )
            )
            .returning({
                id: byok.id,
                modelProviderName: byok.modelProviderName,
                enabled: byok.enabled,
                customModels: byok.customModels,
                customBaseURL: byok.customBaseURL,
                availableModels: byok.availableModels,
                updatedAt: byok.updatedAt
            })

        if (!result || result.length === 0) {
            return res.status(200).json({
                message: 'Provider not found on server, skipped update',
                provider: null
            })
        }

        await redis.del(REDIS_KEYS.byok(userId))

        return res.status(200).json({
            message: 'Provider updated successfully',
            provider: result[0]
        })
    } catch(err) {
        console.error('Failed to patch BYOK provider:', err)
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }
}

router.patch('/providers/:providerId', handlePatchProvider)
router.patch('/providers', handlePatchProvider)

export default router