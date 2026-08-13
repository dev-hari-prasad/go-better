import React, { useState } from 'react';
import {
  Cog6ToothIcon,
  UserGroupIcon,
  BellIcon,
  ShieldCheckIcon,
  SparklesIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { Bell, Shield, Coins, ChevronDown, Github } from 'lucide-react';
import { UserSettings } from '../../types/codeReview';

const CustomSelect = ({ value, options, onChange, label }: { value: string, options: { id: string, name: string }[], onChange: (v: string) => void, label: string }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find(o => o.id === value);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="space-y-4" ref={containerRef}>
      <label className="text-xs font-semibold text-zinc-200">{label}</label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-[#1a1b22] border ${isOpen ? 'border-[#c0f200]/50 ring-1 ring-[#c0f200]/50' : 'border-[#232530]'} rounded-xl px-3 py-2 text-sm text-zinc-200 transition-all cursor-pointer`}
        >
          <span className="truncate">{selectedOption?.name || 'Select model'}</span>
          <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0 ml-2" />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1a1b22] border border-[#30363d] rounded-xl shadow-xl p-1 z-50 animate-apple-fade">
            <div className="flex flex-col max-h-48 overflow-y-auto">
              {options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { onChange(opt.id); setIsOpen(false); }}
                  className={`text-left px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${value === opt.id ? 'bg-[#21262d] text-zinc-100 font-medium' : 'text-zinc-400 hover:bg-[#21262d] hover:text-zinc-200'}`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Define sub‑tab identifiers
type SettingsTab =
  | 'ai-settings'
  | 'team'
  | 'integrations'
  | 'security'
  | 'billing';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'ai-settings', label: 'AI Settings' },
  { id: 'team', label: 'Team' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'security', label: 'Security' },
  { id: 'billing', label: 'Billing' },
];

const AISettingsTab: React.FC<{ settings: UserSettings; onSaveSettings: (s: UserSettings) => void }> = ({ settings, onSaveSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  
  const isModelsDirty = 
    localSettings.lightModeModel !== settings.lightModeModel ||
    localSettings.standardModeModel !== settings.standardModeModel ||
    localSettings.thoroughModeModel !== settings.thoroughModeModel;

  const isPromptsDirty = 
    localSettings.systemPrompt !== settings.systemPrompt ||
    localSettings.lightModePrompt !== settings.lightModePrompt ||
    localSettings.standardModePrompt !== settings.standardModePrompt ||
    localSettings.thoroughModePrompt !== settings.thoroughModePrompt;

  const handleSave = () => {
    onSaveSettings(localSettings);
  };

  // Determine available models based on configured keys in BYOK
  const availableModels = [];
  if (settings.openaiApiKey) availableModels.push({ id: 'gpt-4o', name: 'OpenAI (GPT-4o)' });
  if (settings.anthropicApiKey) availableModels.push({ id: 'claude-3-5-sonnet', name: 'Anthropic (Claude 3.5 Sonnet)' });
  if (settings.geminiApiKey) availableModels.push({ id: 'gemini-1-5-pro', name: 'Google (Gemini 1.5 Pro)' });
  if (settings.vercelApiKey) availableModels.push({ id: 'vercel', name: 'Vercel AI Gateway' });
  if (settings.openRouterApiKey) availableModels.push({ id: 'openrouter', name: 'OpenRouter' });
  
  if (settings.customEndpoints && settings.customEndpoints.length > 0) {
    settings.customEndpoints.forEach(ce => {
      availableModels.push({ id: ce.id, name: ce.name || 'Custom Endpoint' });
    });
  }
  
  // Fallback if no keys are configured
  if (availableModels.length === 0) {
    availableModels.push({ id: 'gpt-4o', name: 'OpenAI (GPT-4o)' });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 w-full animate-apple-fade relative">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">AI Prompts & Behavior</h2>
        </div>
      </div>

      <div className="space-y-6">
        {/* Review Mode Model Selection */}
        <div className="bg-[#16171d] border border-[#232530] rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-zinc-100">Review Mode Models</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Select which LLM to use for each code review mode.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CustomSelect
              label="Quick Model"
              value={localSettings.lightModeModel}
              options={availableModels}
              onChange={(val) => setLocalSettings({ ...localSettings, lightModeModel: val })}
            />
            <CustomSelect
              label="Focused Model"
              value={localSettings.standardModeModel}
              options={availableModels}
              onChange={(val) => setLocalSettings({ ...localSettings, standardModeModel: val })}
            />
            <CustomSelect
              label="Deep Dive Model"
              value={localSettings.thoroughModeModel}
              options={availableModels}
              onChange={(val) => setLocalSettings({ ...localSettings, thoroughModeModel: val })}
            />
          </div>
          {isModelsDirty && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-[#c0f200] hover:bg-[#a6d100] text-black font-semibold rounded-lg text-sm transition-colors animate-apple-scale shadow-md cursor-pointer"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <hr className="border-[#232530] my-8" />

        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-zinc-100">System Prompt</h3>
            <p className="text-xs text-zinc-400 mt-0.5">The foundational context given to the AI across all review modes.</p>
          </div>
          <textarea
            className="w-full bg-[#1a1b22] border border-[#232530] rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all resize-none min-h-[120px]"
            value={localSettings.systemPrompt || ''}
            onChange={(e) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
            placeholder="e.g. You are an expert senior software engineer performing a code review..."
          />
          <div className="flex items-start gap-2 bg-[#1c212b] border border-[#2d3340] rounded-lg p-2.5 text-xs text-zinc-300 mt-2">
            <InformationCircleIcon className="w-4 h-4 text-[#4493f8] shrink-0 mt-0.5" />
            <p>
              <strong className="font-bold text-[#58a6ff]">IMPORTANT:</strong> A base system prompt is injected automatically. Only use this space for specific rules that you have in mind like 'always use functional components' or 'enforce strict type checking'; do not rewrite standard review instructions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#16171d] border border-[#232530] rounded-2xl p-5 space-y-3 flex flex-col">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Quick</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Instructions for fast, syntax-level reviews.</p>
            </div>
            <textarea
              className="flex-1 w-full bg-[#1a1b22] border border-[#232530] rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all resize-none min-h-[160px]"
              value={localSettings.lightModePrompt || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, lightModePrompt: e.target.value })}
              placeholder="Focus on glaring bugs, typos, and simple anti-patterns. Ignore architectural suggestions."
            />
          </div>

          <div className="bg-[#16171d] border border-[#232530] rounded-2xl p-5 space-y-3 flex flex-col">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Focused</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Default instructions for balanced reviews.</p>
            </div>
            <textarea
              className="flex-1 w-full bg-[#1a1b22] border border-[#232530] rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all resize-none min-h-[160px]"
              value={localSettings.standardModePrompt || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, standardModePrompt: e.target.value })}
              placeholder="Balance performance, readability, and security. Suggest practical improvements."
            />
          </div>

          <div className="bg-[#16171d] border border-[#232530] rounded-2xl p-5 space-y-3 flex flex-col">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Deep Dive</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Instructions for deep, comprehensive analysis.</p>
            </div>
            <textarea
              className="flex-1 w-full bg-[#1a1b22] border border-[#232530] rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all resize-none min-h-[160px]"
              value={localSettings.thoroughModePrompt || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, thoroughModePrompt: e.target.value })}
              placeholder="Conduct a deep architectural review. Check edge cases, security vulnerabilities, and long-term maintainability."
            />
          </div>
        </div>

        {isPromptsDirty && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-[#c0f200] hover:bg-[#a6d100] text-black font-semibold rounded-lg text-sm transition-colors animate-apple-scale shadow-md cursor-pointer"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const WorkspaceSettingsView: React.FC<{ settings: UserSettings; onSaveSettings: (s: UserSettings) => void }> = ({ settings, onSaveSettings }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai-settings');
  const tabsRef = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [activeTabStyle, setActiveTabStyle] = useState({ left: 0, width: 0, opacity: 0 });

  React.useEffect(() => {
    const activeIndex = TABS.findIndex(t => t.id === activeTab);
    const activeEl = tabsRef.current[activeIndex];
    if (activeEl) {
      setActiveTabStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1
      });
    }
  }, [activeTab]);

  // Minimal placeholder content for each sub‑tab – can be expanded later
  const renderContent = () => {
    switch (activeTab) {
      case 'ai-settings':
        return <AISettingsTab settings={settings} onSaveSettings={onSaveSettings} />;
      case 'team':
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center select-none font-sans max-w-sm mx-auto pt-8 pb-20 animate-apple-fade">
            <div className="p-3 bg-[#c0f200]/10 border border-[#c0f200]/30 rounded-2xl text-[#c0f200] mb-4">
              <UserGroupIcon className="w-6 h-6 text-[#c0f200]/50" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center justify-center gap-2 mb-2">
              Team & Access
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-[#c0f200]/10 text-[#c0f200] border border-[#c0f200]/25">
                Coming Soon
              </span>
            </h3>
            <p className="text-[13px] text-zinc-400 leading-relaxed">
              Invite team members, assign roles, and manage workspace permissions and access controls.
            </p>
          </div>
        );
      case 'integrations':
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center select-none font-sans max-w-sm mx-auto pt-8 pb-20">
            <div className="p-3 bg-[#c0f200]/10 border border-[#c0f200]/30 rounded-2xl text-[#c0f200] mb-4">
              <Bell className="w-6 h-6 fill-[#c0f200]/20" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center justify-center gap-2 mb-2">
              Integrations
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-[#c0f200]/10 text-[#c0f200] border border-[#c0f200]/25">
                Coming Soon
              </span>
            </h3>
            <p className="text-[13px] text-zinc-400 leading-relaxed">
              Setup Slack, Discord, or webhook notifications to keep your workspace review activities aligned.
            </p>
          </div>
        );
      case 'security':
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center select-none font-sans max-w-sm mx-auto pt-8 pb-20">
            <div className="p-3 bg-[#c0f200]/10 border border-[#c0f200]/30 rounded-2xl text-[#c0f200] mb-4">
              <Shield className="w-6 h-6 fill-[#c0f200]/20" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center justify-center gap-2 mb-2">
              Security Settings
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-[#c0f200]/10 text-[#c0f200] border border-[#c0f200]/25">
                Coming Soon
              </span>
            </h3>
            <p className="text-[13px] text-zinc-400 leading-relaxed">
              Adjust severity thresholds, enable/disable crypto checks, and manage project access tokens.
            </p>
          </div>
        );
      case 'billing':
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center select-none font-sans max-w-sm mx-auto pt-8 pb-20">
            <div className="p-3 bg-[#c0f200]/10 border border-[#c0f200]/30 rounded-2xl text-[#c0f200] mb-4">
              <Coins className="w-6 h-6 fill-[#c0f200]/20" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">
              Billing & Quotas
            </h3>
            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% center; }
                100% { background-position: -200% center; }
              }
              .text-shimmer {
                background: linear-gradient(90deg, #c0f200 0%, #fff 50%, #c0f200 100%);
                background-size: 200% auto;
                color: transparent;
                -webkit-background-clip: text;
                background-clip: text;
                animation: shimmer 3s linear infinite;
                font-weight: 600;
              }
            `}</style>
            <p className="text-[13px] text-zinc-400 leading-relaxed mb-6">
              <span className="text-shimmer">Go Better is 100% free!</span> You just bring your own keys, so we don't have to burn a hole in your pocket. Also, <span className="text-shimmer">Go Better is fully open source</span>—just in case you want to experience the sheer pain of self‑hosting this complex architecture yourself!
            </p>
            <a 
              href="https://github.com/google-deepmind/antigravity" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl text-sm transition-all shadow-md active:scale-95 hover:scale-105 cursor-pointer"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Pill tabs */}
      <div className="px-6 py-4 flex items-center shrink-0">
        <div className="relative flex items-center gap-1 bg-[#16171d] p-1 rounded-xl border border-[#232530]">
          {/* Animated Background Indicator */}
          <div
            className="absolute top-1 bottom-1 bg-[#21262d] rounded-lg shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              left: activeTabStyle.left,
              width: activeTabStyle.width,
              opacity: activeTabStyle.opacity,
            }}
          />
          {TABS.map((tab, idx) => (
            <button
              key={tab.id}
              ref={el => tabsRef.current[idx] = el}
              onClick={() => setActiveTab(tab.id)}
              className={`relative z-10 flex items-center px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                activeTab === tab.id ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content area */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
};
