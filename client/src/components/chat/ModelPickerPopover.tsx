import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  RotateCw,
  Star,
  Brain,
  Wrench,
  Info,
  X,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { UnifiedModelItem } from '../../services/modelCatalogService';
import { ModelBrandIcon } from './ModelBrandIcon';
import { ModelDetailsCard } from './ModelDetailsCard';
import { GobeAiLogo } from '../ui/GobeAiLogo';
import { navigateTo } from '../../router/routes';
import { fetchUserUsage } from '../../services/usageApi';

export interface ModelPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  models: UnifiedModelItem[];
  activeModel: UnifiedModelItem;
  onSelectModel: (model: UnifiedModelItem) => void;
  favoriteIds: string[];
  onToggleFavorite: (modelId: string) => void;
  onRefreshModels?: () => void;
  isRefreshing?: boolean;
  placement?: 'top' | 'bottom' | 'center' | 'left' | 'left-up';
  align?: 'left' | 'right' | 'center';
  popoverClassName?: string;
  autoFocusChatInput?: boolean;
}

const BRAND_TABS: Array<{ id: string; label: string; iconBrand?: string; isStar?: boolean; isGobe?: boolean }> = [
  { id: 'favorites', label: 'Favorites', isStar: true },
  { id: 'gobetter', label: 'GoBetter Free Models', iconBrand: 'gobetter', isGobe: true },
  { id: 'anthropic', label: 'Anthropic', iconBrand: 'anthropic' },
  { id: 'openai', label: 'OpenAI', iconBrand: 'openai' },
  { id: 'gemini', label: 'Google Gemini', iconBrand: 'gemini' },
  { id: 'meta', label: 'Meta LLaMA', iconBrand: 'meta' },
  { id: 'deepseek', label: 'DeepSeek', iconBrand: 'deepseek' },
  { id: 'xai', label: 'xAI Grok', iconBrand: 'xai' },
  { id: 'nvidia', label: 'NVIDIA', iconBrand: 'nvidia' },
  { id: 'inception', label: 'Inception', iconBrand: 'inception' },
  { id: 'qwen', label: 'Alibaba Qwen', iconBrand: 'qwen' },
  { id: 'minimax', label: 'MiniMax', iconBrand: 'minimax' },
  { id: 'moonshot', label: 'Moonshot Kimi', iconBrand: 'moonshot' },
  { id: 'mistral', label: 'Mistral AI', iconBrand: 'mistral' },
  { id: 'zai', label: 'Zhipu GLM', iconBrand: 'zai' },
  { id: 'custom', label: 'Ollama', iconBrand: 'custom' },
];

