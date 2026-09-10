export interface ByokKeyPayload {
  id?: string;
  userId?: string;
  modelProvider?: string;
  modelProviderName?: string;
  apiKey: string;
  customModel?: boolean;
  customModels?: any;
  customBaseURL?: string;
  customBaseUrl?: string;
  enabled?: boolean;
}

export interface FetchModelListPayload {
  modelProvider?: string;
  modelProviderName?: string;
  apiKey?: string;
  customBaseURL?: string;
}

export interface ByokProviderRecord {
  id: string;
  modelProviderName: string;
  enabled: boolean;
  customModels: boolean;
  customBaseURL?: string | null;
  customBaseUrl?: string | null;
  availabelModel?: any[] | null;
  availableModels?: any[] | null;
  byokModels?: any[] | null;
}

export interface FetchModelListResponse {
  byokModels?: any[];
  modelList?: any[];
  data?: any[];
}

export async function fetchByokProviders(): Promise<ByokProviderRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/byok/providers`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to fetch BYOK providers:', err);
    return [];
  }
}

export async function deleteByokProvider(providerId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/byok/providers/${encodeURIComponent(providerId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok && response.status !== 204 && response.status !== 404) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to delete provider (${response.status})`);
    }
  } catch (err: any) {
    console.warn('Failed to delete BYOK provider from server:', err);
  }
}

export async function patchByokProvider(
  providerId: string,
  updates: Partial<ByokProviderRecord>
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/byok/providers/${encodeURIComponent(providerId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { message: 'Provider not found on server, skipped' };
      }
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to update provider (${response.status})`);
    }

    return await response.json();
  } catch (err: any) {
    console.warn('Failed to patch BYOK provider:', err);
    return null;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.gobetter.dev';

export async function fetchModelList(payload: FetchModelListPayload): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/byok/model-list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        modelProviderName: payload.modelProviderName || payload.modelProvider,
        apiKey: payload.apiKey,
        customBaseURL: payload.customBaseURL,
      }),
    });

    if (response.status === 204) {
      return [];
    }

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const rawList = data?.byokModels ?? data?.modelList ?? data?.data ?? data ?? [];
    const list = Array.isArray(rawList)
      ? rawList
      : Array.isArray(rawList?.data)
      ? rawList.data
      : [];

    const flattened: any[] = [];
    for (const item of list) {
      if (!item) continue;
      if (item.modelProviderName || item.availableModels) {
        const avail = Array.isArray(item.availableModels)
          ? item.availableModels
          : [item.availableModels];
        for (const a of avail) {
          if (!a) continue;
          if (typeof a === 'string') {
            flattened.push(a);
          } else if (a.id || a.name || a.slug) {
            flattened.push(a);
          } else if (typeof a === 'object') {
            for (const [k, v] of Object.entries(a)) {
              flattened.push({
                id: k,
                name: k.split('/').pop() || k,
                ...(typeof v === 'object' ? (v as object) : {}),
              });
            }
          }
        }
      } else {
        flattened.push(item);
      }
    }

    return flattened;
  } catch (err) {
    console.error('Failed to fetch model list:', err);
    return [];
  }
}

export async function saveByokKey(payload: ByokKeyPayload): Promise<any> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/byok`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Could not reach the server. Is the backend running?');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail =
      typeof body?.error === 'string'
        ? body.error
        : typeof body?.message === 'string'
          ? body.message
          : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  return await response.json().catch(() => ({}));
}
