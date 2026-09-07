import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  PlusIcon,
  CpuChipIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import {
  OpenAIDark,
  ClaudeAI,
  AnthropicDark,
  Gemini,
  Google,
  PerplexityAI,
  NVIDIADark,
  GrokDark,
  XAIDark,
  QwenDark,
  DeepSeek,
  MistralAI,
  Meta,
  Cohere,
  Groq,
  HuggingFace,
  OllamaDark,
  TogetherAIDark,
  ReplicateDark,
  VercelDark,
  AmazonWebServicesDark,
  MicrosoftAzure,
  IBM,
} from '@ridemountainpig/svgl-react';
import { fetchModelList } from '../../services/byokApi';
import { searchModels } from '../../utils/modelSearch';
import { OpenRouterLogo } from '../ui/icons/OpenRouterLogo';
import {
  ZaiLogo,
  TencentLogo,
  ByteDanceLogo,
  MiniMaxLogo,
  MoonshotLogo,
  GemmaLogo,
  InceptionLogo,
} from '../ui/icons/BrandLogos';
import { CustomModelTableModal } from './CustomModelTableModal';

export interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName: string;
  providerId: string;
  apiKey?: string;
  customBaseURL?: string;
  initialSelectedModels?: string[];
  onConfirmSelection: (selectedModels: string[]) => void;
}

/**
 * Detect model provider/brand from model ID/name using regex patterns
 * and return the appropriate icon component from @ridemountainpig/svgl-react
 */
