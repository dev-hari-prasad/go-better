import redis from '../lib/redis/redisClient.ts'

export interface FetchModelListParams {
    modelProviderName?: string | undefined
    customModels?: any
    customBaseUrl?: string | undefined
    apiKey?: string | undefined
}

export interface CleanModelConfig {
    id: string
    name: string
    context_length: number | null
    architecture: {
        modality?: string | null
        [key: string]: any
    } | null
    pricing: {
        prompt?: string | number | null
        completion?: string | number | null
        request?: string | number | null
        image?: string | number | null
        [key: string]: any
    } | null
    supported_parameters: string[] | null
    reasoning: boolean
    [key: string]: any
}

/**
 * Normalizes and extracts key model metadata:
 * id, name, context_length, architecture (modality), pricing, supported_parameters, reasoning.
 * Supports OpenRouter, Vercel AI Gateway, OpenAI, and custom OpenAI-compatible endpoints.
 */
export function cleanModelConfig(model: any): CleanModelConfig {
    if (!model) {
        return {
            id: '',
            name: '',
            context_length: null,
            architecture: null,
            pricing: null,
            supported_parameters: null,
            reasoning: false,
        }
    }

    if (typeof model === 'string') {
        const isReasoning = /r1|reasoner|reasoning|o1|o3/i.test(model)
        return {
            id: model,
            name: model,
            context_length: null,
            architecture: null,
            pricing: null,
            supported_parameters: null,
            reasoning: isReasoning,
        }
    }

    const id = model.id || model.name || model.slug || ''
    const name = model.name || model.id || id

    // Context Length (OpenRouter context_length, Vercel context_window/max_tokens)
    const rawContextLength =
        model.context_length ??
        model.context_window ??
        model.max_tokens ??
        model.max_input_tokens ??
        null

    const context_length =
        typeof rawContextLength === 'number'
            ? rawContextLength
            : rawContextLength
            ? parseInt(String(rawContextLength), 10) || null
            : null

    // Architecture (Modality / Tokenizer / Instruct Type)
    let architecture: CleanModelConfig['architecture'] = null
    if (model.architecture) {
        architecture = {
            modality: model.architecture.modality ?? model.modality ?? 'text->text',
            ...(model.architecture.tokenizer ? { tokenizer: model.architecture.tokenizer } : {}),
            ...(model.architecture.instruct_type ? { instruct_type: model.architecture.instruct_type } : {}),
        }
    } else if (model.modality) {
        architecture = {
            modality: model.modality,
        }
    }

    // Pricing (Prompt / Completion / Request / Image)
    let pricing: CleanModelConfig['pricing'] = null
    if (model.pricing) {
        pricing = {
            prompt: model.pricing.prompt ?? null,
            completion: model.pricing.completion ?? null,
            request: model.pricing.request ?? null,
            image: model.pricing.image ?? null,
        }
    }

    // Supported Parameters (tools, reasoning, structured_outputs, etc.)
    const supported_parameters: string[] | null = Array.isArray(model.supported_parameters)
        ? model.supported_parameters
        : Array.isArray(model.supportedParameters)
        ? model.supportedParameters
        : null

    // Reasoning Capability
    const isReasoning =
        Boolean(model.reasoning) ||
        (Array.isArray(supported_parameters) && supported_parameters.includes('reasoning')) ||
        /r1|reasoner|reasoning|o1|o3/i.test(id)

    return {
        id,
        name,
        context_length,
        architecture,
        pricing,
        supported_parameters,
        reasoning: isReasoning,
    }
}

/**
 * Filters and cleans model configs for selected models.
 * If selectedModelIds is provided, returns clean configs matching those IDs.
 * If selectedModelIds is not provided or empty, cleans all available models.
 */
export function parseAndCleanModels(
    rawModels: any[],
    selectedModelIds?: Array<string | any> | null
): CleanModelConfig[] {
    if (!Array.isArray(rawModels)) return []

    const selectedSet =
        selectedModelIds && selectedModelIds.length > 0
            ? new Set(
                  selectedModelIds.map((s: any) =>
                      typeof s === 'string'
                          ? s.toLowerCase()
                          : s?.id
                          ? String(s.id).toLowerCase()
                          : String(s)
                  )
              )
            : null

    const cleaned: CleanModelConfig[] = []
    const seenIds = new Set<string>()

    for (const raw of rawModels) {
        const cleanedModel = cleanModelConfig(raw)
        if (!cleanedModel.id) continue

        const idLower = cleanedModel.id.toLowerCase()

        if (selectedSet) {
            if (selectedSet.has(idLower) && !seenIds.has(idLower)) {
                seenIds.add(idLower)
                cleaned.push(cleanedModel)
            }
        } else {
            if (!seenIds.has(idLower)) {
                seenIds.add(idLower)
                cleaned.push(cleanedModel)
            }
        }
    }

    // Include any custom selected IDs not present in upstream raw list
    if (selectedModelIds && selectedModelIds.length > 0) {
        for (const sel of selectedModelIds) {
            const selId =
                typeof sel === 'string'
                    ? sel
                    : sel && typeof sel === 'object' && 'id' in sel
                    ? String(sel.id)
                    : String(sel)
            if (selId && !seenIds.has(selId.toLowerCase())) {
                seenIds.add(selId.toLowerCase())
                cleaned.push(cleanModelConfig(sel))
            }
        }
    }

    return cleaned
}