export const ModelPickerPopover: React.FC<ModelPickerPopoverProps> = ({
  isOpen,
  onClose,
  models,
  activeModel,
  onSelectModel,
  favoriteIds,
  onToggleFavorite,
  onRefreshModels,
  isRefreshing = false,
  placement = 'bottom',
  align = 'right',
  popoverClassName = '',
  autoFocusChatInput = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBrandTab, setActiveBrandTab] = useState<string>('favorites');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [inspectedModel, setInspectedModel] = useState<UnifiedModelItem | null>(null);
  const [hoveredTab, setHoveredTab] = useState<{ id: string; label: string; top: number } | null>(null);
  const [isOutOfLimit, setIsOutOfLimit] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gobe_limit_exceeded') === 'true';
    } catch {
      return false;
    }
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Check whether user has exceeded usage limit
  useEffect(() => {
    if (!isOpen) return;

    try {
      if (localStorage.getItem('gobe_limit_exceeded') === 'true') {
        setIsOutOfLimit(true);
      }
    } catch {}

    let mounted = true;
    void fetchUserUsage().then((usage) => {
      if (!mounted) return;
      const isExceeded = Boolean(
        usage && usage.allowedExpenditureLimit > 0 && usage.utilizedCost >= usage.allowedExpenditureLimit
      );
      setIsOutOfLimit(isExceeded);
      try {
        if (isExceeded) {
          localStorage.setItem('gobe_limit_exceeded', 'true');
        } else {
          localStorage.removeItem('gobe_limit_exceeded');
        }
      } catch {}
    });

    const handleLimitExceeded = () => {
      setIsOutOfLimit(true);
    };
    window.addEventListener('gobe-usage-limit-exceeded', handleLimitExceeded);

    return () => {
      mounted = false;
      window.removeEventListener('gobe-usage-limit-exceeded', handleLimitExceeded);
    };
  }, [isOpen]);

  // Detect if user has any custom / BYOK provider configured (any non-GoBetter models)
  const hasCustomProvider = useMemo(() => {
    return models.some((m) => {
      const p = (m.providerId || '').toLowerCase();
      const b = (m.brand || '').toLowerCase();
      const l = (m.providerLabel || '').toLowerCase();
      const isGoBetter = p === 'gobetter' || b === 'gobetter' || l.includes('gobetter');
      return !isGoBetter;
    });
  }, [models]);

  const handleNavigateToByok = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
    navigateTo('byok');
  };

  const focusChatArea = () => {
    if (autoFocusChatInput) {
      window.dispatchEvent(new Event('focus-chat-input'));
      requestAnimationFrame(() => {
        const activeTextarea = document.querySelector(
          'textarea:not([disabled])'
        ) as HTMLTextAreaElement | null;
        if (activeTextarea) {
          activeTextarea.focus();
        }
      });
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setInspectedModel(null);
      setHighlightedIndex(-1);

      // Restore category tab from previous selection or active model
      try {
        const savedTab = localStorage.getItem('gobe_model_picker_last_tab');
        if (savedTab && (savedTab === 'favorites' || availableTabs.some((t) => t.id === savedTab))) {
          setActiveBrandTab(savedTab);
        } else if (activeModel) {
          if (favoriteIds.includes(activeModel.id)) {
            setActiveBrandTab('favorites');
          } else if (activeModel.providerId === 'gobetter' || activeModel.brand === 'gobetter') {
            setActiveBrandTab('gobetter');
          } else if (activeModel.brand && availableTabs.some((t) => t.id === activeModel.brand)) {
            setActiveBrandTab(activeModel.brand);
          } else {
            const rawLabel = activeModel.providerLabel || 'Ollama';
            const cleanLabel = rawLabel.toLowerCase() === 'custom endpoint' ? 'Ollama' : rawLabel;
            const customTabId = 'custom-' + cleanLabel.toLowerCase().replace(/\s+/g, '-');
            if (availableTabs.some((t) => t.id === customTabId)) {
              setActiveBrandTab(customTabId);
            } else {
              setActiveBrandTab('favorites');
            }
          }
        } else {
          setActiveBrandTab('favorites');
        }
      } catch {
        setActiveBrandTab('favorites');
      }

      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery, activeBrandTab]);

  // Compute active brand tabs (only show brands that have models, plus Favorites & unbranded custom tabs)
  const availableTabs = useMemo(() => {
    const presentBrands = new Set(models.map((m) => m.brand));
    const hasGoBetter = models.some(
      (m) =>
        m.providerId === 'gobetter' ||
        m.brand === 'gobetter' ||
        Boolean(m.providerLabel && m.providerLabel.toLowerCase().includes('gobetter'))
    );
    const tabs: Array<{ id: string; label: string; iconBrand?: string; isStar?: boolean; isGobe?: boolean }> = [
      { id: 'favorites', label: 'Favorites', isStar: true },
    ];

    for (const tab of BRAND_TABS) {
      if (tab.isStar || tab.id === 'custom') continue;
      if (tab.id === 'gobetter') {
        if (hasGoBetter) {
          tabs.push(tab);
        }
        continue;
      }
      if (presentBrands.has(tab.id as any)) {
        tabs.push(tab);
      }
    }

    // Collect custom endpoints ONLY for unbranded models (not already in a brand tab)
    const unbrandedCustomModels = models.filter((m) => m.brand === 'custom' || m.brand === 'other');
    const seenCustomLabels = new Set<string>();

    for (const cm of unbrandedCustomModels) {
      const rawLabel = cm.providerLabel || 'Ollama';
      const cleanLabel = rawLabel.toLowerCase() === 'custom endpoint' ? 'Ollama' : rawLabel;
      const tabId = 'custom-' + cleanLabel.toLowerCase().replace(/\s+/g, '-');
      if (!seenCustomLabels.has(tabId)) {
        seenCustomLabels.add(tabId);
        tabs.push({
          id: tabId,
          label: cleanLabel,
          iconBrand: 'custom',
        });
      }
    }

    return tabs;
  }, [models]);

  // If active tab has no models and isn't favorites, fall back
  useEffect(() => {
    if (activeBrandTab === 'favorites') {
      const hasAnyFav = models.some((m) => favoriteIds.includes(m.id));
      if (!hasAnyFav && availableTabs.length > 1) {
        const firstBrand = availableTabs.find((t) => !t.isStar);
        if (firstBrand) {
          setActiveBrandTab(firstBrand.id);
        }
      }
      return;
    }
    const exists = availableTabs.some((t) => t.id === activeBrandTab);
    if (!exists && availableTabs.length > 0) {
      setActiveBrandTab(availableTabs[0].id);
    }
  }, [availableTabs, activeBrandTab, models, favoriteIds]);

  // Filter models
  const filteredModels = useMemo(() => {
    let list = models;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return models.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.providerLabel.toLowerCase().includes(q)
      );
    }

    if (activeBrandTab === 'favorites') {
      const favs = list.filter((m) => favoriteIds.includes(m.id));
      list = favs.length > 0 ? favs : list;
    } else if (activeBrandTab === 'gobetter') {
      list = list.filter(
        (m) =>
          m.providerId === 'gobetter' ||
          m.brand === 'gobetter' ||
          Boolean(m.providerLabel && m.providerLabel.toLowerCase().includes('gobetter'))
      );
    } else if (activeBrandTab.startsWith('custom-')) {
      const targetLabel = activeBrandTab.replace('custom-', '');
      list = list.filter((m) => {
        const rawLabel = m.providerLabel || 'Ollama';
        const cleanLabel = rawLabel.toLowerCase() === 'custom endpoint' ? 'Ollama' : rawLabel;
        return (
          (m.brand === 'custom' || m.brand === 'other') &&
          cleanLabel.toLowerCase().replace(/\s+/g, '-') === targetLabel
        );
      });
    } else {
      list = list.filter((m) => m.brand === activeBrandTab || m.providerId === activeBrandTab);
    }

    return list;
  }, [models, activeBrandTab, favoriteIds, searchQuery]);

  // Scroll active highlighted model into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.code === 'Slash' || e.code === 'NumpadDivide')) {
      e.preventDefault();
      onClose();
      focusChatArea();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredModels.length === 0) return;
      setHighlightedIndex((prev) => (prev < 0 ? 0 : (prev + 1) % filteredModels.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredModels.length === 0) return;
      setHighlightedIndex((prev) => (prev <= 0 ? filteredModels.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredModels.length > 0) {
        const target = (highlightedIndex >= 0 && filteredModels[highlightedIndex]) ? filteredModels[highlightedIndex] : filteredModels[0];
        if (target) {
          onSelectModel(target);
          try {
            localStorage.setItem('gobe_model_picker_last_tab', activeBrandTab);
          } catch {}
          onClose();
          focusChatArea();
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      focusChatArea();
    }
  };

  if (!isOpen) return null;

  const isCenter = placement === 'center';
  const isLeft = placement === 'left' || placement === 'left-up';

  const positionClasses =
    placement === 'top'
      ? 'bottom-full mb-2'
      : placement === 'center'
      ? 'relative'
      : isLeft
      ? 'max-sm:right-0 max-sm:top-full max-sm:mt-1.5 sm:right-full sm:mr-2.5 sm:top-[-18px]'
      : 'top-full mt-1.5';

  const alignClasses =
    isLeft
      ? ''
      : align === 'left'
      ? 'left-0'
      : align === 'center'
      ? 'mx-auto'
      : 'right-0';

  const popoverContent = (
    <div
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={`${isCenter ? 'relative' : 'absolute'} ${isCenter ? '' : positionClasses} ${isCenter ? '' : alignClasses} z-50 w-[420px] sm:w-[460px] h-[410px] bg-[#0e1017] border border-[#222534] rounded-2xl shadow-2xl overflow-visible flex flex-col font-sans select-none animate-apple-scale outline-none ${popoverClassName}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Floating Tooltip to the Left of the Rail Icons */}
      {hoveredTab && (
        <div
          style={{ top: hoveredTab.top }}
          className="absolute right-full -translate-y-1/2 mr-2.5 z-[70] pointer-events-none"
        >
          <div className="relative px-2.5 py-1 rounded-lg bg-[#141722]/95 backdrop-blur-md text-zinc-100 text-xs font-semibold border border-[#2b2f42] shadow-[0_8px_24px_rgba(0,0,0,0.55)] whitespace-nowrap flex items-center gap-1.5 drop-shadow-xl animate-apple-fade">
            <span>{hoveredTab.label}</span>
            <div className="w-1.5 h-1.5 bg-[#141722] border-t border-r border-[#2b2f42] absolute -right-1 top-1/2 -translate-y-1/2 rotate-45" />
          </div>
        </div>
      )}

      {/* Top Search Bar */}
      <div className="h-11 px-3.5 flex items-center gap-2.5 border-b border-[#1c1e2c] bg-[#12141d]/80 rounded-t-2xl shrink-0">
        <Search className="w-4 h-4 text-zinc-500 shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
        />
        {searchQuery ? (
          <button
            onClick={() => setSearchQuery('')}
            className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-white/[0.05] border border-white/10 rounded">
              ESC
            </kbd>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRefreshModels?.();
              }}
              disabled={isRefreshing}
              title="Refresh models from BYOK"
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#c0f200]' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* 2-Column Body: Brand Rail + Models List */}
      <div className="flex flex-1 min-h-0 overflow-hidden rounded-b-2xl">
        {/* Left Vertical Brand Rail */}
        <div
          onScroll={() => setHoveredTab(null)}
          className="w-11 bg-[#0a0b0f] border-r border-[#191b24] py-2 flex flex-col items-center gap-1 shrink-0 overflow-y-auto overflow-x-hidden rounded-bl-2xl"
        >
          {availableTabs.map((tab, idx) => {
            const isActive = activeBrandTab === tab.id;
            return (
              <React.Fragment key={tab.id}>
                {idx === 1 && <div className="w-5 h-px bg-[#1c1d27] my-1 shrink-0" />}
                <button
                  type="button"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const containerRect = containerRef.current?.getBoundingClientRect();
                    if (containerRect) {
                      setHoveredTab({
                        id: tab.id,
                        label: tab.label,
                        top: rect.top - containerRect.top + rect.height / 2,
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredTab(null)}
                  onClick={() => {
                    setActiveBrandTab(tab.id);
                    setHoveredTab(null);
                    try {
                      localStorage.setItem('gobe_model_picker_last_tab', tab.id);
                    } catch {}
                    setInspectedModel(null);
                  }}
                  className={`w-7.5 h-7.5 min-w-[30px] min-h-[30px] aspect-square shrink-0 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? 'text-white bg-white/10 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {tab.isStar ? (
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isActive ? 'fill-amber-400 text-amber-400' : 'text-zinc-500 hover:text-amber-400'
                      }`}
                    />
                  ) : tab.isGobe || tab.id === 'gobetter' ? (
                    <GobeAiLogo
                      size={14}
                      variant="brand"
                      disableAnimation={true}
                      className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ) : tab.iconBrand ? (
                    <ModelBrandIcon modelIdOrBrand={tab.iconBrand} className="w-3.5 h-3.5" />
                  ) : null}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0e1017] rounded-br-2xl overflow-hidden">
          <div
            ref={listRef}
            onMouseLeave={() => setHighlightedIndex(-1)}
            className="flex-1 overflow-y-auto p-1.5 space-y-0.5"
          >
            {filteredModels.length === 0 ? (
              <div className="py-16 text-center px-4 space-y-2">
                <p className="text-xs font-medium text-zinc-400">No models found</p>
                <button
                  type="button"
                  onClick={handleNavigateToByok}
                  className="text-[11px] text-[#c0f200] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>{isOutOfLimit ? 'Ran out of limit? Add custom model' : 'Add custom models in BYOK settings'}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
            filteredModels.map((model, idx) => {
              const isSelected = activeModel?.id === model.id;
              const isFav = favoriteIds.includes(model.id);
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={model.id}
                  data-index={idx}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseLeave={() => setHighlightedIndex(-1)}
                  onClick={() => {
                    onSelectModel(model);
                    try {
                      localStorage.setItem('gobe_model_picker_last_tab', activeBrandTab);
                    } catch {}
                    onClose();
                    focusChatArea();
                  }}
                  className={`px-2.5 py-1.5 min-h-[34px] rounded-lg cursor-pointer transition-colors flex items-center gap-2.5 group ${
                    isSelected
                      ? 'bg-white/[0.08] text-white'
                      : isHighlighted
                      ? 'bg-white/[0.05] text-zinc-100'
                      : 'hover:bg-white/[0.035] text-zinc-300'
                  }`}
                >
                  {/* Left Brand Icon */}
                  <div className="shrink-0 text-zinc-300 flex items-center">
                    <ModelBrandIcon modelIdOrBrand={model.brand || model.id} className="w-4 h-4" />
                  </div>

                  {/* Center Column: Model Name with full title tooltip */}
                  <div className="flex-1 min-w-0 flex items-center">
                    <span
                      className="text-[13px] font-medium text-zinc-200 group-hover:text-white truncate block"
                      title={model.name}
                    >
                      {model.name}
                    </span>
                  </div>

                  {/* Right Actions: Provider Tag + Favorite Star Button + Reasoning badge + Info */}
                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Provider Tag on the Right End */}
                    {model.providerLabel && (
                      <span
                        title={`Provider: ${model.providerLabel}`}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded select-none truncate max-w-[110px] ${
                          model.providerId === 'gobetter' || model.providerLabel === 'GoBetter Free'
                            ? 'bg-[#c0f200]/15 text-[#c0f200] border border-[#c0f200]/30 font-semibold'
                            : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50'
                        }`}
                      >
                        {model.providerLabel}
                      </span>
                    )}

                    {/* Prominent Star / Favorite Button */}
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(model.id)}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        isFav
                          ? 'text-amber-400 hover:bg-amber-400/10'
                          : 'text-zinc-600 hover:text-amber-400 hover:bg-white/5 opacity-70 group-hover:opacity-100'
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 transition-transform ${
                          isFav ? 'fill-amber-400 text-amber-400 scale-105' : 'text-zinc-500 hover:text-amber-400'
                        }`}
                      />
                    </button>

                    {model.capabilities?.reasoning && (
                      <span title="Reasoning Model" className="text-amber-400/80 flex items-center">
                        <Brain className="w-3.5 h-3.5 hover:text-amber-400 transition-colors" />
                      </span>
                    )}

                    {/* Info Button */}
                    <button
                      type="button"
                      onClick={() => setInspectedModel(inspectedModel?.id === model.id ? null : model)}
                      title="View model details & pricing"
                      className="p-1 text-zinc-600 hover:text-zinc-300 hover:bg-white/5 rounded-md transition-colors cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          </div>

          {/* Bottom subtle prompt bar if user ran out of limit or does not have custom provider configured */}
          {(isOutOfLimit || !hasCustomProvider) && (
            <div className="shrink-0 px-3 py-2 border-t border-[#1a1c26] bg-[#0c0e15] flex items-center justify-between rounded-br-2xl select-none">
              {isOutOfLimit ? (
                <button
                  type="button"
                  onClick={handleNavigateToByok}
                  className="group flex items-center justify-between w-full text-[11px] text-amber-400/90 hover:text-amber-300 transition-colors cursor-pointer"
                  title="Go to BYOK settings to add custom models"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span className="truncate">
                      Ran out of limit?{' '}
                      <span className="underline decoration-amber-400/50 group-hover:decoration-amber-300 font-medium">
                        Add custom model
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0 ml-1 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNavigateToByok}
                  className="group flex items-center justify-between w-full text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Go to BYOK settings to add custom models"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover:bg-[#c0f200] transition-colors shrink-0" />
                    <span className="truncate group-hover:underline decoration-zinc-500">
                      Add custom models
                    </span>
                  </span>
                  <span className="text-[10px] text-[#c0f200] flex items-center gap-0.5 shrink-0 font-mono">
                    Configure{' '}
                    <ArrowUpRight className="w-3 h-3 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Model Inspector Overlay */}
      {inspectedModel && (
        <div
          className="absolute inset-0 z-[140] rounded-2xl overflow-hidden flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-apple-fade"
          onClick={() => setInspectedModel(null)}
        >
          <ModelDetailsCard
            model={inspectedModel}
            onClose={() => setInspectedModel(null)}
          />
        </div>
      )}
    </div>
  );

  if (isCenter) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-apple-fade"
        onClick={onClose}
      >
        {popoverContent}
      </div>
    );
  }

  return popoverContent;
};
