import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  XMarkIcon,
  GlobeAltIcon,
  KeyIcon,
  CheckIcon,
  CpuChipIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { getModelIcon } from './ModelSelectorModal';

export interface CustomEndpointData {
  id: string;
  name: string;
  url: string;
  key: string;
  models?: string[];
  enabled?: boolean;
}

export interface CustomEndpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: CustomEndpointData | null;
  onSave: (endpoint: CustomEndpointData) => void;
}

export const CustomEndpointModal: React.FC<CustomEndpointModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [modelsInput, setModelsInput] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setUrl(initialData.url || '');
        setKey(initialData.key || '');
        setModelsInput(initialData.models ? initialData.models.join(', ') : '');
        setEnabled(initialData.enabled !== false);
      } else {
        setName('');
        setUrl('');
        setKey('');
        setModelsInput('');
        setEnabled(true);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedModels = modelsInput
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    onSave({
      id: initialData?.id || 'custom-' + Date.now(),
      name: name.trim(),
      url: url.trim(),
      key: key.trim(),
      models: parsedModels.length > 0 ? parsedModels : undefined,
      enabled,
    });

    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center pt-24 sm:pt-28 px-4 bg-black/60 backdrop-blur-sm animate-apple-fade font-sans"
      onClick={onClose}
    >
      <div
        className="bg-[#16171d] border border-[#232530] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-apple-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#232530] bg-[#16171d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c0f200]/10 border border-[#c0f200]/20 flex items-center justify-center text-[#c0f200] shrink-0">
              {(() => {
                const DetectedIcon = (() => {
                  if (name.trim()) {
                    const icon = getModelIcon(name);
                    if (icon && icon !== CpuChipIcon) return icon;
                  }
                  if (url.trim()) {
                    const icon = getModelIcon(url);
                    if (icon && icon !== CpuChipIcon) return icon;
                  }
                  return GlobeAltIcon;
                })();
                return <DetectedIcon className="w-4 h-4" />;
              })()}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                {initialData ? 'Edit Custom Endpoint' : 'Add Custom Endpoint'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Configure OpenAI-compatible API base URL and credentials
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Endpoint Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-200">
              Endpoint Name <span className="text-[#c0f200]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. My vLLM Server, Local Ollama, Custom Gateway"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#2d3340] rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#c0f200]/70 transition-colors"
            />
          </div>

          {/* Base URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-200">
              Base URL (OpenAI-compatible)
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://api.your-domain.com/v1"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#2d3340] rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#c0f200]/70 transition-colors"
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              Appends <span className="text-zinc-400">/models</span> and <span className="text-zinc-400">/chat/completions</span> automatically.
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-200">
              API Key (Optional for local servers)
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="sk-..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#2d3340] rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#c0f200]/70 transition-colors"
              />
            </div>
          </div>

          {/* Initial Models (Comma separated) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-200">
              Models (Optional, comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. llama-3.3-70b, deepseek-r1, qwen-2.5-coder"
              value={modelsInput}
              onChange={(e) => setModelsInput(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#2d3340] rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#c0f200]/70 transition-colors"
            />
            <p className="text-[10px] text-zinc-500 font-mono">
              Leave blank to automatically discover models from the endpoint.
            </p>
          </div>

          {/* Active Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#c0f200] accent-[#c0f200]"
              />
              <span>Enable this endpoint for reviews</span>
            </label>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#232530] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#c0f200] hover:bg-[#a6d100] disabled:bg-zinc-800 disabled:text-zinc-500 text-black transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md"
            >
              <CheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{initialData ? 'Save Endpoint' : 'Add Endpoint'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
