import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  UserGroupIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { Coins, ChevronDown, Github, Brain, RotateCw, Shield, Laptop, Smartphone, LogOut, RefreshCw, Key, Eye, EyeOff, Bell, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { UserSettings } from '../../types/codeReview';
import {
  getAllSessions,
  getCurrentSession,
  logout,
  logoutAll,
  resetPassword,
  updateUserProfile,
  deleteUserAccount,
  UserSession,
} from '../../services/authApi';
import {
  UnifiedModelItem,
  DEFAULT_MODEL_CATALOG,
  ACTIVE_MODEL_CATALOG_CACHE_KEY,
  fetchActiveModelList,
  detectModelBrand,
} from '../../services/modelCatalogService';
import { fetchWorkspaceSettings, patchWorkspaceSettings } from '../../services/workspaceApi';
import { ModelPickerPopover } from '../chat/ModelPickerPopover';
import { ModelBrandIcon } from '../chat/ModelBrandIcon';
import { isPublicReposTabEnabled, setPublicReposTabEnabled } from '../../config/clientConfig';

const FAVORITES_STORAGE_KEY = 'gobe_favorite_model_ids';
const DEFAULT_FAVORITES = ['gpt-4o', 'deepseek-r1', 'gemini-2.0-flash'];

interface ReviewModeModelPickerProps {
  label: string;
  value: string;
  models: UnifiedModelItem[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onRefreshModels?: () => void;
  isLoadingModels?: boolean;
  onChange: (modelId: string) => void;
  align?: 'left' | 'right';
}

const ReviewModeModelPicker: React.FC<ReviewModeModelPickerProps> = ({
  label,
  value,
  models,
  favoriteIds,
  onToggleFavorite,
  onRefreshModels,
  isLoadingModels = false,
  onChange,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find active model item or construct fallback item with detected brand
  const activeModel = useMemo<UnifiedModelItem>(() => {
    if (value) {
      const match = models.find(
        (m) =>
          m.id.toLowerCase() === value.toLowerCase() ||
          m.id.toLowerCase().endsWith('/' + value.toLowerCase()) ||
          value.toLowerCase().endsWith('/' + m.id.toLowerCase())
      );
      if (match) return match;

      const brand = detectModelBrand(value);
      return {
        id: value,
        name: value.split('/').pop() || value,
        providerId: brand,
        providerLabel: brand.charAt(0).toUpperCase() + brand.slice(1),
        baseURL: '',
        capabilities: { reasoning: /r1|reason|o1|o3/i.test(value), tools: true, json: true, vision: false },
        brand,
        description: 'Selected Model',
      };
    }
    return models[0] || DEFAULT_MODEL_CATALOG[0];
  }, [value, models]);

  return (
    <div className="space-y-2.5 relative" ref={containerRef}>
      <label className="text-xs font-semibold text-zinc-200 block">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-[#1a1b22] hover:bg-[#20222a] border ${
            isOpen ? 'border-[#c0f200]/50 ring-1 ring-[#c0f200]/40' : 'border-[#232530] hover:border-zinc-500'
          } rounded-xl px-3 py-2 text-sm text-zinc-200 transition-all cursor-pointer shadow-xs min-h-[42px]`}
          title={`Active: ${activeModel.name} (${activeModel.providerLabel || 'LLM'})`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-4 h-4 flex items-center justify-center text-zinc-300 shrink-0">
              <ModelBrandIcon modelIdOrBrand={activeModel.brand || activeModel.id} className="w-4 h-4" />
            </div>
            <span className="truncate font-medium text-zinc-100 text-[13px]">
              {activeModel.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {activeModel.capabilities?.reasoning && (
              <span title="Reasoning Model" className="text-amber-400/90 flex items-center">
                <Brain className="w-3.5 h-3.5" />
              </span>
            )}
            {activeModel.providerLabel && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700/60 rounded select-none truncate max-w-[90px]">
                {activeModel.providerLabel}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-zinc-500 transition-transform duration-150 ${
                isOpen ? 'rotate-180 text-zinc-300' : ''
              }`}
            />
          </div>
        </button>

        {isOpen && (
          <ModelPickerPopover
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            models={models}
            activeModel={activeModel}
            onSelectModel={(selected) => {
              onChange(selected.id);
              setIsOpen(false);
            }}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            onRefreshModels={onRefreshModels}
            isRefreshing={isLoadingModels}
            placement="bottom"
            align={align}
            autoFocusChatInput={false}
          />
        )}
      </div>
    </div>
  );
};

// Define sub‑tab identifiers
type SettingsTab =
  | 'ai-settings'
  | 'features'
  | 'account-sessions'
  | 'team'
  | 'billing';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'ai-settings', label: 'AI Settings' },
  { id: 'features', label: 'Features' },
  { id: 'account-sessions', label: 'Account & Sessions' },
  { id: 'team', label: 'Team' },
  { id: 'billing', label: 'Billing' },
];

