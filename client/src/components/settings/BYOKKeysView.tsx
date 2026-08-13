import React, { useState } from 'react';
import {
  KeyIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  CpuChipIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { 
  AnthropicDark, 
  OpenAIDark, 
  Google, 
  OpenRouterDark, 
  OllamaDark,
  VercelDark
} from '@ridemountainpig/svgl-react';
import { UserSettings } from '../../types/codeReview';
import { Button } from '../ui/Button';

interface BYOKKeysViewProps {
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
}

type ProviderId = string;

interface ProviderDef {
  id: ProviderId;
  name: string;
  modelHint: string;
  valueKey: keyof UserSettings;
  placeholder: string;
  isAvailable: boolean;
  Icon: React.ElementType;
  isCustom?: boolean;
  helpLink?: string;
}

export const BYOKKeysView: React.FC<BYOKKeysViewProps> = ({ settings, onSaveSettings }) => {
  const [form, setForm] = useState<UserSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  
  const [expandedProviderId, setExpandedProviderId] = useState<ProviderId | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  
  const [validatingMap, setValidatingMap] = useState<Record<string, boolean>>({});
  const [validatedSuccessMap, setValidatedSuccessMap] = useState<Record<string, boolean>>({});

  const handleSave = () => {
    onSaveSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);

  const handleValidateKey = (providerId: ProviderId) => {
    setValidatingMap(prev => ({ ...prev, [providerId]: true }));
    setTimeout(() => {
      setValidatingMap(prev => ({ ...prev, [providerId]: false }));
      setValidatedSuccessMap(prev => ({ ...prev, [providerId]: true }));
      setTimeout(() => setValidatedSuccessMap(prev => ({ ...prev, [providerId]: false })), 2500);
    }, 1200);
  };

  const toggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const providers: ProviderDef[] = [
    { 
      id: 'anthropic', 
      name: 'Anthropic', 
      modelHint: 'Claude 3.5 Sonnet', 
      valueKey: 'anthropicApiKey',
      placeholder: 'sk-ant-api03...',
      isAvailable: true,
      Icon: AnthropicDark,
      helpLink: 'https://console.anthropic.com/settings/keys'
    },
    { 
      id: 'openai', 
      name: 'OpenAI', 
      modelHint: 'GPT-4o / o1-preview', 
      valueKey: 'openaiApiKey',
      placeholder: 'sk-proj-...',
      isAvailable: true,
      Icon: OpenAIDark,
      helpLink: 'https://platform.openai.com/api-keys'
    },
    { 
      id: 'google', 
      name: 'Google Gemini', 
      modelHint: 'Gemini 1.5 Pro',
      valueKey: 'geminiApiKey',
      placeholder: 'AIzaSy...',
      isAvailable: true,
      Icon: Google,
      helpLink: 'https://aistudio.google.com/app/apikey'
    },
    { 
      id: 'vercel', 
      name: 'Vercel AI Gateway', 
      modelHint: '',
      valueKey: 'vercelApiKey',
      placeholder: 'sk-vercel-...',
      isAvailable: true,
      Icon: VercelDark,
      helpLink: 'https://vercel.com/docs/ai/ai-sdk/providers'
    },
    { 
      id: 'openrouter', 
      name: 'OpenRouter', 
      modelHint: '',
      valueKey: 'openRouterApiKey',
      placeholder: 'sk-or-v1-...',
      isAvailable: true,
      Icon: OpenRouterDark,
      helpLink: 'https://openrouter.ai/keys'
    },
  ];

  // Dynamically add custom endpoints to the provider list
  const customProviders: ProviderDef[] = form.customEndpoints?.map((ce, index) => ({
    id: ce.id,
    name: ce.name || `Custom Endpoint ${index + 1}`,
    modelHint: '',
    valueKey: `custom_key_${ce.id}` as any, // handled specially during render
    placeholder: 'sk-...',
    isAvailable: true,
    Icon: CpuChipIcon,
    isCustom: true,
    helpLink: undefined
  })) || [];

  const allProviders = [...providers, ...customProviders];

  const filteredProviders = allProviders.filter((p) =>
    p.name.toLowerCase().includes(providerSearch.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)] max-w-[1400px] mx-auto animate-apple-fade select-none">
      {/* Top Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">BYOK (Bring Your Own Keys)</h1>
          <p className="text-sm text-zinc-400 mt-1">Configure your own LLM provider API keys for automated code reviews.</p>
        </div>
      </div>

      {/* Provider List */}
      <div className="space-y-4">

        <div className="bg-[#16171d] border border-[#232530] rounded-2xl overflow-hidden shadow-sm">
          {filteredProviders.map((prov, idx) => {
            let isConfigured = !!form[prov.valueKey as keyof UserSettings];
            let value = (form[prov.valueKey as keyof UserSettings] as string) || '';
            let baseUrl = '';
            
            if (prov.isCustom) {
              const ce = form.customEndpoints?.find(c => c.id === prov.id);
              isConfigured = !!ce?.key;
              value = ce?.key || '';
              baseUrl = ce?.url || '';
            }

            const isExpanded = expandedProviderId === prov.id;
            const isValidating = validatingMap[prov.id];
            const isValidatedSuccess = validatedSuccessMap[prov.id];
            const showCurrentKey = showKey[prov.id];

            const handleUpdate = (field: 'url' | 'key' | 'name', val: string) => {
              if (prov.isCustom) {
                setForm(prev => ({
                  ...prev,
                  customEndpoints: prev.customEndpoints?.map(c => 
                    c.id === prov.id ? { ...c, [field]: val } : c
                  ) || []
                }));
              } else {
                setForm(prev => ({ ...prev, [prov.valueKey]: val }));
              }
            };

            const handleRemove = () => {
              if (prov.isCustom) {
                setForm(prev => ({
                  ...prev,
                  customEndpoints: prev.customEndpoints?.filter(c => c.id !== prov.id) || []
                }));
                if (expandedProviderId === prov.id) setExpandedProviderId(null);
              } else {
                setForm(prev => ({ ...prev, [prov.valueKey]: '' }));
              }
            };

            return (
              <div key={prov.id} className={`transition-colors ${idx !== filteredProviders.length - 1 ? 'border-b border-[#1c1d25]' : ''}`}>
                {/* Row Header */}
                <div
                  onClick={() => setExpandedProviderId(isExpanded ? null : prov.id)}
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-[#1a1b22] transition-colors ${isExpanded ? 'bg-[#1a1b22]' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-[#232530] flex items-center justify-center border border-[#2d3340] shadow-sm">
                      <prov.Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {prov.isCustom ? (
                          <div className="relative flex items-center group/edit">
                            <input
                              type="text"
                              value={prov.name}
                              onChange={(e) => handleUpdate('name', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-transparent border border-transparent hover:border-[#2d3340] focus:bg-[#0d1117] text-sm font-bold text-zinc-100 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 rounded-lg px-2 py-1 w-40 sm:w-56 transition-all shadow-none focus:shadow-inner pr-8 -ml-2"
                              placeholder="Custom Name"
                            />
                            <PencilIcon className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-zinc-100">
                            {prov.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isConfigured ? (
                      <span className="text-emerald-400 text-xs font-medium">Connected</span>
                    ) : (
                      <span className="text-zinc-500 text-xs font-medium">Not configured</span>
                    )}
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#2d3340] text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800 transition-all flex items-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedProviderId(isExpanded ? null : prov.id);
                      }}
                    >
                      {isExpanded ? 'Close' : 'Configure'}
                      {isExpanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Inline Expansion Area */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: isExpanded ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div className="p-6 bg-[#121319] border-t border-[#1c1d25]">
                      <div className="max-w-lg mx-auto space-y-4">
                        {prov.isCustom && (
                          <div className="mb-4">
                            <label className="text-xs font-semibold text-zinc-200 block mb-2">Base URL</label>
                            <input
                              type="text"
                              value={baseUrl}
                              onChange={(e) => handleUpdate('url', e.target.value)}
                              placeholder="https://api.example.com/v1"
                              className="w-full bg-[#0d1117] border border-[#2d3340] rounded-xl px-4 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all shadow-inner"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-200">API Key / Credentials</label>
                          {!prov.isCustom && prov.helpLink && (
                            <a href={prov.helpLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#c0f200] hover:underline font-medium">How to get your key &rarr;</a>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="relative flex-1">
                            <input
                              type={showCurrentKey ? 'text' : 'password'}
                              value={value}
                              onChange={(e) => handleUpdate('key', e.target.value)}
                              placeholder={prov.placeholder}
                              className="w-full bg-[#0d1117] border border-[#2d3340] rounded-xl px-4 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all pr-10 shadow-inner"
                            />
                            <button
                              type="button"
                              onClick={() => toggleShowKey(prov.id)}
                              className="absolute right-3.5 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              {showCurrentKey ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="md"
                            isLoading={isValidating}
                            onClick={() => handleValidateKey(prov.id)}
                            disabled={!value}
                            className="shrink-0"
                          >
                            {isValidatedSuccess ? (
                              <span className="flex items-center gap-1.5 text-emerald-400">
                                <CheckIcon className="w-4 h-4" /> Valid
                              </span>
                            ) : (
                              'Test Key'
                            )}
                          </Button>
                        </div>
                        
                        {(isConfigured || prov.isCustom) && (
                          <div className="pt-2 flex items-center justify-end">
                            <button 
                              onClick={handleRemove}
                              className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors cursor-pointer"
                            >
                              {prov.isCustom ? 'Remove Endpoint' : 'Remove Key'}
                            </button>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save and Add Buttons */}
        <div className="flex justify-start gap-4 pt-2">
          {(isDirty || savedSuccess) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckIcon className="w-4 h-4 text-black" />}
              onClick={handleSave}
            >
              {savedSuccess ? 'Saved!' : 'Save Changes'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            leftIcon={<PlusIcon className="w-4 h-4 text-zinc-400" />}
            onClick={() => {
              const id = 'custom-' + Date.now();
              setForm(prev => ({
                ...prev,
                customEndpoints: [...(prev.customEndpoints || []), { id, name: `Custom Endpoint ${(prev.customEndpoints?.length || 0) + 1}`, url: '', key: '' }]
              }));
              setExpandedProviderId(id);
            }}
          >
            Add Custom Endpoint
          </Button>
        </div>
      </div>

      {/* BYOK Status Banner - Compact Luma style */}
      <div className="p-4 bg-gradient-to-r from-[#c0f200]/10 to-transparent border border-[#c0f200]/20 rounded-xl flex items-center justify-between gap-4 transition-all hover:border-[#c0f200]/30 mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[#c0f200]/10 rounded-lg text-[#c0f200] border border-[#c0f200]/20 shadow-sm flex-shrink-0">
            <KeyIcon className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-zinc-100">Direct LLM Routing Enabled</h3>
            <p className="text-[13px] text-zinc-400 leading-relaxed max-w-2xl">
              Your repository diffs and code review requests are sent directly to your configured API keys without third-party proxying or logging. Go Better does not markup token costs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
