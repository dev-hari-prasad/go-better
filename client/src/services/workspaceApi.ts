import { UserSettings } from '../types/codeReview';
import { getAuthUserId } from './pullRequestApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.gobetter.dev';

export interface WorkspaceAiSettingsRecord {
  id?: string;
  quickModeModel?: string | null;
  focusedModeModel?: string | null;
  deepModeModel?: string | null;
  systemPrompt?: string | null;
  quickModePrompt?: string | null;
  foucsedModePrompt?: string | null;
  deepModePrompt?: string | null;
}

/**
 * Fetch workspace settings for a specific tab (e.g. 'aiSettings')
 */
export async function fetchWorkspaceSettings(tab: string = 'aiSettings'): Promise<Partial<UserSettings> | null> {
  try {
    const userId = getAuthUserId();
    const response = await fetch(`${API_BASE_URL}/workspace/${tab}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userId,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const row: WorkspaceAiSettingsRecord | undefined = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    const mapped: Partial<UserSettings> = {};
    if (row.quickModeModel) mapped.lightModeModel = row.quickModeModel;
    if (row.focusedModeModel) mapped.standardModeModel = row.focusedModeModel;
    if (row.deepModeModel) mapped.thoroughModeModel = row.deepModeModel;
    if (row.systemPrompt !== undefined && row.systemPrompt !== null) mapped.systemPrompt = row.systemPrompt;
    if (row.quickModePrompt !== undefined && row.quickModePrompt !== null) mapped.lightModePrompt = row.quickModePrompt;
    if (row.foucsedModePrompt !== undefined && row.foucsedModePrompt !== null) mapped.standardModePrompt = row.foucsedModePrompt;
    if (row.deepModePrompt !== undefined && row.deepModePrompt !== null) mapped.thoroughModePrompt = row.deepModePrompt;

    return mapped;
  } catch (err) {
    console.error(`Failed to fetch workspace settings for tab ${tab}:`, err);
    return null;
  }
}

/**
 * Patch workspace settings for a specific tab (e.g. 'aiSettings')
 */
export async function patchWorkspaceSettings(
  tab: string = 'aiSettings',
  updates: Partial<UserSettings>
): Promise<boolean> {
  try {
    const userId = getAuthUserId();
    const payload: Partial<WorkspaceAiSettingsRecord> = {};

    if (updates.lightModeModel !== undefined) payload.quickModeModel = updates.lightModeModel;
    if (updates.standardModeModel !== undefined) payload.focusedModeModel = updates.standardModeModel;
    if (updates.thoroughModeModel !== undefined) payload.deepModeModel = updates.thoroughModeModel;
    if (updates.systemPrompt !== undefined) payload.systemPrompt = updates.systemPrompt;
    if (updates.lightModePrompt !== undefined) payload.quickModePrompt = updates.lightModePrompt;
    if (updates.standardModePrompt !== undefined) payload.foucsedModePrompt = updates.standardModePrompt;
    if (updates.thoroughModePrompt !== undefined) payload.deepModePrompt = updates.thoroughModePrompt;

    const response = await fetch(`${API_BASE_URL}/workspace/${tab}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userId,
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (err) {
    console.error(`Failed to patch workspace settings for tab ${tab}:`, err);
    return false;
  }
}