const AISettingsTab: React.FC<{ settings: UserSettings; onSaveSettings: (s: UserSettings) => void }> = ({ settings, onSaveSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [models, setModels] = useState<UnifiedModelItem[]>(() => {
    try {
      const cached = localStorage.getItem(ACTIVE_MODEL_CATALOG_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_MODEL_CATALOG;
  });
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Favorites (LocalStorage)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    } catch {
      return DEFAULT_FAVORITES;
    }
  });

  const toggleFavorite = useCallback((modelId: string) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(modelId);
      const next = exists ? prev.filter((id) => id !== modelId) : [...prev, modelId];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const loadModels = useCallback(async (forceRefresh = false) => {
    setIsLoadingModels(true);
    try {
      const list = await fetchActiveModelList(forceRefresh);
      setModels(list);
      if (forceRefresh) {
        toast.success('Model list updated from /model-list');
      }
    } catch {
      setModels(DEFAULT_MODEL_CATALOG);
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    void loadModels(false);

    let isMounted = true;
    void fetchWorkspaceSettings('aiSettings').then((fetched) => {
      if (!isMounted || !fetched) return;
      setLocalSettings((prev) => ({ ...prev, ...fetched }));
      onSaveSettings({ ...settings, ...fetched });
    });

    const handleByokUpdated = () => void loadModels(true);
    window.addEventListener('byok-models-updated', handleByokUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('byok-models-updated', handleByokUpdated);
    };
  }, [loadModels]);
  
  const isModelsDirty = 
    localSettings.lightModeModel !== settings.lightModeModel ||
    localSettings.standardModeModel !== settings.standardModeModel ||
    localSettings.thoroughModeModel !== settings.thoroughModeModel;

  const isPromptsDirty = 
    localSettings.systemPrompt !== settings.systemPrompt ||
    localSettings.lightModePrompt !== settings.lightModePrompt ||
    localSettings.standardModePrompt !== settings.standardModePrompt ||
    localSettings.thoroughModePrompt !== settings.thoroughModePrompt;

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const ok = await patchWorkspaceSettings('aiSettings', localSettings);
      onSaveSettings(localSettings);
      if (ok) {
        toast.success('Settings saved');
      } else {
        toast.success('Settings updated locally');
      }
    } catch {
      onSaveSettings(localSettings);
      toast.success('Settings updated locally');
    } finally {
      setIsSaving(false);
    }
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-100">Review Mode Models</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Select which LLM to use for each code review mode.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadModels(true)}
              disabled={isLoadingModels}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-[#1a1b22] hover:bg-[#21262d] border border-[#232530] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh available models from /model-list"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin text-[#c0f200]' : ''}`} />
              <span>Refresh Models</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReviewModeModelPicker
              label="Quick Model"
              value={localSettings.lightModeModel}
              models={models}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onRefreshModels={() => void loadModels(true)}
              isLoadingModels={isLoadingModels}
              onChange={(val) => setLocalSettings({ ...localSettings, lightModeModel: val })}
              align="left"
            />
            <ReviewModeModelPicker
              label="Focused Model"
              value={localSettings.standardModeModel}
              models={models}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onRefreshModels={() => void loadModels(true)}
              isLoadingModels={isLoadingModels}
              onChange={(val) => setLocalSettings({ ...localSettings, standardModeModel: val })}
              align="left"
            />
            <ReviewModeModelPicker
              label="Deep Dive Model"
              value={localSettings.thoroughModeModel}
              models={models}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onRefreshModels={() => void loadModels(true)}
              isLoadingModels={isLoadingModels}
              onChange={(val) => setLocalSettings({ ...localSettings, thoroughModeModel: val })}
              align="right"
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

const FeaturesSettingsTab: React.FC = () => {
  const [isPublicEnabled, setIsPublicEnabled] = useState(isPublicReposTabEnabled);
  const isEnvLocked = import.meta.env.VITE_ENABLE_PUBLIC_REPOS === 'false' || import.meta.env.VITE_ENABLE_PUBLIC_REPOS === '0';

  const handleToggle = () => {
    if (isEnvLocked) {
      toast.error('Public Repos tab is globally locked via VITE_ENABLE_PUBLIC_REPOS=false in environment.');
      return;
    }
    const next = !isPublicEnabled;
    setIsPublicEnabled(next);
    setPublicReposTabEnabled(next);
    toast.success(next ? 'Try Public Repo tab enabled in navigation' : 'Try Public Repo tab hidden from navigation');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 w-full animate-apple-fade relative">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Platform Features & Toggles</h2>
          <p className="text-xs text-zinc-400 mt-1">Control optional workspace tools, navigation tabs, and experimental sandboxes.</p>
        </div>
      </div>

      <div className="bg-[#16171d] border border-[#232530] rounded-2xl p-6 shadow-sm divide-y divide-[#232530]">
        {/* Toggle: Try Public Repo Sandbox Tab */}
        <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-200">Public Repository Explorer Tab</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#c0f200]/10 text-[#c0f200] border border-[#c0f200]/25">
                Sandbox
              </span>
              {isEnvLocked && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/25">
                  Locked in .env
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              Show or hide the &quot;Try Public Repo&quot; tab in the sidebar and navigation. When disabled, the sandbox tab is removed and direct navigation falls back to Dashboard.
            </p>
            <p className="text-[11px] font-mono text-zinc-500">
              Option keys: <code className="text-zinc-400">VITE_ENABLE_PUBLIC_REPOS</code> (.env) &middot; <code className="text-zinc-400">gobetter_feature_public_repos</code> (UI toggle)
            </p>
          </div>

          <button
            type="button"
            disabled={isEnvLocked}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isPublicEnabled && !isEnvLocked ? 'bg-[#c0f200]' : 'bg-zinc-700'
            } ${isEnvLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                isPublicEnabled && !isEnvLocked ? 'translate-x-5' : 'translate-x-0 bg-white'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

const AccountSessionsTab: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [isLoggingOutCurrent, setIsLoggingOutCurrent] = useState(false);

  // Profile data
  const [profile, setProfile] = useState(() => ({
    userName: localStorage.getItem('user_profile_name') || 'Developer',
    userEmail: localStorage.getItem('user_profile_email') || '',
    userId: localStorage.getItem('user_db_id') || localStorage.getItem('user_id') || '',
    authProvider: localStorage.getItem('user_auth_provider') || 'email',
  }));

  const [emailNotification, setEmailNotification] = useState<boolean>(() => {
    const saved = localStorage.getItem('user_email_notification');
    return saved !== null ? saved === 'true' : true;
  });
  const [isUpdatingNotification, setIsUpdatingNotification] = useState(false);

  useEffect(() => {
    const syncProfile = () => {
      setProfile({
        userName: localStorage.getItem('user_profile_name') || 'Developer',
        userEmail: localStorage.getItem('user_profile_email') || '',
        userId: localStorage.getItem('user_db_id') || localStorage.getItem('user_id') || '',
        authProvider: localStorage.getItem('user_auth_provider') || 'email',
      });
      const saved = localStorage.getItem('user_email_notification');
      setEmailNotification(saved !== null ? saved === 'true' : true);
    };
    window.addEventListener('user-profile-updated', syncProfile);
    window.addEventListener('user-changed', syncProfile);
    return () => {
      window.removeEventListener('user-profile-updated', syncProfile);
      window.removeEventListener('user-changed', syncProfile);
    };
  }, []);

  const handleToggleEmailNotification = async (checked: boolean) => {
    setEmailNotification(checked);
    setIsUpdatingNotification(true);
    try {
      await updateUserProfile({ emailNotification: checked });
      localStorage.setItem('user_email_notification', String(checked));
      window.dispatchEvent(
        new CustomEvent('user-profile-updated', { detail: { emailNotification: checked } })
      );
      window.dispatchEvent(new Event('user-changed'));
      toast.success(checked ? 'Email notifications enabled' : 'Email notifications disabled');
    } catch {
      localStorage.setItem('user_email_notification', String(checked));
      toast.info('Notification setting saved locally');
    } finally {
      setIsUpdatingNotification(false);
    }
  };

  // Password reset form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const [all, current] = await Promise.all([
        getAllSessions(),
        getCurrentSession(),
      ]);
      setSessions(all);
      setCurrentSessionId(current?.id || null);
    } catch (err) {
      console.warn('Failed to load active sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const handleLogoutCurrent = async () => {
    setIsLoggingOutCurrent(true);
    try {
      await logout();
      localStorage.removeItem('gobe-user-id');
      localStorage.removeItem('user_db_id');
      localStorage.removeItem('user_id');
      localStorage.removeItem('session_id');
      localStorage.removeItem('user_profile_name');
      localStorage.removeItem('user_profile_email');
      localStorage.removeItem('user_auth_provider');

      window.dispatchEvent(new Event('user-profile-updated'));
      window.dispatchEvent(new Event('user-changed'));
      toast.success('Signed out of this device');
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }));
    } catch (err: any) {
      toast.error(err.message || 'Logout failed');
    } finally {
      setIsLoggingOutCurrent(false);
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      await logoutAll();
      localStorage.removeItem('gobe-user-id');
      localStorage.removeItem('user_db_id');
      localStorage.removeItem('user_id');
      localStorage.removeItem('session_id');
      localStorage.removeItem('user_profile_name');
      localStorage.removeItem('user_profile_email');
      localStorage.removeItem('user_auth_provider');

      window.dispatchEvent(new Event('user-profile-updated'));
      window.dispatchEvent(new Event('user-changed'));
      toast.success('Signed out of all devices');
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke sessions');
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!oldPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setPasswordError('New password must contain at least 1 number');
      return;
    }
    if (!/[^A-Za-z0-9\s]/.test(newPassword)) {
      setPasswordError('New password must contain at least 1 special character');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordError('');
    setIsUpdatingPassword(true);

    try {
      await resetPassword({
        userId: profile.userId || undefined,
        email: profile.userEmail || undefined,
        oldPassword,
        password: newPassword,
      });

      toast.success('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  const handleDeleteAccount = async () => {
    if (!isConfirmDelete) {
      setIsConfirmDelete(true);
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteUserAccount();

      localStorage.setItem('showMarketingPopup', 'true');
      localStorage.removeItem('gobe-user-id');
      localStorage.removeItem('user_db_id');
      localStorage.removeItem('user_id');
      localStorage.removeItem('session_id');
      localStorage.removeItem('user_profile_name');
      localStorage.removeItem('user_profile_email');
      localStorage.removeItem('user_email_notification');
      localStorage.removeItem('user_auth_provider');
      localStorage.removeItem('user_login_method');
      localStorage.removeItem('user_avatar_style');

      window.dispatchEvent(new Event('user-profile-updated'));
      window.dispatchEvent(new Event('user-changed'));

      toast.success('Your account has been deleted permanently');
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
      setIsConfirmDelete(false);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 w-full animate-apple-fade">
      <div>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Account & Active Sessions</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Manage your authenticated identity, connected devices, and backend security credentials.
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-[#16171d] border border-[#232530] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c0f200]/10 border border-[#c0f200]/30 flex items-center justify-center text-[#c0f200]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">{profile.userName}</h3>
              <p className="text-xs text-zinc-400">{profile.userEmail || 'No email registered'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-profile-modal'))}
              className="px-2.5 py-1 rounded-lg bg-[#1a1b22] hover:bg-[#20222a] border border-[#232530] text-xs font-semibold text-[#c0f200] hover:text-[#d4ff1a] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/5 border border-white/10 text-zinc-300">
              {profile.authProvider}
            </span>
            {currentSessionId && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#c0f200]/10 text-[#c0f200] border border-[#c0f200]/30">
                Session Active
              </span>
            )}
          </div>
        </div>

        {profile.userId && (
          <div className="pt-3 border-t border-[#232530] flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-mono text-[11px]">User Database ID:</span>
            <span className="text-zinc-300 font-mono text-[11px] bg-black/30 px-2 py-0.5 rounded border border-white/5">
              {profile.userId}
            </span>
          </div>
        )}
      </div>

      {/* Email Notifications & GitHub Activity Notice Card */}
      <div className="bg-[#16171d] border border-[#232530] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#c0f200]/10 border border-[#c0f200]/30 flex items-center justify-center text-[#c0f200] shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-100">Email Notifications</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Receive automated alerts for completed PR reviews and critical security vulnerabilities.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={emailNotification}
              disabled={isUpdatingNotification}
              onChange={(e) => void handleToggleEmailNotification(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#232530] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c0f200]" />
          </label>
        </div>

        {/* GitHub Two-Way Integration Notification Notice */}
        <div className="p-3.5 rounded-xl bg-[#121319] border border-[#232530] text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold text-xs">
            <Github className="w-4 h-4 text-[#c0f200] shrink-0" />
            <span>GitHub Two-Way Integration Notice</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            When two-way integration with GitHub is active, GitHub will notify you directly of any normal comment, review, or activity on a pull request according to your GitHub account notification settings. This activity is handled externally by GitHub and is not within our direct control.
          </p>
        </div>
      </div>

      {/* Active Sessions Card */}
      <div className="bg-[#16171d] border border-[#232530] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-[#c0f200]" />
              Active Sessions & Devices
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Sessions currently authenticated with valid session tokens in Redis & PostgreSQL.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadSessions()}
            disabled={isLoadingSessions}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1b22] hover:bg-[#20222a] border border-[#232530] text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSessions ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {isLoadingSessions ? (
          <div className="py-6 text-center text-xs text-zinc-500">Loading active sessions from backend...</div>
        ) : sessions.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500 bg-[#121319] rounded-xl border border-white/5">
            No active session records found on the server.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((sess) => {
              const isCurrent = sess.id === currentSessionId;
              const ua = typeof sess.userAgent === 'object' && sess.userAgent ? (sess.userAgent as any) : null;
              const deviceLabel = ua
                ? `${ua.browser || 'Browser'} on ${ua.os || ua.platform || 'Device'}`
                : (typeof sess.userAgent === 'string' && sess.userAgent !== 'Unknow' ? sess.userAgent : 'Web Client Session');
              const createdAtFormatted = sess.createdAt
                ? new Date(sess.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Active';

              return (
                <div
                  key={sess.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-[#1a1c24] border-[#c0f200]/30 shadow-xs'
                      : 'bg-[#121319] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 shrink-0">
                      {ua?.isMobile ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-zinc-200 truncate">{deviceLabel}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold text-[#c0f200] bg-[#c0f200]/15 border border-[#c0f200]/30 shrink-0">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        Session created: {createdAtFormatted} &middot; ID: {sess.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>

                  {isCurrent && (
                    <button
                      type="button"
                      onClick={handleLogoutCurrent}
                      disabled={isLoggingOutCurrent}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1 shrink-0 ml-2"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>{isLoggingOutCurrent ? 'Signing out...' : 'Sign Out'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Global revoke all action */}
        <div className="pt-3 border-t border-[#232530] flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Lost a device or want to log out everywhere?
          </p>
          <button
            type="button"
            onClick={handleLogoutAll}
            disabled={isLoggingOutAll}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoggingOutAll ? 'Revoking all...' : 'Sign Out All Devices'}</span>
          </button>
        </div>
      </div>

      {/* Password Reset Card */}
      <div className="bg-[#16171d] border border-[#232530] rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Key className="w-4 h-4 text-[#c0f200]" />
            Change Password
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Update your account password using your current credentials.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">
              Current Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#1a1b22] border border-[#232530] rounded-xl px-3.5 py-2 pr-10 text-xs text-zinc-200 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
              >
                {showOldPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">
                New Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#1a1b22] border border-[#232530] rounded-xl px-3.5 py-2 pr-10 text-xs text-zinc-200 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#1a1b22] border border-[#232530] rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all placeholder:text-zinc-600"
              />
            </div>
          </div>

          {passwordError && (
            <p className="text-xs text-rose-400 font-medium">{passwordError}</p>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-zinc-500">Min 8 chars, 1 number, 1 special character</p>
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-4 py-2 rounded-xl bg-[#c0f200] hover:bg-[#a6d100] text-black text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="bg-[#16171d] border border-rose-500/20 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Danger Zone
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/25">
                  Permanent
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Permanently delete your account and all associated data, including review histories, repository associations, workspace settings, custom API keys, and active sessions. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#232530] flex items-center justify-between">
          {isConfirmDelete ? (
            <div className="flex items-center gap-3 w-full justify-between flex-wrap">
              <span className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                Are you completely sure? All your data will be permanently wiped.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={() => setIsConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300 font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={handleDeleteAccount}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-rose-600/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeletingAccount ? 'Deleting Account...' : 'Confirm Delete Account'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <p className="text-xs text-zinc-500">
                Logged in as <span className="text-zinc-300 font-medium">{profile.userEmail || profile.userName}</span>
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </button>
            </div>
          )}
        </div>
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
      case 'features':
        return <FeaturesSettingsTab />;
      case 'account-sessions':
        return <AccountSessionsTab />;
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
