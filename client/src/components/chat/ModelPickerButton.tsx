import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useModelPicker } from '../../hooks/useModelPicker';
import { ModelBrandIcon } from './ModelBrandIcon';
import { ModelPickerPopover } from './ModelPickerPopover';
import { UnifiedModelItem } from '../../services/modelCatalogService';

export interface ModelPickerButtonProps {
  size?: 'sm' | 'md';
  placement?: 'top' | 'bottom' | 'center' | 'left' | 'left-up';
  align?: 'left' | 'right' | 'center';
  className?: string;
  popoverClassName?: string;
  onModelChange?: (model: UnifiedModelItem) => void;
  enableShortcut?: boolean;
  showShortcutBadge?: boolean;
}

export const ModelPickerButton: React.FC<ModelPickerButtonProps> = ({
  size = 'md',
  placement = 'bottom',
  align = 'right',
  className = '',
  popoverClassName = '',
  onModelChange,
  enableShortcut = true,
  showShortcutBadge = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const {
    models,
    activeModel,
    selectModel,
    favoriteIds,
    toggleFavorite,
    refreshModels,
    isLoading,
  } = useModelPicker();

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutLabel = isMac ? '⌘/' : 'Ctrl /';

  // Listen for global gobe-toggle-model-picker shortcut event
  useEffect(() => {
    if (!enableShortcut) return;

    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ handled?: boolean }>;
      if (customEvent.detail?.handled) return;

      // If a ChatModal is currently open in DOM, only the button inside it handles the shortcut
      const isChatModalOpen = Boolean(document.querySelector('[data-gobe-chat-modal="true"]'));
      const isInsideChatModal = Boolean(buttonRef.current?.closest('[data-gobe-chat-modal="true"]'));

      if (isChatModalOpen && !isInsideChatModal) {
        return;
      }

      // Check if this button element is currently visible in DOM
      if (buttonRef.current && buttonRef.current.offsetParent === null) {
        return;
      }

      if (customEvent.detail) {
        customEvent.detail.handled = true;
      }

      setIsOpen((prev) => !prev);
    };

    window.addEventListener('gobe-toggle-model-picker', handleToggle);
    return () => window.removeEventListener('gobe-toggle-model-picker', handleToggle);
  }, [enableShortcut]);

  const handleSelect = (model: UnifiedModelItem) => {
    selectModel(model);
    if (onModelChange) {
      onModelChange(model);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div ref={buttonRef} className="relative inline-block text-left select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 bg-[#16171e] hover:bg-[#1f212c] border border-[#232532] hover:border-zinc-500 rounded-lg font-medium text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs shrink-0 ${
          isSmall ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-xs'
        } ${isOpen ? 'border-[#c0f200]/50 ring-1 ring-[#c0f200]/30' : ''} ${className}`}
        title={isOpen ? undefined : `Active Model: ${activeModel.name} (${activeModel.providerLabel}) • ${shortcutLabel}`}
      >
        <div className="w-3.5 h-3.5 flex items-center justify-center text-zinc-400">
          <ModelBrandIcon modelIdOrBrand={activeModel.brand || activeModel.id} className="w-3 h-3" />
        </div>

        <span className="truncate max-w-[120px] font-semibold">{activeModel.name}</span>

        {showShortcutBadge && (
          <kbd className="hidden sm:inline-flex items-center px-1 py-0.5 text-[9px] font-mono text-zinc-400 bg-white/[0.06] border border-white/10 rounded leading-none select-none">
            {shortcutLabel}
          </kbd>
        )}

        <ChevronDown
          className={`w-3 h-3 text-zinc-500 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-zinc-300' : ''
          }`}
        />
      </button>

      {/* Inline Floating Popover */}
      {isOpen && (
        <ModelPickerPopover
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          models={models}
          activeModel={activeModel}
          onSelectModel={handleSelect}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          onRefreshModels={() => refreshModels(true)}
          isRefreshing={isLoading}
          placement={placement}
          align={align}
          popoverClassName={popoverClassName}
        />
      )}
    </div>
  );
};
