import { getAuthUserId } from './pullRequestApi';

export interface UnifiedModelItem {
  id: string;
  name: string;
  providerId: string;
  providerLabel: string;
  baseURL: string;
  contextLength?: number | null;
  modality?: string | null;
  pricing?: {
    prompt?: string | number | null;
    completion?: string | number | null;
  } | null;
  capabilities: {
    reasoning: boolean;
    tools: boolean;
    json: boolean;
    vision: boolean;
  };
  brand:
    | 'openai'
    | 'anthropic'
    | 'gemini'
    | 'meta'
    | 'deepseek'
    | 'xai'
    | 'qwen'
    | 'mistral'
    | 'moonshot'
    | 'zai'
    | 'tencent'
    | 'bytedance'
    | 'minimax'
    | 'nvidia'
    | 'inception'
    | 'cohere'
    | 'custom'
    | 'gobetter'
    | 'other';
  description?: string;
  isCustom?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Determine brand category from model ID or name
 */
export function detectModelBrand(modelIdOrName: string): UnifiedModelItem['brand'] {
  const name = (modelIdOrName || '').toLowerCase();

  if (/(gpt|openai|o1-|o3-|text-davinci|dall-e|whisper|chatgpt)/i.test(name)) return 'openai';
  if (/(claude|anthropic)/i.test(name)) return 'anthropic';
  if (/(gemini|google|gemma|palm)/i.test(name)) return 'gemini';
  if (/(llama|meta)/i.test(name)) return 'meta';
  if (/(deepseek)/i.test(name)) return 'deepseek';
  if (/(grok|xai)/i.test(name)) return 'xai';
  if (/(qwen|tongyi|alibaba)/i.test(name)) return 'qwen';
  if (/(mistral|mixtral|codestral|ministral|pixtral)/i.test(name)) return 'mistral';
  if (/(moonshot|kimi|baidu|ernie)/i.test(name)) return 'moonshot';
  if (/(zhipu|glm|chatglm|cogview|zai|codegeex|bigmodel)/i.test(name)) return 'zai';
  if (/(tencent|hunyuan)/i.test(name)) return 'tencent';
  if (/(bytedance|seedance|seed|doubao|skylark|volcengine)/i.test(name)) return 'bytedance';
  if (/(minimax|abab|hailuo)/i.test(name)) return 'minimax';
  if (/(nvidia|nemotron)/i.test(name)) return 'nvidia';
  if (/(inception|mercury)/i.test(name)) return 'inception';
  if (/(cohere|command-r|aya)/i.test(name)) return 'cohere';

  return 'other';
}

/**
 * Automatically resolve standard base URLs for known providers or use custom
 */
export function resolveProviderBaseURL(providerName: string, customBase?: string | null): string {
  const p = (providerName || '').toLowerCase().trim();
  if (p === 'openrouter') return 'https://openrouter.ai/api/v1';
  if (p === 'vercel') return 'https://api.gateway.ai.vercel.com/v1';
  if (p === 'openai') return 'https://api.openai.com/v1';
  if (p === 'inception' || p === 'inceptionlabs' || p === 'mercury' || p === 'gobetter') {
    return customBase || 'https://api.inceptionlabs.ai/v1/chat/completions';
  }
  return customBase || '';
}

/**
 * Model description generator
 */
export function getModelTagline(name: string, brand: string, context?: number | null): string {
  const ctx = context ? `${Math.round(context / 1000)}k context` : null;

  if (brand === 'anthropic') return ctx ? `Anthropic's model for coding & agentic work • ${ctx}` : "Anthropic's flagship model for coding & chat";
  if (brand === 'openai') return ctx ? `OpenAI model for complex reasoning & tools • ${ctx}` : 'OpenAI model for complex reasoning & tools';
  if (brand === 'gemini') return ctx ? `Google Gemini multimodal engine • ${ctx}` : 'Google Gemini multimodal engine';
  if (brand === 'deepseek') return ctx ? `High performance reasoning & chat • ${ctx}` : 'High performance reasoning & chat';
  if (brand === 'meta') return ctx ? `Meta open-weights flagship LLM • ${ctx}` : 'Meta open-weights flagship LLM';
  if (brand === 'xai') return ctx ? `xAI frontier model with real-time reasoning • ${ctx}` : 'xAI frontier model with real-time reasoning';
  if (brand === 'qwen') return ctx ? `Alibaba specialized coding model • ${ctx}` : 'Alibaba specialized coding model';
  if (brand === 'moonshot') return ctx ? `Moonshot AI long-context model • ${ctx}` : 'Moonshot AI long-context model';
  if (brand === 'nvidia') return ctx ? `NVIDIA accelerated reasoning model • ${ctx}` : 'NVIDIA accelerated reasoning model';
  if (brand === 'inception') return ctx ? `Inception Labs Mercury diffusion model • ${ctx}` : 'Inception Labs Mercury model';

  return ctx ? `Custom endpoint model • ${ctx}` : 'Configured LLM model';
}

/**
 * Default fallback models when no BYOK models have been configured yet
 */
export const DEFAULT_MODEL_CATALOG: UnifiedModelItem[] = [
  {
    id: 'mercury-2',
    name: 'Mercury 2.0',
    providerId: 'gobetter',
    providerLabel: 'Inception Labs',
    baseURL: 'https://api.inceptionlabs.ai/v1/chat/completions',
    contextLength: 128000,
    modality: 'text->text',
    capabilities: { reasoning: true, tools: true, json: true, vision: false },
    brand: 'inception',
    description: "Inception Labs' diffusion LLM architecture with ultra-fast generation and code intelligence.",
    pricing: { prompt: 0.25, completion: 0.75 },
  },
  {
    id: 'alibaba/qwen3.7-flash',
    name: 'Qwen 3.7 Flash',
    providerId: 'gobetter',
    providerLabel: 'GoBetter Free',
    baseURL: 'https://api.inceptionlabs.ai/v1/chat/completions',
    contextLength: 128000,
    modality: 'text->text',
    capabilities: { reasoning: false, tools: true, json: true, vision: false },
    brand: 'qwen',
    description: 'GoBetter Free platform model by Alibaba: high efficiency and fast code analysis.',
    pricing: { prompt: 0.03, completion: 0.13 },
  },
  {
    id: 'deepseek/deepseek-v4-flash-0731',
    name: 'DeepSeek V4 Flash',
    providerId: 'gobetter',
    providerLabel: 'GoBetter Free',
    baseURL: 'https://api.inceptionlabs.ai/v1/chat/completions',
    contextLength: 64000,
    modality: 'text->text',
    capabilities: { reasoning: true, tools: true, json: true, vision: false },
    brand: 'deepseek',
    description: 'GoBetter Free platform model: ultra-fast reasoning and code review.',
    pricing: { prompt: 0.05, completion: 0.10 },
  },
  {
    id: 'nvidia/nemotron-3.5-lightning',
    name: 'Nemotron 3.5 Lightning',
    providerId: 'gobetter',
    providerLabel: 'GoBetter Free',
    baseURL: 'https://api.inceptionlabs.ai/v1/chat/completions',
    contextLength: 128000,
    modality: 'text->text',
    capabilities: { reasoning: true, tools: true, json: true, vision: false },
    brand: 'nvidia',
    description: 'GoBetter Free platform model by NVIDIA: accelerated reasoning engine.',
    pricing: { prompt: 0.05, completion: 0.15 },
  },
  {
    id: 'zai/glm-4.7-flashx',
    name: 'GLM 4.7 FlashX',
    providerId: 'gobetter',
    providerLabel: 'GoBetter Free',
    baseURL: 'https://api.inceptionlabs.ai/v1/chat/completions',
    contextLength: 128000,
    modality: 'text->text',
    capabilities: { reasoning: false, tools: true, json: true, vision: false },
    brand: 'zai',
    description: 'GoBetter Free platform model by Zhipu AI: fast general and coding assistant.',
    pricing: { prompt: 0.06, completion: 0.40 },
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    providerId: 'gobetter',
    providerLabel: 'GoBetter Free',
    baseURL: 'https://api.inceptionlabs.ai/v1/chat/completions',
    contextLength: 32000,
    modality: 'text->text',
    capabilities: { reasoning: false, tools: true, json: true, vision: false },
    brand: 'openai',
    description: 'GoBetter Free open-source lightweight model for instant code checks.',
    pricing: { prompt: 0.07, completion: 0.30 },
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    providerId: 'openai',
    providerLabel: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    contextLength: 128000,
    modality: 'text+image->text',
    capabilities: { reasoning: false, tools: true, json: true, vision: true },
    brand: 'openai',
    description: 'Flagship OpenAI model for complex reasoning, multimodal vision, and coding.',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    providerId: 'openai',
    providerLabel: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    contextLength: 128000,
    modality: 'text+image->text',
    capabilities: { reasoning: false, tools: true, json: true, vision: true },
    brand: 'openai',
    description: 'Fast, lightweight model for everyday chat and code completion.',
  },
  {
    id: 'o1',
    name: 'OpenAI o1',
    providerId: 'openai',
    providerLabel: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    contextLength: 200000,
    modality: 'text+image->text',
    capabilities: { reasoning: true, tools: true, json: true, vision: true },
    brand: 'openai',
    description: 'Advanced reasoning model designed for deep mathematical and coding problem solving.',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    providerId: 'openrouter',
    providerLabel: 'Anthropic',
    baseURL: 'https://openrouter.ai/api/v1',
    contextLength: 200000,
    modality: 'text+image->text',
    capabilities: { reasoning: false, tools: true, json: true, vision: true },
    brand: 'anthropic',
    description: "Anthropic's latest Sonnet for everyday chat, code reviews, and agentic workflows.",
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    providerId: 'openrouter',
    providerLabel: 'Anthropic',
    baseURL: 'https://openrouter.ai/api/v1',
    contextLength: 200000,
    modality: 'text+image->text',
    capabilities: { reasoning: true, tools: true, json: true, vision: true },
    brand: 'anthropic',
    description: 'Hybrid reasoning and instant response model with highest coding benchmark scores.',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    providerId: 'openrouter',
    providerLabel: 'Google',
    baseURL: 'https://openrouter.ai/api/v1',
    contextLength: 1000000,
    modality: 'text+image->text',
    capabilities: { reasoning: false, tools: true, json: true, vision: true },
    brand: 'gemini',
    description: 'Lightning-fast 1M context window model for rapid multimodal tasks.',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    providerId: 'openrouter',
    providerLabel: 'Google',
    baseURL: 'https://openrouter.ai/api/v1',
    contextLength: 1000000,
    modality: 'text+image->text',
    capabilities: { reasoning: true, tools: true, json: true, vision: true },
    brand: 'gemini',
    description: 'Next-gen thinking model with deep reasoning and 1M token context capacity.',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    providerId: 'openrouter',
    providerLabel: 'DeepSeek',
    baseURL: 'https://openrouter.ai/api/v1',
    contextLength: 64000,
    modality: 'text->text',
    capabilities: { reasoning: true, tools: true, json: true, vision: false },
    brand: 'deepseek',
    description: 'Open-weights reasoning model with chain-of-thought verification for code.',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    providerId: 'openrouter',
    providerLabel: 'DeepSeek',
    baseURL: 'https://openrouter.ai/api/v1',
    contextLength: 64000,
    modality: 'text->text',
    capabilities: { reasoning: false, tools: true, json: true, vision: false },
    brand: 'deepseek',
    description: 'High-speed 671B parameter mixture-of-experts model for code and chat.',
  },
  {
    id: 'llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    providerId: 'openrouter',
    providerLabel: 'Meta',
    baseURL: 'https://openrouter.ai/api/v1',
    contextLength: 128000,
    modality: 'text->text',
    capabilities: { reasoning: false, tools: true, json: true, vision: false },
    brand: 'meta',
    description: "Meta's flagship open model matching 405B capabilities with extreme efficiency.",
  },
  {
    id: 'grok-2-1212',
    name: 'Grok 2',
    providerId: 'openrouter',
    providerLabel: 'xAI',
    baseURL: 'https://openrouter.ai/api/v1',
    contextLength: 128000,
    modality: 'text+image->text',
    capabilities: { reasoning: false, tools: true, json: true, vision: true },
    brand: 'xai',
    description: 'xAI frontier model with real-time reasoning and multimodal intelligence.',
  },
  {
    id: 'qwen-2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B',
    providerId: 'openrouter',
    providerLabel: 'Alibaba',
    baseURL: 'https://openrouter.ai/api/v1',
    contextLength: 128000,
    modality: 'text->text',
    capabilities: { reasoning: false, tools: true, json: true, vision: false },
    brand: 'qwen',
    description: 'Specialized code generation model with state-of-the-art developer tools.',
  },
  {
    id: 'moonshot-v1-128k',
    name: 'Kimi K2 (0905)',
    providerId: 'openrouter',
    providerLabel: 'Moonshot AI',
    baseURL: 'https://openrouter.ai/api/v1',
    contextLength: 128000,
    modality: 'text->text',
    capabilities: { reasoning: true, tools: true, json: true, vision: false },
    brand: 'moonshot',
    description: 'Enhanced version with longer context and deep multi-step reasoning.',
  },
  {
    id: 'mercury-2',
    name: 'Mercury 2.0',
    providerId: 'openrouter',
    providerLabel: 'Inception Labs',
    baseURL: 'https://openrouter.ai/api/v1',
    contextLength: 128000,
    modality: 'text->text',
    capabilities: { reasoning: true, tools: true, json: true, vision: false },
    brand: 'inception',
    description: "Inception Labs' diffusion LLM architecture with ultra-fast generation and code intelligence.",
  },
];

export const ACTIVE_MODEL_CATALOG_CACHE_KEY = 'gobe_active_model_catalog_cache';

/**
 * Fetch models configured and selected by the user in GET /byok/model-list.
 * Caches results in localStorage and only re-fetches when explicitly forced or when BYOK settings change.
 */
export async function fetchActiveModelList(forceRefresh: boolean = false): Promise<UnifiedModelItem[]> {
  // If not forcing refresh, attempt to load from localStorage cache first
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(ACTIVE_MODEL_CATALOG_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore cache parse error
    }
  }

