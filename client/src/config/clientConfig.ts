/**
 * GoBetter Client Configuration Manager
 * Centralizes environment variables, runtime feature flags, and UI preferences.
 */

export const CONFIG_STORAGE_KEYS = {
  ENABLE_PUBLIC_REPOS: 'gobetter_feature_public_repos',
  CONFIG_CHANGED_EVENT: 'gobetter-config-changed',
} as const;

/**
 * Checks if the "Try Public Repo" sandbox tab is enabled.
 * Hierarchy:
 * 1. Environment variable `VITE_ENABLE_PUBLIC_REPOS` ('false' or '0' disables globally).
 * 2. LocalStorage override `gobetter_feature_public_repos` ('false' or '0' disables for current user).
 * 3. Default: true.
 */
export const isPublicReposTabEnabled = (): boolean => {
  const envVal = import.meta.env.VITE_ENABLE_PUBLIC_REPOS;
  if (envVal === 'false' || envVal === '0') {
    return false;
  }
  const localVal = localStorage.getItem(CONFIG_STORAGE_KEYS.ENABLE_PUBLIC_REPOS);
  if (localVal === 'false' || localVal === '0') {
    return false;
  }
  return true;
};

/**
 * Toggles the "Try Public Repo" tab visibility in localStorage and emits
 * an event so all components update reactively in real-time.
 */
export const setPublicReposTabEnabled = (enabled: boolean): void => {
  localStorage.setItem(CONFIG_STORAGE_KEYS.ENABLE_PUBLIC_REPOS, String(enabled));
  window.dispatchEvent(new CustomEvent(CONFIG_STORAGE_KEYS.CONFIG_CHANGED_EVENT, { detail: { enabled } }));
};

/**
 * Subscribes a listener to client configuration changes.
 */
export const subscribeToConfigChange = (callback: () => void): (() => void) => {
  const handler = () => callback();
  window.addEventListener(CONFIG_STORAGE_KEYS.CONFIG_CHANGED_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CONFIG_STORAGE_KEYS.CONFIG_CHANGED_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};
