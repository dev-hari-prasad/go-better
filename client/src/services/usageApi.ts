import { getAuthUserId } from './pullRequestApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.gobetter.dev';
export const DEFAULT_TEMP_USER_ID = '5c7cc9f9-0306-422d-9970-8d46f6e35fa1';

export interface UsageData {
  utilizedCost: number;
  allowedExpenditureLimit: number;
}

export async function fetchUserUsage(userId?: string): Promise<UsageData> {
  const effectiveUserId = userId || getAuthUserId() || DEFAULT_TEMP_USER_ID;
  const sessionId = typeof window !== 'undefined' ? (localStorage.getItem('session_id') || '') : '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (sessionId) {
    headers['Authorization'] = `Bearer ${sessionId}`;
    headers['x-session-id'] = sessionId;
  } else if (effectiveUserId) {
    headers['Authorization'] = effectiveUserId;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/usage/${encodeURIComponent(effectiveUserId)}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          utilizedCost: 0,
          allowedExpenditureLimit: 0.30,
        };
      }
      throw new Error(`Failed to fetch usage: ${response.status}`);
    }

    const data = await response.json();
    const utilized = Number(data?.utilizedCost ?? 0);
    const limit = Number(data?.allowedExpenditureLimit ?? 0.30);

    return {
      utilizedCost: Number.isFinite(utilized) ? utilized : 0,
      allowedExpenditureLimit: Number.isFinite(limit) && limit > 0 ? limit : 0.30,
    };
  } catch (err) {
    return {
      utilizedCost: 0,
      allowedExpenditureLimit: 0.30,
    };
  }
}