/**
 * Fetches available models based on provider or custom config with Redis caching.
 */
export async function getModelList(params: FetchModelListParams): Promise<any> {
    const { modelProviderName, customModels, customBaseUrl, apiKey } = params

    if (customModels && Array.isArray(customModels) && customModels.length > 0 && typeof customModels[0] === 'object' && customModels[0]?.id) {
        return customModels
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    }

    if (customBaseUrl) {
        const cleanBase = customBaseUrl.replace(/\/chat\/completions\/?$/, '')
        const url = cleanBase.endsWith('/models')
            ? cleanBase
            : `${cleanBase.replace(/\/+$/, '')}/models`
        try {
            const response = await fetch(url, { headers })
            if (response.ok) {
                const data: any = await response.json()
                const list = data.data ?? data
                if (Array.isArray(list) && list.length > 0) {
                    return list
                }
            }
        } catch (err) {
            console.warn(`Failed to fetch models from ${url}, falling back to provider defaults:`, err)
        }
    }

    const provider = String(modelProviderName || '').trim().toLowerCase()

    // Fetch and cache Inception Labs models
    if (provider === 'inception' || provider === 'inceptionlabs' || provider === 'mercury') {
        const cacheKey = apiKey ? `inceptionModelList_${apiKey.slice(-8)}` : 'inceptionModelList'
        const cached = await redis.get(cacheKey)
        if (cached !== null) {
            return JSON.parse(cached)
        }

        try {
            const response = await fetch('https://api.inceptionlabs.ai/v1/models', { headers })
            if (response.ok) {
                const data: any = await response.json()
                const rawList = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
                if (rawList.length > 0) {
                    await redis.set(cacheKey, JSON.stringify(rawList), 'EX', 86400)
                    return rawList
                }
            }
        } catch {
            // fallback
        }

        const fallback = [
            { id: 'mercury-2', name: 'Mercury 2', context_window: 128000, description: 'Inception Labs Mercury 2 with adjustable reasoning' },
            { id: 'mercury-2-flash', name: 'Mercury 2 Flash', context_window: 64000, description: 'Fast sub-second inference model' },
        ]
        await redis.set(cacheKey, JSON.stringify(fallback), 'EX', 86400)
        return fallback
    }

    // Fetch and cache Vercel AI Gateway models
    if (provider === 'vercel') {
        const cached = await redis.get('vercelModelList')
        if (cached !== null) {
            return JSON.parse(cached)
        }

        const response = await fetch('https://ai-gateway.vercel.sh/v1/models')
        const data: any = await response.json()
        const rawList = Array.isArray(data.data) ? data.data : []
        const textModels = rawList.filter((m: any) => {
            const id = (m.id || '').toLowerCase()
            return !/embedding|embed|dall-e|tts|whisper|flux|stable-diffusion|sdxl|recraft|imagen/i.test(id)
        })
        await redis.set('vercelModelList', JSON.stringify(textModels), 'EX', 86400)
        return textModels
    }

    // Fetch and cache OpenAI (or OpenAI compatible) models
    if (provider === 'openai' || provider === 'open-ai') {
        const cached = await redis.get('openAiModelList')
        if (cached !== null) {
            return JSON.parse(cached)
        }

        const response = await fetch('https://api.openai.com/v1/models', { headers })
        const data: any = await response.json()
        const rawList = Array.isArray(data.data) ? data.data : []
        const textModels = rawList.filter((m: any) => {
            const id = (m.id || '').toLowerCase()
            return !/embedding|embed|dall-e|tts|whisper|babbage|davinci|curie|ada/i.test(id)
        })
        await redis.set('openAiModelList', JSON.stringify(textModels), 'EX', 86400)
        return textModels
    }

    // Fetch and cache OpenRouter models (filtered to text output models)
    if (provider === 'openrouter' || provider === 'open-router') {
        const cacheKey = apiKey ? `openrouterModelList_${apiKey.slice(-8)}` : 'openrouterModelList'
        const cached = await redis.get(cacheKey)
        if (cached !== null) {
            return JSON.parse(cached)
        }

        const response = await fetch('https://openrouter.ai/api/v1/models?output_modalities=text', { headers })
        const data: any = await response.json()
        const rawList = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
        const textModels = rawList.filter((m: any) => {
            const modality = (m.architecture?.modality || m.modality || '').toLowerCase()
            if (modality && !modality.includes('text')) return false
            const outMods = m.architecture?.output_modalities || m.output_modalities
            if (Array.isArray(outMods) && outMods.length > 0 && !outMods.includes('text')) return false
            return true
        })
        await redis.set(cacheKey, JSON.stringify(textModels), 'EX', 86400)
        return textModels
    }

    return null
}

/**
 * Fetches models from provider/endpoint and extracts clean model configs for selected models.
 */
export async function getCleanModelList(
    params: FetchModelListParams & { selectedModelIds?: string[] }
): Promise<CleanModelConfig[]> {
    const rawList = await getModelList({
        modelProviderName: params.modelProviderName,
        customBaseUrl: params.customBaseUrl,
        apiKey: params.apiKey,
    })

    const listArray = Array.isArray(rawList) ? rawList : rawList?.data || []
    return parseAndCleanModels(listArray, params.selectedModelIds || params.customModels)
}
