import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  UnifiedModelItem,
  DEFAULT_MODEL_CATALOG,
  ACTIVE_MODEL_CATALOG_CACHE_KEY,
  fetchActiveModelList,
} from '../services/modelCatalogService';

const FAVORITES_STORAGE_KEY = 'gobe_favorite_model_ids';
const ACTIVE_MODEL_STORAGE_KEY = 'gobe_active_model_id';

const ACTIVE_MODEL_EVENT = 'gobe-active-model-changed';
const FAVORITES_EVENT = 'gobe-favorites-changed';
const MODELS_EVENT = 'gobe-models-catalog-changed';

const DEFAULT_FAVORITES = ['gpt-4o', 'deepseek-r1', 'gemini-2.0-flash'];

export function useModelPicker() {
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBrandTab, setActiveBrandTab] = useState<string>('favorites');

  // Favorites (100% LocalStorage - zero backend calls)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    } catch {
      return DEFAULT_FAVORITES;
    }
  });

  // Active Model selection
  const [activeModelId, setActiveModelId] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_MODEL_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const toggleFavorite = useCallback((modelId: string) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(modelId);
      const next = exists ? prev.filter((id) => id !== modelId) : [...prev, modelId];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: next }));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (modelId: string) => favoriteIds.includes(modelId),
    [favoriteIds]
  );

  const selectModel = useCallback((model: UnifiedModelItem | string) => {
    const id = typeof model === 'string' ? model : model.id;
    setActiveModelId(id);
    try {
      localStorage.setItem(ACTIVE_MODEL_STORAGE_KEY, id);
    } catch {
      // Ignore
    }
    window.dispatchEvent(new CustomEvent(ACTIVE_MODEL_EVENT, { detail: id }));
  }, []);

  const refreshModels = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    try {
      const list = await fetchActiveModelList(forceRefresh);
      setModels(list);
      window.dispatchEvent(new CustomEvent(MODELS_EVENT, { detail: list }));
      if (forceRefresh) {
        toast.success('Model list updated');
      }
    } catch {
      setModels(DEFAULT_MODEL_CATALOG);
      if (forceRefresh) {
        toast.error('Failed to update model list');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch loads from cache if present, without redundant network calls
    void refreshModels(false);

    // Listen for BYOK updates across components in the current window
    const handleByokUpdated = () => {
      void refreshModels(true);
    };

    // Listen for storage changes across tabs/windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === ACTIVE_MODEL_CATALOG_CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setModels(parsed);
          }
        } catch {}
      } else if (e.key === FAVORITES_STORAGE_KEY && e.newValue) {
        try {
          setFavoriteIds(JSON.parse(e.newValue));
        } catch {}
      } else if (e.key === ACTIVE_MODEL_STORAGE_KEY && e.newValue) {
        setActiveModelId(e.newValue);
      }
    };

    // Listen for active model changes within the SAME window (e.g. top and bottom pickers)
    const handleActiveModelChanged = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') {
        setActiveModelId(detail);
      }
    };

    const handleFavoritesChanged = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail;
      if (Array.isArray(detail)) {
        setFavoriteIds(detail);
      }
    };

    const handleModelsChanged = (e: Event) => {
      const detail = (e as CustomEvent<UnifiedModelItem[]>).detail;
      if (Array.isArray(detail) && detail.length > 0) {
        setModels(detail);
      }
    };

    window.addEventListener('byok-models-updated', handleByokUpdated);
    window.addEventListener('storage', handleStorage);
    window.addEventListener(ACTIVE_MODEL_EVENT, handleActiveModelChanged as EventListener);
    window.addEventListener(FAVORITES_EVENT, handleFavoritesChanged as EventListener);
    window.addEventListener(MODELS_EVENT, handleModelsChanged as EventListener);

    return () => {
      window.removeEventListener('byok-models-updated', handleByokUpdated);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(ACTIVE_MODEL_EVENT, handleActiveModelChanged as EventListener);
      window.removeEventListener(FAVORITES_EVENT, handleFavoritesChanged as EventListener);
      window.removeEventListener(MODELS_EVENT, handleModelsChanged as EventListener);
    };
  }, [refreshModels]);

  const activeModel = useMemo(() => {
    // 1. Match selected id from active user models (exact or suffix/prefix match)
    if (activeModelId) {
      const target = activeModelId.toLowerCase().trim();
      const match = models.find((m) => {
        const mId = m.id.toLowerCase().trim();
        return (
          mId === target ||
          mId.endsWith(`/${target}`) ||
          target.endsWith(`/${mId}`)
        );
      });
      if (match) return match;
    }
    // 2. Default to first active model from user's configured models
    if (models.length > 0) {
      return models[0];
    }
    // 3. Fallback to default catalog
    return DEFAULT_MODEL_CATALOG[0];
  }, [models, activeModelId]);

  // Filter models by brand tab and search query
  const filteredModels = useMemo(() => {
    let result = models;

    if (activeBrandTab === 'favorites') {
      result = result.filter((m) => favoriteIds.includes(m.id));
    } else if (activeBrandTab !== 'all') {
      result = result.filter((m) => m.brand === activeBrandTab || m.providerId === activeBrandTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.providerLabel.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [models, activeBrandTab, searchQuery, favoriteIds]);

  return {
    models,
    isLoading,
    searchQuery,
    setSearchQuery,
    activeBrandTab,
    setActiveBrandTab,
    favoriteIds,
    toggleFavorite,
    isFavorite,
    activeModel,
    selectModel,
    filteredModels,
    refreshModels,
  };
}
