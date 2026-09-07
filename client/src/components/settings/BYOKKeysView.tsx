import React, { useState } from 'react';
import {
  KeyIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  CpuChipIcon,
  PencilIcon,
  SparklesIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  TrashIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { 
  OpenAIDark, 
  VercelDark
} from '@ridemountainpig/svgl-react';
import { UserSettings } from '../../types/codeReview';
import { 
  saveByokKey, 
  patchByokProvider,
  fetchByokProviders, 
  deleteByokProvider, 
  ByokKeyPayload, 
  ByokProviderRecord 
} from '../../services/byokApi';
import { fetchActiveModelList } from '../../services/modelCatalogService';
import { Button } from '../ui/Button';
import { Popover } from '../ui/Popover';
import { OpenRouterLogo } from '../ui/icons/OpenRouterLogo';
import { InceptionLogo } from '../ui/icons/BrandLogos';
import { ModelSelectorModal, getModelIcon } from './ModelSelectorModal';
import { toast } from 'sonner';

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
}

export const BYOKKeysView: React.FC<BYOKKeysViewProps> = ({ settings, onSaveSettings }) => {
  const [form, setForm] = useState<UserSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  
  const [remoteProviders, setRemoteProviders] = useState<ByokProviderRecord[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState<boolean>(true);

  // Fetch already enabled models and providers from GET /byok/providers
  React.useEffect(() => {
    let isMounted = true;
    fetchByokProviders().then((records) => {
      if (!isMounted || !Array.isArray(records)) return;
      setRemoteProviders(records);

      setForm((prev) => {
        const next = { ...prev };
        const providerSelectedModels = { ...(next.providerSelectedModels || {}) };
        const providerEnabled = { ...(next.providerEnabled || {}) };
        const existingCustoms = [...(next.customEndpoints || [])];

        for (const r of records) {
          const rawName = r.modelProviderName || '';
          const pName = rawName.toLowerCase();
          const rawModels = r.byokModels || r.availabelModel || r.availableModels;
          const parsedModels = Array.isArray(rawModels)
            ? rawModels.map((m: any) => typeof m === 'string' ? m : m?.id || m?.name || String(m))
            : [];

          if (pName === 'openai' || pName === 'vercel' || pName === 'openrouter' || pName === 'inception' || pName === 'inceptionlabs') {
            const canonicalId = pName === 'inceptionlabs' ? 'inception' : pName;
            providerEnabled[canonicalId] = r.enabled !== false;
            if (parsedModels.length > 0 && !providerSelectedModels[canonicalId]?.length) {
              providerSelectedModels[canonicalId] = parsedModels;
            }
          } else {
            // It's a custom endpoint!
            const matchIndex = existingCustoms.findIndex(
              (c) => c.id === r.id || (c.name && c.name.toLowerCase() === pName)
            );
            if (matchIndex >= 0) {
              existingCustoms[matchIndex] = {
                ...existingCustoms[matchIndex],
                id: r.id || existingCustoms[matchIndex].id,
                name: rawName || existingCustoms[matchIndex].name,
                url: r.customBaseURL || (r as any).customBaseUrl || existingCustoms[matchIndex].url,
                enabled: r.enabled !== false,
                models: parsedModels.length > 0 ? parsedModels : existingCustoms[matchIndex].models,
              };
            } else {
              existingCustoms.push({
                id: r.id || 'custom-' + rawName,
                name: rawName || 'Custom Endpoint',
                url: r.customBaseURL || (r as any).customBaseUrl || '',
                key: '••••••••••••••••••••••••••••',
                enabled: r.enabled !== false,
                models: parsedModels,
              });
            }
          }
        }

        return {
          ...next,
          providerEnabled,
          providerSelectedModels,
          customEndpoints: existingCustoms,
        };
      });
      setIsLoadingProviders(false);
    }).catch(() => {
      if (isMounted) setIsLoadingProviders(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const [expandedProviderId, setExpandedProviderId] = useState<ProviderId | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  
  const [validatingMap, setValidatingMap] = useState<Record<string, boolean>>({});
  const [validatedSuccessMap, setValidatedSuccessMap] = useState<Record<string, boolean>>({});
  const [validatedErrorMap, setValidatedErrorMap] = useState<Record<string, boolean>>({});
  const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [openCompatibilityPopoverId, setOpenCompatibilityPopoverId] = useState<string | null>(null);
  const [openKeyInfoPopoverId, setOpenKeyInfoPopoverId] = useState<string | null>(null);

  const handleCreateCustomEndpoint = () => {
    const id = 'custom-' + Date.now();
    setForm(prev => ({
      ...prev,
      customEndpoints: [
        ...(prev.customEndpoints || []),
        { id, name: `Custom Endpoint ${(prev.customEndpoints?.length || 0) + 1}`, url: '', key: '' }
      ]
    }));
    setExpandedProviderId(id);
  };

  const [modelSelectorConfig, setModelSelectorConfig] = useState<{
    isOpen: boolean;
    providerId: string;
    providerName: string;
    apiKey?: string;
    customBaseURL?: string;
    initialSelectedModels: string[];
  } | null>(null);

  const handleOpenModelSelector = (prov: ProviderDef) => {
    let currentKey = '';
    let currentUrl = '';
    let currentModels: string[] = [];

    if (prov.isCustom) {
      const ce = form.customEndpoints?.find((c) => c.id === prov.id);
      currentKey = ce?.key || '';
      currentUrl = ce?.url || '';
      currentModels = ce?.models || [];
    } else {
      currentKey = (form[prov.valueKey as keyof UserSettings] as string) || '';
      currentModels = form.providerSelectedModels?.[prov.id] || [];
      if (prov.id === 'inception') {
        currentUrl = 'https://api.inceptionlabs.ai/v1/chat/completions';
      }
    }

    setModelSelectorConfig({
      isOpen: true,
      providerId: prov.id,
      providerName: prov.name,
      apiKey: currentKey,
      customBaseURL: currentUrl,
      initialSelectedModels: currentModels,
    });
  };

  const handleSaveSelectedModels = (selectedModels: string[]) => {
    if (!modelSelectorConfig) return;
    const { providerId } = modelSelectorConfig;

    const isCustom = form.customEndpoints?.some((c) => c.id === providerId);
    if (isCustom) {
      setForm((prev) => ({
        ...prev,
        customEndpoints:
          prev.customEndpoints?.map((c) =>
            c.id === providerId ? { ...c, models: selectedModels } : c
          ) || [],
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        providerSelectedModels: {
          ...(prev.providerSelectedModels || {}),
          [providerId]: selectedModels,
        },
      }));
    }

    toast.success('Selected models updated', {
      description: 'You can now update your Workspace Settings to use your new model(s).',
      duration: 4000,
    });
  };

  const handleToggleEnabled = (providerId: ProviderId) => {
    const isCustom = form.customEndpoints?.some((c) => c.id === providerId);
    if (isCustom) {
      setForm((prev) => ({
        ...prev,
        customEndpoints:
          prev.customEndpoints?.map((c) =>
            c.id === providerId ? { ...c, enabled: c.enabled === false ? true : false } : c
          ) || [],
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        providerEnabled: {
          ...(prev.providerEnabled || {}),
          [providerId]: prev.providerEnabled?.[providerId] === false ? true : false,
        },
      }));
    }
  };

  const providers: ProviderDef[] = [
    { 
      id: 'openai', 
      name: 'OpenAI', 
      modelHint: 'GPT-4o / GPT-4o-mini / o1', 
      valueKey: 'openaiApiKey',
      placeholder: 'sk-proj-...',
      isAvailable: true,
      Icon: OpenAIDark,
    },
    { 
      id: 'vercel', 
      name: 'Vercel AI Gateway', 
      modelHint: 'Unified Gateway (All Models)', 
      valueKey: 'vercelApiKey',
      placeholder: 'sk-vercel-...',
      isAvailable: true,
      Icon: VercelDark,
    },
    { 
      id: 'openrouter', 
      name: 'OpenRouter', 
      modelHint: 'Unified Models (Claude, Llama, Qwen, DeepSeek)', 
      valueKey: 'openRouterApiKey',
      placeholder: 'sk-or-v1-...',
      isAvailable: true,
      Icon: OpenRouterLogo,
    },
    { 
      id: 'inception', 
      name: 'Inception Labs', 
      modelHint: 'Mercury 2 (Ultra-fast reasoning)', 
      valueKey: 'inceptionApiKey' as any,
      placeholder: 'il-... or sk-...',
      isAvailable: true,
      Icon: InceptionLogo,
    },
  ];

  // Automatically resolve the best matching brand icon for any provider or custom endpoint
  const resolveProviderBrandIcon = (name?: string, url?: string, id?: string): React.ElementType => {
    if (name) {
      const icon = getModelIcon(name);
      if (icon && icon !== CpuChipIcon) return icon;
    }
    if (url) {
      const icon = getModelIcon(url);
      if (icon && icon !== CpuChipIcon) return icon;
    }
    if (id) {
      const icon = getModelIcon(id);
      if (icon && icon !== CpuChipIcon) return icon;
    }
    return CpuChipIcon;
  };

  // Dynamically add custom endpoints to the provider list with detected brand icons
  const customProviders: ProviderDef[] = form.customEndpoints?.map((ce, index) => {
    const name = ce.name || `Custom Endpoint ${index + 1}`;
    return {
      id: ce.id,
      name,
      modelHint: '',
      valueKey: `custom_key_${ce.id}` as any,
      placeholder: 'sk-...',
      isAvailable: true,
      Icon: resolveProviderBrandIcon(ce.name, ce.url, ce.id),
      isCustom: true,
    };
  }) || [];

  const allProviders = [...providers, ...customProviders];

  const filteredProviders = allProviders.filter((p) =>
    p.name.toLowerCase().includes(providerSearch.toLowerCase())
  );

  const isMaskedKey = (key?: string | null): boolean => {
    if (!key) return true;
    const trimmed = key.trim();
    return trimmed.includes('•') || /[^\x00-\x7F]/.test(trimmed) || /^[•*xX.\-_ ]+$/.test(trimmed);
  };

  const getProviderPayload = (prov: ProviderDef, source: UserSettings): ByokKeyPayload | null => {
    if (prov.isCustom) {
      const ce = source.customEndpoints?.find((c) => c.id === prov.id);
      if (!ce?.key || isMaskedKey(ce.key)) return null;
      const customName = ce.name || prov.name || 'custom';
      return {
        id: ce.id,
        modelProvider: customName,
        modelProviderName: customName,
        apiKey: ce.key.trim(),
        customModel: true,
        customModels: ce.models && ce.models.length > 0 ? ce.models : undefined,
        customBaseURL: ce.url || undefined,
        enabled: ce.enabled !== false,
      };
    }

    const key = (source[prov.valueKey] as string) || '';
    if (!key || isMaskedKey(key)) return null;
    const selected = source.providerSelectedModels?.[prov.id];
    return {
      modelProvider: prov.id,
      apiKey: key.trim(),
      customModels: selected && selected.length > 0 ? selected : undefined,
      customBaseURL: prov.id === 'inception' ? 'https://api.inceptionlabs.ai/v1/chat/completions' : undefined,
      enabled: source.providerEnabled?.[prov.id] !== false,
    };
  };

  const handleSave = async () => {
    // 1. Providers that have newly entered API keys to register/encrypt
    const newKeyEntries = allProviders
      .map((prov) => ({ prov, payload: getProviderPayload(prov, form) }))
      .filter((entry): entry is { prov: ProviderDef; payload: ByokKeyPayload } => entry.payload !== null);

    // 2. Existing server providers that need partial metadata updates (enabled, baseURL, customModels, availableModels)
    const patchEntries: Array<{ id: string; updates: Partial<ByokProviderRecord> }> = [];
    for (const r of remoteProviders) {
      if (r.id) {
        const isCustom = form.customEndpoints?.find((c) => c.id === r.id);
        if (isCustom) {
          patchEntries.push({
            id: r.id,
            updates: {
              modelProviderName: isCustom.name,
              customBaseURL: isCustom.url,
              enabled: isCustom.enabled !== false,
              availableModels: isCustom.models,
            }
          });
        } else {
          const provKey = r.modelProviderName.toLowerCase();
          patchEntries.push({
            id: r.id,
            updates: {
              enabled: form.providerEnabled?.[provKey] !== false,
              availableModels: form.providerSelectedModels?.[provKey],
            }
          });
        }
      }
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (newKeyEntries.length > 0) {
        await Promise.allSettled(newKeyEntries.map((entry) => saveByokKey(entry.payload)));
      }
      if (patchEntries.length > 0) {
        await Promise.allSettled(patchEntries.map((entry) => patchByokProvider(entry.id, entry.updates)));
      }

      onSaveSettings(form);
      setSavedSuccess(true);
      setExpandedProviderId(null);
      fetchByokProviders().then((records) => {
        if (Array.isArray(records)) setRemoteProviders(records);
      }).catch(() => {});
      // Refresh model catalog cache and notify model pickers
      fetchActiveModelList(true).catch(() => {});
      window.dispatchEvent(new Event('byok-models-updated'));
      toast.success('BYOK keys saved successfully', {
        description: 'You can now update your Workspace Settings to use your new model(s).',
        duration: 4000,
      });
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      setSaveError('Something went wrong while saving your keys.');
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);

  // Keep refs for current state to enable automatic saving on page navigation / unmount
  const formRef = React.useRef(form);
  formRef.current = form;

  const settingsRef = React.useRef(settings);
  settingsRef.current = settings;

  const allProvidersRef = React.useRef(allProviders);
  allProvidersRef.current = allProviders;

  const remoteProvidersRef = React.useRef(remoteProviders);
  remoteProvidersRef.current = remoteProviders;

  const isSavingRef = React.useRef(isSaving);
  isSavingRef.current = isSaving;

  React.useEffect(() => {
    return () => {
      if (isSavingRef.current) return;
      const currentForm = formRef.current;
      const currentSettings = settingsRef.current;
      const currentProviders = allProvidersRef.current;
      const currentRemote = remoteProvidersRef.current;

      const isModified = JSON.stringify(currentForm) !== JSON.stringify(currentSettings);
      if (!isModified) return;

      const newKeyEntries = currentProviders
        .map((prov) => ({ prov, payload: getProviderPayload(prov, currentForm) }))
        .filter((entry): entry is { prov: ProviderDef; payload: ByokKeyPayload } => entry.payload !== null);

      const patchEntries: Array<{ id: string; updates: Partial<ByokProviderRecord> }> = [];
      for (const r of currentRemote) {
        if (r.id) {
          const isCustom = currentForm.customEndpoints?.find((c) => c.id === r.id);
          if (isCustom) {
            patchEntries.push({
              id: r.id,
              updates: {
                modelProviderName: isCustom.name,
                customBaseURL: isCustom.url,
                enabled: isCustom.enabled !== false,
                availableModels: isCustom.models,
              }
            });
          } else {
            const provKey = r.modelProviderName.toLowerCase();
            patchEntries.push({
              id: r.id,
              updates: {
                enabled: currentForm.providerEnabled?.[provKey] !== false,
                availableModels: currentForm.providerSelectedModels?.[provKey],
              }
            });
          }
        }
      }

      const cleanedCustoms = (currentForm.customEndpoints || []).filter(
        (c) => c.key && c.key.trim().length > 0 && !isMaskedKey(c.key)
      );

      const finalForm: UserSettings = {
        ...currentForm,
        customEndpoints: cleanedCustoms,
      };

      if (newKeyEntries.length > 0 || patchEntries.length > 0) {
        Promise.allSettled([
          ...newKeyEntries.map((entry) => saveByokKey(entry.payload)),
          ...patchEntries.map((entry) => patchByokProvider(entry.id, entry.updates)),
        ])
          .then(() => {
            onSaveSettings(finalForm);
            fetchActiveModelList(true).catch(() => {});
            window.dispatchEvent(new Event('byok-models-updated'));
            toast.success('BYOK changes saved automatically', {
              description: 'You can now update your Workspace Settings to use your new model(s).',
              duration: 4000,
            });
          })
          .catch(() => {});
      } else if (isModified) {
        onSaveSettings(finalForm);
        toast.success('BYOK settings updated', {
          description: 'You can now update your Workspace Settings to use your new model(s).',
          duration: 4000,
        });
      }
    };
  }, [onSaveSettings]);

  const handleValidateKey = async (providerId: ProviderId) => {
    const prov = allProviders.find((p) => p.id === providerId);
    if (!prov) return;

    const payload = getProviderPayload(prov, form);
    if (!payload) return;

    setValidatingMap((prev) => ({ ...prev, [providerId]: true }));
    setValidatedErrorMap((prev) => ({ ...prev, [providerId]: false }));

    try {
      await saveByokKey(payload);
      setValidatedSuccessMap((prev) => ({ ...prev, [providerId]: true }));
      setTimeout(() => setValidatedSuccessMap((prev) => ({ ...prev, [providerId]: false })), 2500);
    } catch {
      setValidatedErrorMap((prev) => ({ ...prev, [providerId]: true }));
      setTimeout(() => setValidatedErrorMap((prev) => ({ ...prev, [providerId]: false })), 2500);
    } finally {
      setValidatingMap((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const toggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)] max-w-5xl mx-auto animate-apple-fade select-none">
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
            const matchedRemote = remoteProviders.find(
              (r) =>
                r.id === prov.id ||
                (r.modelProviderName || '').toLowerCase() === prov.id.toLowerCase() ||
                (prov.isCustom && prov.name && (r.modelProviderName || '').toLowerCase() === prov.name.toLowerCase())
            );
            const isAlreadySetOnServer = !!matchedRemote;
            let isConfigured = isAlreadySetOnServer || !!form[prov.valueKey as keyof UserSettings];
            let value = (form[prov.valueKey as keyof UserSettings] as string) || '';
            let baseUrl = '';
            
            if (prov.isCustom) {
              const ce = form.customEndpoints?.find(c => c.id === prov.id);
              isConfigured = isAlreadySetOnServer || (!!ce?.key && !isMaskedKey(ce.key));
              value = ce?.key || '';
              baseUrl = ce?.url || '';
            }

            const isExpanded = expandedProviderId === prov.id;
            const isValidating = validatingMap[prov.id];
            const isValidatedSuccess = validatedSuccessMap[prov.id];
            const isValidatedError = validatedErrorMap[prov.id];
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

            const handleRemove = async () => {
              const targetRemote = remoteProviders.find(
                (r) =>
                  r.id === prov.id ||
                  (r.modelProviderName || '').toLowerCase() === prov.id.toLowerCase() ||
                  (prov.isCustom && prov.name && (r.modelProviderName || '').toLowerCase() === prov.name.toLowerCase())
              );
              const targetIdToDelete = targetRemote?.id || prov.id;

              setDeletingMap((prev) => ({ ...prev, [prov.id]: true }));

              try {
                if (targetRemote || isConfigured) {
                  await deleteByokProvider(targetIdToDelete);
                }
              } catch (err) {
                console.error('Failed to delete provider from backend:', err);
              } finally {
                setDeletingMap((prev) => ({ ...prev, [prov.id]: false }));
              }

              if (prov.isCustom) {
                setForm(prev => ({
                  ...prev,
                  customEndpoints: prev.customEndpoints?.filter(c => c.id !== prov.id && c.name !== prov.name) || []
                }));
              } else {
                setForm(prev => ({
                  ...prev,
                  [prov.valueKey]: '',
                  providerSelectedModels: {
                    ...(prev.providerSelectedModels || {}),
                    [prov.id]: []
                  },
                  providerEnabled: {
                    ...(prev.providerEnabled || {}),
                    [prov.id]: false
                  }
                }));
              }

              setRemoteProviders(prev => prev.filter(r =>
                r.id !== targetIdToDelete &&
                (r.modelProviderName || '').toLowerCase() !== prov.id.toLowerCase() &&
                (r.modelProviderName || '').toLowerCase() !== (prov.name || '').toLowerCase()
              ));
              // Refresh model catalog cache and notify model pickers
              fetchActiveModelList(true).catch(() => {});
              window.dispatchEvent(new Event('byok-models-updated'));
              toast.success(
                prov.isCustom
                  ? `Custom endpoint "${prov.name}" removed`
                  : `${prov.name} API key removed`
              );
              if (expandedProviderId === prov.id) setExpandedProviderId(null);
            };

            const currentModels = prov.isCustom
              ? form.customEndpoints?.find(c => c.id === prov.id)?.models || []
              : form.providerSelectedModels?.[prov.id] || [];

            const isEntryEnabled = isConfigured && (
              prov.isCustom
                ? form.customEndpoints?.find(c => c.id === prov.id)?.enabled !== false
                : form.providerEnabled?.[prov.id] !== false
            );

            return (
              <div id={`provider-row-${prov.id}`} key={prov.id} className={`transition-colors ${idx !== filteredProviders.length - 1 ? 'border-b border-[#1c1d25]' : ''}`}>
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
                              className="bg-transparent border border-transparent hover:border-[#232530] focus:bg-[#0d1117] text-sm font-medium text-zinc-100 focus:outline-none focus:border-zinc-500 rounded-lg px-2 py-1 w-40 sm:w-56 transition-all pr-8 -ml-2"
                              placeholder="Custom Name"
                            />
                            <PencilIcon className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-100">
                              {prov.name}
                            </span>
                            {prov.id === 'inception' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold text-[#c0f200] bg-[#c0f200]/10 border border-[#c0f200]/40 animate-shiny-glare-loop uppercase tracking-wider shrink-0">
                                200M Free Tokens
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    {isConfigured ? (
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          isEntryEnabled
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
                        }`}
                      >
                        {isEntryEnabled ? 'Configured' : 'Disabled'}
                      </span>
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
                      Configure
                      {isExpanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
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
                        {/* Active Toggle Switch Row */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d1117] border border-[#232530]">
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-zinc-200">Provider Status</div>
                            <div className="text-[11px] text-zinc-400">
                              {!isConfigured
                                ? 'Configure and save an API key to enable'
                                : isEntryEnabled
                                  ? 'Active and enabled for code reviews and other AI features'
                                  : 'Temporarily disabled'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isEntryEnabled}
                              disabled={!isConfigured}
                              onClick={() => {
                                if (!isConfigured) return;
                                handleToggleEnabled(prov.id);
                              }}
                              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                !isConfigured
                                  ? 'bg-zinc-800 opacity-50 cursor-not-allowed'
                                  : isEntryEnabled
                                    ? 'bg-[#c0f200] cursor-pointer'
                                    : 'bg-zinc-700 cursor-pointer'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full ${
                                  isEntryEnabled ? 'bg-black translate-x-4' : 'bg-zinc-400 translate-x-0'
                                } shadow-xs transition duration-200 ease-in-out`}
                              />
                            </button>
                            <span className={`text-xs font-medium ${!isConfigured ? 'text-zinc-500' : isEntryEnabled ? 'text-zinc-200' : 'text-zinc-500'}`}>
                              {!isConfigured ? 'Disabled' : isEntryEnabled ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                        </div>

                        {prov.isCustom && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-zinc-200">Base URL</label>
                              <Popover
                                isOpen={openCompatibilityPopoverId === prov.id}
                                onClose={() => setOpenCompatibilityPopoverId(null)}
                                width="w-80"
                                align="right"
                                trigger={
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenCompatibilityPopoverId(
                                        openCompatibilityPopoverId === prov.id ? null : prov.id
                                      )
                                    }
                                    className="text-[11px] text-[#c0f200] hover:underline font-mono inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>OpenAI-Compatible only</span>
                                    <InformationCircleIcon className="w-3.5 h-3.5 text-[#c0f200]" />
                                  </button>
                                }
                                content={
                                  <div className="p-3.5 space-y-2 text-xs text-zinc-300 font-sans">
                                    <div className="flex items-center justify-between border-b border-[#2d3340] pb-2">
                                      <span className="font-bold text-zinc-100 text-xs flex items-center gap-1.5">
                                        <GlobeAltIcon className="w-3.5 h-3.5 text-[#c0f200]" />
                                        OpenAI-Compatible Standard
                                      </span>
                                      <span className="text-[10px] text-zinc-500 font-mono">/v1 API</span>
                                    </div>

                                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                                      Custom endpoints must follow OpenAI's standard REST schema (<code className="text-[#c0f200] font-mono text-[10px]">/v1/chat/completions</code> &amp; <code className="text-[#c0f200] font-mono text-[10px]">/v1/models</code>).
                                    </p>

                                    <p className="text-[11px] text-zinc-400 leading-relaxed bg-[#121319] p-2 rounded-lg border border-[#232530]">
                                      The entire AI industry (OpenRouter, DeepSeek, Google Gemini, Anthropic, Together, Groq) uses this unified standard for drop-in LLM routing.
                                    </p>

                                    <div className="space-y-1 pt-0.5">
                                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Common Base URLs</div>
                                      <div className="space-y-1 font-mono text-[10px] text-zinc-400">
                                        <div className="flex justify-between items-center gap-2"><span>Inception Labs:</span><span className="text-[#c0f200] truncate">https://api.inceptionlabs.ai/v1/chat/completions</span></div>
                                        <div className="flex justify-between items-center gap-2"><span>OpenRouter:</span><span className="text-zinc-200 truncate">https://openrouter.ai/api/v1</span></div>
                                        <div className="flex justify-between items-center gap-2"><span>DeepSeek:</span><span className="text-zinc-200 truncate">https://api.deepseek.com/v1</span></div>
                                        <div className="flex justify-between items-center gap-2"><span>Google Gemini:</span><span className="text-zinc-200 truncate">https://generativelanguage.googleapis.com/v1beta/openai</span></div>
                                        <div className="flex justify-between items-center gap-2"><span>Anthropic:</span><span className="text-zinc-200 truncate">https://api.anthropic.com/v1</span></div>
                                      </div>
                                    </div>
                                  </div>
                                }
                              />
                            </div>
                            <input
                              type="text"
                              value={baseUrl}
                              onChange={(e) => handleUpdate('url', e.target.value)}
                              placeholder="https://api.example.com/v1"
                              className="w-full bg-[#0d1117] border border-[#232530] rounded-lg px-3.5 py-2 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                            />
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-200 block">API Key / Credentials</label>
                          
                          {isConfigured ? (
                            <div className="flex items-center justify-between px-3 py-1.5 min-h-[38px] rounded-lg bg-[#0d1117] border border-[#232530] gap-2">
                              {/* Left: Key icon + Masked dots */}
                              <div className="flex items-center gap-2.5 min-w-0">
                                <KeyIcon className="w-3.5 h-3.5 text-[#c0f200] shrink-0" />
                                <span className="text-xs font-mono text-zinc-400 tracking-widest select-none">
                                  ••••••••••••••••••••••••••••
                                </span>
                              </div>

                              {/* Right: Encrypted Info Chip with detailed Popover on Hover */}
                              <div
                                className="ml-auto shrink-0"
                                onMouseEnter={() => setOpenKeyInfoPopoverId(prov.id)}
                                onMouseLeave={() => setOpenKeyInfoPopoverId(null)}
                              >
                                <Popover
                                  isOpen={openKeyInfoPopoverId === prov.id}
                                  onClose={() => setOpenKeyInfoPopoverId(null)}
                                  width="w-80"
                                  side="right"
                                  align="right"
                                  trigger={
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenKeyInfoPopoverId(
                                          openKeyInfoPopoverId === prov.id ? null : prov.id
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-zinc-500 text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs"
                                    >
                                      <LockClosedIcon className="w-3 h-3 text-[#c0f200]" />
                                      <span className="font-sans font-medium">Encrypted</span>
                                      <InformationCircleIcon className="w-3 h-3 text-zinc-400" />
                                    </button>
                                  }
                                  content={
                                    <div
                                      className="p-3.5 space-y-2 text-xs text-zinc-300 font-sans"
                                      onMouseEnter={() => setOpenKeyInfoPopoverId(prov.id)}
                                      onMouseLeave={() => setOpenKeyInfoPopoverId(null)}
                                    >
                                      <div className="flex items-start gap-2 font-semibold text-zinc-100 text-xs pb-2 border-b border-[#2d3340]">
                                        <ShieldCheckIcon className="w-4 h-4 text-[#c0f200] shrink-0 mt-0.5" />
                                        <span>AES-256 Encrypted &amp; Protected</span>
                                      </div>
                                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                                        Your API key is securely encrypted at rest. It cannot be seen or retrieved by anyone. The system decrypts it in-memory only when you make a review or chat request.
                                      </p>
                                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 leading-normal">
                                        <InformationCircleIcon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                        <span>To change your API key or configure a different custom model, please delete the existing key first.</span>
                                      </div>
                                    </div>
                                  }
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                              <div className="relative flex-1">
                                <input
                                  type={showCurrentKey ? 'text' : 'password'}
                                  value={value}
                                  onChange={(e) => handleUpdate('key', e.target.value)}
                                  placeholder={prov.placeholder}
                                  className="w-full bg-[#0d1117] border border-[#232530] rounded-lg px-3.5 py-2 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleShowKey(prov.id)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                  {showCurrentKey ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                isLoading={isValidating}
                                onClick={() => handleValidateKey(prov.id)}
                                disabled={!value}
                                className="shrink-0 h-9 text-xs"
                              >
                                {isValidatedSuccess ? (
                                  <span className="flex items-center gap-1.5 text-emerald-400">
                                    <CheckIcon className="w-3.5 h-3.5" /> Valid
                                  </span>
                                ) : isValidatedError ? (
                                  <span className="text-rose-400">Failed</span>
                                ) : (
                                  'Test Key'
                                )}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Models Integration Row */}
                        <div className="pt-3 border-t border-[#1c1d25] flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0 pr-3">
                            <span className="text-zinc-400 font-medium shrink-0">Models:</span>
                            {currentModels.length > 0 ? (
                              <span className="text-zinc-200 font-medium text-xs">
                                {currentModels.length} model{currentModels.length !== 1 ? 's' : ''} selected
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-xs">All default models active</span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenModelSelector(prov)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#c0f200]/30 hover:border-[#c0f200]/70 bg-[#c0f200]/10 hover:bg-[#c0f200]/20 text-[#c0f200] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 group/btn shadow-xs"
                          >
                            <span>{currentModels.length > 0 ? 'Edit models' : 'Select models'}</span>
                            <ArrowRightIcon className="w-3 h-3 text-[#c0f200] group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                        
                        {(isConfigured || prov.isCustom) && (
                          <div className="pt-2 flex items-center justify-start">
                            <button 
                              type="button"
                              disabled={deletingMap[prov.id]}
                              onClick={handleRemove}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingMap[prov.id] ? (
                                <>
                                  <ArrowPathIcon className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                                  <span>{prov.isCustom ? 'Deleting Endpoint…' : 'Removing API Key…'}</span>
                                </>
                              ) : (
                                <>
                                  <TrashIcon className="w-3.5 h-3.5" />
                                  <span>{prov.isCustom ? 'Delete Custom Endpoint' : 'Remove API Key'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Inception Labs Promotion Poster inside its expanded view - compact full width */}
                      {prov.id === 'inception' && (
                        <div className="w-full mt-3.5 px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-[#121520] via-[#141824] to-[#10131d] border border-[#232736] hover:border-[#333b50] rounded-xl flex items-start justify-between gap-4 transition-all shadow-sm group">
                          {/* Grouped: Logo + Sponsored + Heading + Subheading */}
                          <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                            {/* Logo */}
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#161a26] border border-[#293246] p-1.5 sm:p-2 flex items-center justify-center shrink-0 group-hover:border-[#3c4966] transition-colors shadow-xs mt-0.5">
                              <InceptionLogo className="w-full h-full object-contain" />
                            </div>

                            {/* Text Group: Sponsored, Heading, Subheading with minimal gap */}
                            <div className="min-w-0 max-w-3xl flex flex-col items-start">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 uppercase tracking-wider leading-none mb-1">
                                Sponsored
                              </span>
                              <h3 className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-white tracking-tight leading-snug">
                                Claim 200 Million Free LLM Tokens
                              </h3>
                              <p className="text-[11px] sm:text-xs text-zinc-400 leading-normal mt-0.5">
                                Get 200 million free tokens to test Mercury 2 by Inception Labs — featuring sub-second speed, adjustable reasoning, and an OpenAI-compatible API.
                              </p>
                            </div>
                          </div>

                          {/* Right End: Claim Button justified to top */}
                          <div className="shrink-0 pt-0.5">
                            <a
                              href="https://benchlm.ai/api/sponsored/inception?placement=homepage_top_sponsor"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-medium border border-[#c0f200] text-[#c0f200] bg-transparent hover:bg-[#c0f200] hover:text-black active:bg-[#a5d400] transition-all duration-150 shadow-xs cursor-pointer whitespace-nowrap h-7 sm:h-7.5"
                            >
                              Claim 200M Free Tokens
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save and Add Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          {saveError && (
            <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2.5">
              {saveError}
            </div>
          )}
          <div className="flex justify-start gap-4">
            {(isDirty || savedSuccess) && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckIcon className="w-4 h-4 text-black" />}
                onClick={handleSave}
                isLoading={isSaving}
                disabled={isSaving}
              >
                {savedSuccess ? 'Saved!' : 'Save Changes'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              leftIcon={<PlusIcon className="w-4 h-4 text-zinc-400" />}
              onClick={handleCreateCustomEndpoint}
            >
              Add Custom Endpoint
            </Button>
          </div>
        </div>
      </div>

      {/* Model Selector Popover / Modal */}
      {modelSelectorConfig?.isOpen && (
        <ModelSelectorModal
          isOpen={modelSelectorConfig.isOpen}
          onClose={() => setModelSelectorConfig(null)}
          providerId={modelSelectorConfig.providerId}
          providerName={modelSelectorConfig.providerName}
          apiKey={modelSelectorConfig.apiKey}
          customBaseURL={modelSelectorConfig.customBaseURL}
          initialSelectedModels={modelSelectorConfig.initialSelectedModels}
          onConfirmSelection={handleSaveSelectedModels}
        />
      )}
    </div>
  );
};
