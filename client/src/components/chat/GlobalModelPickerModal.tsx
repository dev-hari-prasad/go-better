import React from 'react';
import { useModelPicker } from '../../hooks/useModelPicker';
import { ModelPickerPopover } from './ModelPickerPopover';
import { UnifiedModelItem } from '../../services/modelCatalogService';

export interface GlobalModelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelChange?: (model: UnifiedModelItem) => void;
}

export const GlobalModelPickerModal: React.FC<GlobalModelPickerModalProps> = ({
  isOpen,
  onClose,
  onModelChange,
}) => {
  const {
    models,
    activeModel,
    selectModel,
    favoriteIds,
    toggleFavorite,
    refreshModels,
    isLoading,
  } = useModelPicker();

  if (!isOpen) return null;

  const handleSelect = (model: UnifiedModelItem) => {
    selectModel(model);
    onModelChange?.(model);
    onClose();
  };

  return (
    <ModelPickerPopover
      isOpen={isOpen}
      onClose={onClose}
      models={models}
      activeModel={activeModel}
      onSelectModel={handleSelect}
      favoriteIds={favoriteIds}
      onToggleFavorite={toggleFavorite}
      onRefreshModels={() => refreshModels(true)}
      isRefreshing={isLoading}
      placement="center"
      align="center"
      autoFocusChatInput={false}
    />
  );
};
