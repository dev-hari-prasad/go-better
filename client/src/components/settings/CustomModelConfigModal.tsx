import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  XMarkIcon,
  CpuChipIcon,
  CheckIcon,
  SparklesIcon,
  WrenchIcon,
  DocumentTextIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { getModelIcon } from './ModelSelectorModal';

export interface CustomModelConfig {
  id: string;
  name?: string;
  context_length?: number | null;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  } | null;
  pricing?: {
    prompt?: string | number | null;
    completion?: string | number | null;
    request?: string | number | null;
    image?: string | number | null;
  } | null;
  supported_parameters?: string[] | null;
  reasoning?: boolean;
}

export interface CustomModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName?: string;
  initialModelId?: string;
  onSaveModel: (config: CustomModelConfig) => void;
}

export const CustomModelConfigModal: React.FC<CustomModelConfigModalProps> = ({
  isOpen,
  onClose,
  providerName = 'Custom Provider',
  initialModelId = '',
  onSaveModel,
}) => {
  const [modelId, setModelId] = useState(initialModelId);
  const [displayName, setDisplayName] = useState('');
  const [contextLength, setContextLength] = useState<string>('128000');
  const [modality, setModality] = useState<string>('text->text');
  const [promptPrice, setPromptPrice] = useState<string>('');
  const [completionPrice, setCompletionPrice] = useState<string>('');
  const [isReasoning, setIsReasoning] = useState(false);
  const [hasTools, setHasTools] = useState(true);
  const [hasStructuredOutputs, setHasStructuredOutputs] = useState(true);
  const [hasVision, setHasVision] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setModelId(initialModelId);
      if (initialModelId && !displayName) {
        setDisplayName(initialModelId.split('/').pop() || initialModelId);
      }
      if (/r1|reason|o1|o3/i.test(initialModelId)) {
        setIsReasoning(true);
      }
    }
  }, [isOpen, initialModelId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = modelId.trim();
    if (!cleanId) return;

    const supportedParams: string[] = [];
    if (hasTools) supportedParams.push('tools', 'tool_choice');
    if (hasStructuredOutputs) supportedParams.push('structured_outputs', 'json_mode');
    if (hasVision) supportedParams.push('vision', 'image_input');
    if (isReasoning) supportedParams.push('reasoning');

    const config: CustomModelConfig = {
      id: cleanId,
      name: displayName.trim() || cleanId,
      context_length: contextLength ? parseInt(contextLength, 10) || null : null,
      architecture: {
        modality: hasVision ? 'text+image->text' : modality,
      },
      pricing:
        promptPrice || completionPrice
          ? {
              prompt: promptPrice ? parseFloat(promptPrice) : null,
              completion: completionPrice ? parseFloat(completionPrice) : null,
            }
          : null,
      supported_parameters: supportedParams.length > 0 ? supportedParams : null,
      reasoning: isReasoning,
    };

    onSaveModel(config);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center pb-8 sm:pb-12 px-4 bg-black/60 backdrop-blur-sm animate-apple-fade font-sans"
      onClick={onClose}
    >
      <div
        className="bg-[#16171d] border border-[#232530] rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl animate-apple-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#232530] bg-[#16171d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c0f200]/10 border border-[#c0f200]/20 flex items-center justify-center text-[#c0f200] shrink-0">
              {(() => {
                const ProviderIcon = getModelIcon(providerName || '');
                return <ProviderIcon className="w-4 h-4" />;
              })()}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Configure Custom Model</h3>
              <p className="text-[11px] text-zinc-400">
                Set parameters for {providerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800/50"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Row-by-Row Aligned Layout */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto divide-y divide-[#232530]">
          {/* Row 1: Model Identifier */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
            <div className="space-y-0.5 max-w-xs">
              <label className="text-xs font-semibold text-zinc-100 flex items-center gap-1">
                <span>Model Identifier (ID)</span>
                <span className="text-[#c0f200]">*</span>
              </label>
              <p className="text-[11px] text-zinc-400">
                Exact model slug required by the provider endpoint.
              </p>
            </div>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. meta-llama/llama-3.3-70b-instruct"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full sm:w-64 bg-[#0d1117] border border-[#2d3340] focus:border-[#c0f200]/70 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Row 2: Display Name */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
            <div className="space-y-0.5 max-w-xs">
              <label className="text-xs font-semibold text-zinc-100">
                Display Name
              </label>
              <p className="text-[11px] text-zinc-400">
                Friendly label shown in the UI.
              </p>
            </div>
            <input
              type="text"
              placeholder="e.g. LLaMA 3.3 70B"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full sm:w-64 bg-[#0d1117] border border-[#2d3340] focus:border-[#c0f200]/70 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Row 3: Context Window */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
            <div className="space-y-0.5 max-w-xs">
              <label className="text-xs font-semibold text-zinc-100">
                Context Window
              </label>
              <p className="text-[11px] text-zinc-400">
                Maximum token capacity (e.g. 128000).
              </p>
            </div>
            <input
              type="number"
              placeholder="128000"
              value={contextLength}
              onChange={(e) => setContextLength(e.target.value)}
              className="w-full sm:w-64 bg-[#0d1117] border border-[#2d3340] focus:border-[#c0f200]/70 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Row 4: Token Pricing */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
            <div className="space-y-0.5 max-w-xs">
              <label className="text-xs font-semibold text-zinc-100">
                Token Pricing (USD / 1M)
              </label>
              <p className="text-[11px] text-zinc-400">
                Input &amp; output cost estimates.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-64">
              <input
                type="text"
                placeholder="Input $"
                value={promptPrice}
                onChange={(e) => setPromptPrice(e.target.value)}
                className="w-1/2 bg-[#0d1117] border border-[#2d3340] focus:border-[#c0f200]/70 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors"
              />
              <input
                type="text"
                placeholder="Output $"
                value={completionPrice}
                onChange={(e) => setCompletionPrice(e.target.value)}
                className="w-1/2 bg-[#0d1117] border border-[#2d3340] focus:border-[#c0f200]/70 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Row 5: Capabilities in a Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
            <div className="space-y-0.5 max-w-xs">
              <label className="text-xs font-semibold text-zinc-100">
                Capabilities
              </label>
              <p className="text-[11px] text-zinc-400">
                Enable supported model features.
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-start sm:justify-end">
              <button
                type="button"
                onClick={() => setIsReasoning(!isReasoning)}
                title="Supports Reasoning / Thinking"
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isReasoning
                    ? 'bg-[#c0f200]/15 border-[#c0f200]/40 text-[#c0f200] shadow-xs'
                    : 'bg-[#111216] border-[#232530] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Reasoning</span>
              </button>

              <button
                type="button"
                onClick={() => setHasTools(!hasTools)}
                title="Supports Function Calling & Tools"
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  hasTools
                    ? 'bg-[#c0f200]/15 border-[#c0f200]/40 text-[#c0f200] shadow-xs'
                    : 'bg-[#111216] border-[#232530] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <WrenchIcon className="w-3.5 h-3.5" />
                <span>Tools</span>
              </button>

              <button
                type="button"
                onClick={() => setHasStructuredOutputs(!hasStructuredOutputs)}
                title="Supports Structured Outputs & JSON Schema"
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  hasStructuredOutputs
                    ? 'bg-[#c0f200]/15 border-[#c0f200]/40 text-[#c0f200] shadow-xs'
                    : 'bg-[#111216] border-[#232530] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <DocumentTextIcon className="w-3.5 h-3.5" />
                <span>JSON Schema</span>
              </button>

              <button
                type="button"
                onClick={() => setHasVision(!hasVision)}
                title="Supports Vision & Multimodal Inputs"
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  hasVision
                    ? 'bg-[#c0f200]/15 border-[#c0f200]/40 text-[#c0f200] shadow-xs'
                    : 'bg-[#111216] border-[#232530] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <PhotoIcon className="w-3.5 h-3.5" />
                <span>Vision</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!modelId.trim()}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#c0f200] hover:bg-[#a6d100] disabled:bg-zinc-800 disabled:text-zinc-500 text-black transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md"
            >
              <CheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Save &amp; Select Model</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