  try {
    const userId = getAuthUserId();
    const response = await fetch(`${API_BASE_URL}/byok/model-list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userId,
      },
    });

    if (!response.ok) {
      try {
        const cached = localStorage.getItem(ACTIVE_MODEL_CATALOG_CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {}
      return DEFAULT_MODEL_CATALOG;
    }

    const rawData = await response.json();
    const records = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.byokModels)
      ? rawData.byokModels
      : Array.isArray(rawData?.models)
      ? rawData.models
      : [];

    if (!Array.isArray(records) || records.length === 0) {
      return DEFAULT_MODEL_CATALOG;
    }

    const userSelectedList: UnifiedModelItem[] = [];
    const seenIds = new Set<string>();

    const sortedRecords = [...records].sort((a, b) => {
      const aName = (a?.modelProviderName || '').toLowerCase();
      const bName = (b?.modelProviderName || '').toLowerCase();
      if (aName === 'gobetter') return -1;
      if (bName === 'gobetter') return 1;
      return 0;
    });

    for (const entry of sortedRecords) {
      const rawProvider = entry.modelProviderName || '';
      const providerId = rawProvider.toLowerCase();
      const baseURL = resolveProviderBaseURL(providerId, entry.customBase);
      const defaultProviderLabel =
        providerId === 'openrouter'
          ? 'OpenRouter'
          : providerId === 'vercel'
          ? 'Vercel AI Gateway'
          : providerId === 'openai'
          ? 'OpenAI'
          : providerId === 'inception' || providerId === 'inceptionlabs' || providerId === 'mercury'
          ? 'Inception Labs'
          : providerId === 'gobetter'
          ? 'GoBetter Free'
          : entry.name || (rawProvider && rawProvider.toLowerCase() !== 'custom' ? rawProvider : '');

      const available = Array.isArray(entry.availableModels)
        ? entry.availableModels
        : Array.isArray(entry.byokModels)
        ? entry.byokModels
        : Array.isArray(entry.availabelModel)
        ? entry.availabelModel
        : [];

      const targetModels: any[] = [];
      for (const m of available) {
        if (!m) continue;
        if (typeof m === 'string') {
          targetModels.push(m);
        } else if (m.id || m.name || m.slug) {
          targetModels.push(m);
        } else if (typeof m === 'object') {
          for (const [key, val] of Object.entries(m)) {
            const pricingMeta = (val && typeof val === 'object') ? (val as any) : null;
            targetModels.push({
              id: key,
              name: key.split('/').pop() || key,
              pricing: pricingMeta
                ? {
                    prompt: pricingMeta.inputCost ?? pricingMeta.prompt ?? null,
                    completion: pricingMeta.outputCost ?? pricingMeta.outPutCost ?? pricingMeta.completion ?? null,
                  }
                : null,
            });
          }
        }
      }

      if (targetModels.length === 0) {
        if (providerId === 'openai') {
          targetModels.push({ id: 'gpt-4o', name: 'GPT-4o' });
        } else if (providerId === 'openrouter') {
          targetModels.push({ id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' });
        } else if (providerId === 'vercel') {
          targetModels.push({ id: 'openai/gpt-4o', name: 'GPT-4o' });
        } else if (providerId === 'inception' || providerId === 'inceptionlabs' || providerId === 'mercury') {
          targetModels.push({ id: 'inception/mercury-2', name: 'Mercury 2' });
        } else {
          targetModels.push({ id: providerId, name: rawProvider || 'Custom Model' });
        }
      }

      for (const m of targetModels) {
        let modelId = '';
        let modelName = '';
        let contextLength: number | null = null;
        let modality: string | null = null;
        let reasoning = false;
        let tools = false;
        let json = false;
        let vision = false;
        let pricing: { prompt?: string | number | null; completion?: string | number | null } | null = null;
        let description: string | undefined = undefined;

        if (typeof m === 'string') {
          modelId = m;
          modelName = modelId.split('/').pop() || modelId;
          reasoning = /r1|reason|o1|o3/i.test(modelId);
          vision = /vision|image/i.test(modelId);
        } else if (m && typeof m === 'object') {
          modelId = m.id || m.name || m.slug || '';
          modelName = m.name || modelId;
          contextLength = m.context_length || m.context_window || m.max_tokens || null;
          modality = m.architecture?.modality || m.modality || null;
          reasoning = Boolean(m.reasoning || /r1|reason|o1|o3/i.test(modelId));
          const supp = Array.isArray(m.supported_parameters) ? m.supported_parameters : [];
          tools = supp.includes('tools') || supp.includes('tool_choice');
          json = supp.includes('structured_outputs') || supp.includes('json_mode') || supp.includes('response_format');
          vision = supp.includes('vision') || (modality ? /vision|image/i.test(modality) : false);
          description = m.description || undefined;
          if (m.pricing) {
            pricing = {
              prompt: m.pricing.prompt ?? null,
              completion: m.pricing.completion ?? null,
            };
          }
        }

        if (!modelId || seenIds.has(modelId)) continue;
        seenIds.add(modelId);

        const brand = detectModelBrand(modelId);
        const resolvedProviderLabel =
          providerId === 'gobetter'
            ? 'GoBetter Free'
            : defaultProviderLabel ||
              (brand === 'gemini'
                ? 'Google Gemini'
                : brand === 'deepseek'
                ? 'DeepSeek'
                : brand === 'anthropic'
                ? 'Anthropic'
                : brand === 'meta'
                ? 'Meta'
                : 'Custom Endpoint');

        userSelectedList.push({
          id: modelId,
          name: modelName || modelId,
          providerId,
          providerLabel: resolvedProviderLabel,
          baseURL,
          contextLength,
          modality,
          pricing,
          capabilities: { reasoning, tools, json, vision },
          brand,
          description,
          isCustom: providerId !== 'openai' && providerId !== 'openrouter' && providerId !== 'vercel' && providerId !== 'inception' && providerId !== 'inceptionlabs',
        });
      }
    }

    const finalList = userSelectedList.length > 0 ? userSelectedList : DEFAULT_MODEL_CATALOG;
    try {
      localStorage.setItem(ACTIVE_MODEL_CATALOG_CACHE_KEY, JSON.stringify(finalList));
    } catch {}
    return finalList;
  } catch (err) {
    console.error('Failed to load active model list:', err);
    try {
      const cached = localStorage.getItem(ACTIVE_MODEL_CATALOG_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_MODEL_CATALOG;
  }
}
