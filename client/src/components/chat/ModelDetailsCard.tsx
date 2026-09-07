import React from 'react';
import {
  XMarkIcon,
  SparklesIcon,
  WrenchIcon,
  DocumentTextIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { UnifiedModelItem } from '../../services/modelCatalogService';
import { ModelBrandIcon } from './ModelBrandIcon';

interface ModelDetailsCardProps {
  model: UnifiedModelItem;
  onClose: () => void;
}

export const ModelDetailsCard: React.FC<ModelDetailsCardProps> = ({ model, onClose }) => {
  const hasFeatures =
    model.capabilities.reasoning ||
    model.capabilities.tools ||
    model.capabilities.json ||
    model.capabilities.vision;

  const hasPricing =
    model.pricing &&
    (model.pricing.prompt !== null && model.pricing.prompt !== undefined ||
     model.pricing.completion !== null && model.pricing.completion !== undefined);

  return (
    <div
      className="bg-[#151620] border border-[#2c2f42] rounded-xl p-4 text-zinc-200 shadow-2xl space-y-3.5 max-w-sm w-full animate-apple-scale font-sans select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#1d1f2d] border border-[#31354b] flex items-center justify-center text-zinc-100 shrink-0 shadow-sm">
            <ModelBrandIcon modelIdOrBrand={model.brand || model.id} className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[13px] font-bold text-white tracking-tight truncate">{model.name}</h3>
            <p className="text-[10.5px] text-zinc-400 truncate max-w-[200px] font-mono">
              {model.id}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-white/5 cursor-pointer shrink-0"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Description (Only if actual description exists) */}
      {model.description && (
        <div className="space-y-0.5">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Description</h4>
          <p className="text-[11.5px] text-zinc-300 leading-relaxed">
            {model.description}
          </p>
        </div>
      )}

      {/* Features Pills (Only if model actually provides features) */}
      {hasFeatures && (
        <div className="space-y-1">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Features</h4>
          <div className="flex items-center gap-1.5 flex-wrap">
            {model.capabilities.reasoning && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-amber-500/10 border border-amber-500/25 text-amber-300">
                <SparklesIcon className="w-3 h-3" />
                <span>Reasoning</span>
              </span>
            )}
            {model.capabilities.tools && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
                <WrenchIcon className="w-3 h-3" />
                <span>Tool Calling</span>
              </span>
            )}
            {model.capabilities.json && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                <DocumentTextIcon className="w-3 h-3" />
                <span>JSON Schema</span>
              </span>
            )}
            {model.capabilities.vision && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-purple-500/10 border border-purple-500/25 text-purple-300">
                <PhotoIcon className="w-3 h-3" />
                <span>Vision</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Pricing (Only if pricing available) */}
      {hasPricing && (
        <div className="space-y-1 pt-1">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Pricing (/1M Tokens)</h4>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-zinc-500">Input: </span>
              <span className="text-zinc-200 font-mono font-medium">
                {model.pricing?.prompt ? `$${model.pricing.prompt}` : 'Free / Not set'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Output: </span>
              <span className="text-zinc-200 font-mono font-medium">
                {model.pricing?.completion ? `$${model.pricing.completion}` : 'Free / Not set'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2x2 Metadata Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-[#232536] text-xs">
        <div>
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Provider</span>
          <span className="text-zinc-200 font-medium">{model.providerLabel || 'Custom'}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Context Window</span>
          <span className="text-zinc-200 font-mono font-medium">
            {model.contextLength ? `${model.contextLength.toLocaleString()} tokens` : 'Not specified'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Modality</span>
          <span className="text-zinc-200 font-mono">{model.modality || 'Not specified'}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Base URL</span>
          <span className="text-zinc-300 font-mono truncate block text-[10px]" title={model.baseURL || ''}>
            {model.baseURL || 'Standard Endpoint'}
          </span>
        </div>
      </div>
    </div>
  );
};