export function getModelIcon(modelIdOrName: string): React.ElementType {
  const name = (modelIdOrName || '').toLowerCase();

  // OpenAI / ChatGPT / GPT / o1 / o3 / dall-e / whisper
  if (/(gpt|open[\s_-]*ai|o1-|o3-|text-davinci|dall-e|whisper|chatgpt)/i.test(name)) {
    return OpenAIDark;
  }
  // Claude / Anthropic
  if (/(claude|anthropic)/i.test(name)) {
    return ClaudeAI;
  }
  // Gemma (Google Gemma Open Models)
  if (/(gemma)/i.test(name)) {
    return GemmaLogo;
  }
  // Gemini / Google / PaLM / Vertex
  if (/(gemini|google|palm|vertex)/i.test(name)) {
    return Gemini;
  }
  // Perplexity / Sonar
  if (/(perplexity|sonar)/i.test(name)) {
    return PerplexityAI;
  }
  // NVIDIA / Nemotron
  if (/(nvidia|nemotron)/i.test(name)) {
    return NVIDIADark;
  }
  // Grok / xAI
  if (/(grok|xai)/i.test(name)) {
    return GrokDark;
  }
  // DeepSeek / Deep-Seek / Deep Seek
  if (/(deep[\s_-]*seek)/i.test(name)) {
    return DeepSeek;
  }
  // Qwen / Tongyi / Alibaba
  if (/(qwen|tongyi|alibaba)/i.test(name)) {
    return QwenDark;
  }
  // Mistral / Mixtral / Codestral / Ministral / Pixtral
  if (/(mistral|mixtral|codestral|ministral|pixtral)/i.test(name)) {
    return MistralAI;
  }
  // Llama / Meta
  if (/(llama|meta)/i.test(name)) {
    return Meta;
  }
  // Cohere / Command / Aya
  if (/(cohere|command-r|command-light|aya)/i.test(name)) {
    return Cohere;
  }
  // Groq
  if (/(groq)/i.test(name)) {
    return Groq;
  }
  // Ollama
  if (/(ollama)/i.test(name)) {
    return OllamaDark;
  }
  // HuggingFace
  if (/(huggingface|hf)/i.test(name)) {
    return HuggingFace;
  }
  // Together AI
  if (/(together)/i.test(name)) {
    return TogetherAIDark;
  }
  // Replicate
  if (/(replicate)/i.test(name)) {
    return ReplicateDark;
  }
  // Vercel
  if (/(vercel)/i.test(name)) {
    return VercelDark;
  }
  // Amazon / AWS / Nova / Bedrock / Titan
  if (/(amazon|aws|nova|titan|bedrock)/i.test(name)) {
    return AmazonWebServicesDark;
  }
  // Microsoft / Azure / Phi / WizardLM
  if (/(microsoft|msft|azure|phi|wizardlm)/i.test(name)) {
    return MicrosoftAzure;
  }
  // IBM / Granite
  if (/(ibm|granite)/i.test(name)) {
    return IBM;
  }
  // OpenRouter
  if (/(openrouter)/i.test(name)) {
    return OpenRouterLogo;
  }
  // Zai / Zhipu / GLM / ChatGLM / CogView / CodeGeeX
  if (/(zhipu|glm|chatglm|cogview|zai|codegeex|bigmodel)/i.test(name)) {
    return ZaiLogo;
  }
  // Tencent / Hunyuan
  if (/(tencent|hunyuan)/i.test(name)) {
    return TencentLogo;
  }
  // ByteDance / Seedance / Doubao / Skylark / Volcengine
  if (/(bytedance|seedance|seed|doubao|skylark|volcengine)/i.test(name)) {
    return ByteDanceLogo;
  }
  // MiniMax / ABAB / Hailuo
  if (/(minimax|abab|hailuo)/i.test(name)) {
    return MiniMaxLogo;
  }
  // Moonshot / Kimi
  if (/(moonshot|kimi)/i.test(name)) {
    return MoonshotLogo;
  }
  // Baidu / ERNIE / Wenxin
  if (/(baidu|ernie|wenxin)/i.test(name)) {
    return MoonshotLogo;
  }

  // Inception / Mercury
  if (/(inception|mercury)/i.test(name)) {
    return InceptionLogo;
  }

  // Fallback generic icon
  return CpuChipIcon;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  providerName,
  providerId,
  apiKey,
  customBaseURL,
  initialSelectedModels = [],
  onConfirmSelection,
}) => {
  const [loading, setLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>(initialSelectedModels);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // Fetch model list from backend endpoint when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setSelectedModels(initialSelectedModels);
    setSearchQuery('');

    let isMounted = true;
    setLoading(true);

    fetchModelList({
      modelProvider: providerId,
      modelProviderName: providerId,
      apiKey: apiKey || undefined,
      customBaseURL: customBaseURL || undefined,
    })
      .then((models) => {
        if (!isMounted) return;

        const list = Array.isArray(models)
          ? models
          : Array.isArray((models as any)?.byokModels)
          ? (models as any).byokModels
          : Array.isArray((models as any)?.data)
          ? (models as any).data
          : [];
        
        const normalized: string[] = list
          .map((m: any) => {
            if (typeof m === 'string') return m;
            return m.id || m.name || m.slug || null;
          })
          .filter(Boolean);

        const uniqueModels = Array.from(new Set(normalized));
        setAvailableModels(uniqueModels);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load models:', err);
        setAvailableModels([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, providerId, apiKey, customBaseURL]);

  // Combined models (discovered + previously selected), sorted alphabetically A-Z
  const allKnownModels = useMemo(() => {
    let baseKnown: string[] = [];
    const p = (providerId || '').toLowerCase();
    if (p === 'inception' || p === 'inceptionlabs' || p === 'mercury') {
      baseKnown = ['mercury-2', 'mercury-2-flash'];
    }
    const combined = Array.from(new Set([...baseKnown, ...availableModels]));
    selectedModels.forEach((m) => {
      if (!combined.includes(m)) {
        combined.push(m);
      }
    });
    return combined.sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
    );
  }, [availableModels, selectedModels, providerId]);

  // Filtered by intelligent similarity, token, regex & fuzzy search
  const filteredModels = useMemo(() => {
    return searchModels(allKnownModels, searchQuery);
  }, [allKnownModels, searchQuery]);

  const allFilteredSelected = useMemo(() => {
    return filteredModels.length > 0 && filteredModels.every((m) => selectedModels.includes(m));
  }, [filteredModels, selectedModels]);

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]
    );
  };

  const handleToggleSelectAll = () => {
    if (filteredModels.length === 0) return;
    if (allFilteredSelected) {
      setSelectedModels((prev) => prev.filter((m) => !filteredModels.includes(m)));
    } else {
      setSelectedModels((prev) => Array.from(new Set([...prev, ...filteredModels])));
    }
  };

  const handleAddCustomModel = (modelName: string) => {
    const trimmed = modelName.trim();
    if (!trimmed) return;

    if (!selectedModels.includes(trimmed)) {
      setSelectedModels((prev) => [...prev, trimmed]);
    }
    if (!availableModels.includes(trimmed)) {
      setAvailableModels((prev) => [trimmed, ...prev]);
    }
    setSearchQuery('');
  };

  const handleConfirm = () => {
    if (selectedModels.length === 0) return;
    onConfirmSelection(selectedModels);
    onClose();
  };

  if (!isOpen) return null;

  const showCustomAddPrompt =
    searchQuery.trim().length > 0 &&
    !allKnownModels.some((m) => m.toLowerCase() === searchQuery.toLowerCase().trim());

  return createPortal(
    <>
      {!isTableModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-32 sm:pt-36 px-4 bg-black/50 backdrop-blur-sm animate-apple-fade"
          onClick={onClose}
        >
          <div
            className="bg-[#16171d] border border-[#232530] rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl font-sans animate-apple-scale"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Command Palette Search Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-[#232530] gap-3 bg-[#16171d]">
            <MagnifyingGlassIcon className="w-4 h-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder={`Search ${providerName} models or type custom name...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  e.preventDefault();
                  handleAddCustomModel(searchQuery.trim());
                }
              }}
              className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-zinc-500 hover:text-zinc-300 p-0.5"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="w-px h-4 bg-[#232530] shrink-0" />
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Subheader Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#121319] border-b border-[#1c1d25] text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span>
                {filteredModels.length} models available
              </span>
              <span className="text-zinc-600">•</span>
              <span className={selectedModels.length > 0 ? 'text-[#c0f200] font-medium' : 'text-zinc-500'}>
                {selectedModels.length} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTableModalOpen(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#2d3340] hover:border-[#c0f200]/50 bg-[#16171d] hover:bg-[#232530] text-zinc-300 hover:text-[#c0f200] transition-all cursor-pointer shadow-xs flex items-center gap-1"
                title="Configure models in table editor"
              >
                <TableCellsIcon className="w-3.5 h-3.5 text-[#c0f200]" />
                <span>Table</span>
              </button>

              {filteredModels.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#2d3340] hover:border-[#c0f200]/50 bg-[#16171d] hover:bg-[#232530] text-zinc-300 hover:text-[#c0f200] transition-all cursor-pointer shadow-xs"
                >
                  {allFilteredSelected ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>
          </div>

          {/* Models List */}
          <div className="max-h-[320px] overflow-y-auto p-2">
            {/* Loading Indicator */}
            {loading && (
              <div className="py-10 flex flex-col items-center justify-center space-y-2 text-zinc-400">
                <ArrowPathIcon className="w-5 h-5 text-[#c0f200] animate-spin" />
                <span className="text-xs">Fetching models from {providerName}...</span>
              </div>
            )}

            {/* Quick Add Custom Model Option when typing */}
            {showCustomAddPrompt && (
              <div
                onClick={() => handleAddCustomModel(searchQuery.trim())}
                className="px-3.5 py-2.5 rounded-xl cursor-pointer hover:bg-[#c0f200]/10 text-zinc-200 transition-colors flex items-center justify-between border border-dashed border-[#2d3340] hover:border-[#c0f200]/40 my-1 group"
              >
                <div className="flex items-center gap-2.5 text-xs min-w-0">
                  <PlusIcon className="w-4 h-4 text-[#c0f200]" />
                  <span className="truncate">
                    Add <strong className="text-white font-mono">"{searchQuery.trim()}"</strong>
                  </span>
                </div>
                <span className="text-[11px] text-[#c0f200] font-medium inline-flex items-center gap-1">
                  <span>Add</span>
                  <ArrowRightIcon className="w-3 h-3 text-[#c0f200] group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            )}

            {/* Model rows */}
            {!loading && filteredModels.length > 0 && (
              <div className="space-y-0.5">
                {filteredModels.map((modelId) => {
                  const isSelected = selectedModels.includes(modelId);
                  const ModelIcon = getModelIcon(modelId);

                  return (
                    <div
                      key={modelId}
                      onClick={() => toggleModel(modelId)}
                      className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group border ${
                        isSelected
                          ? 'bg-white/[0.07] border-white/10 text-white'
                          : 'border-transparent hover:border-[#232530] hover:bg-white/[0.04] text-zinc-300'
                      }`}
                    >
                      {/* Left: Brand Icon + Model Name */}
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className="w-5 h-5 flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-zinc-200">
                          <ModelIcon className="w-4 h-4" />
                        </div>

                        <span className="text-[13px] font-mono font-medium truncate">
                          {modelId}
                        </span>
                      </div>

                      {/* Right: Checkbox Tick */}
                      <div
                        className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all shrink-0 ${
                          isSelected
                            ? 'bg-[#c0f200] border-[#c0f200] text-black shadow-xs'
                            : 'border-zinc-600 bg-[#121319] group-hover:border-zinc-400'
                        }`}
                      >
                        {isSelected && <CheckIcon className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredModels.length === 0 && !showCustomAddPrompt && (
              <div className="py-10 px-4 text-center space-y-2.5">
                <CpuChipIcon className="w-6 h-6 text-zinc-600 mx-auto" />
                <div className="text-xs font-medium text-zinc-400">
                  No models discovered
                </div>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                  Type a model name in the search bar above or open the table to add models in bulk.
                </p>
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#c0f200]/10 hover:bg-[#c0f200]/20 border border-[#c0f200]/30 hover:border-[#c0f200]/70 text-[#c0f200] transition-all cursor-pointer shadow-xs"
                >
                  <TableCellsIcon className="w-3.5 h-3.5" />
                  <span>Open Models Table</span>
                </button>
              </div>
            )}
          </div>

          {/* Minimal Footer */}
          <div className="px-4 py-3 bg-[#111216] border-t border-[#232530] flex items-center justify-between text-xs">
            <span className="text-[11px] text-zinc-500">
              Models can be modified anytime in settings
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedModels.length === 0}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedModels.length > 0
                    ? 'bg-[#c0f200] hover:bg-[#a6d100] text-black shadow-sm cursor-pointer'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <CheckIcon className="w-3.5 h-3.5" />
                Add Selected Models ({selectedModels.length})
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Dedicated Custom Model Table Modal */}
      <CustomModelTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        providerName={providerName}
        initialModels={selectedModels.length > 0 ? selectedModels : availableModels}
        onSaveModels={(savedList) => {
          const ids = savedList.map((m) => m.id);
          setSelectedModels(ids);
          setAvailableModels((prev) => Array.from(new Set([...ids, ...prev])));
        }}
      />
    </>,
    document.body
  );
};
