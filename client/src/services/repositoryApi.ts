/**
 * Repository API Service
 * Interacts with backend /repository endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.gobetter.dev';

export interface ConnectedRepository {
  id: string;
  repositoryId: string;
  repositoryName: string;
  repositoryHTML: string;
  autoReviewActive: boolean;
  reviewMode: string;
  targetReviewBranch?: string[] | null;
}

export interface RepositoryListResponse {
  repositories: ConnectedRepository[];
  manageUrl: string;
  isGithubConnected: boolean;
  githubProfile: string | null;
}

export interface SyncRepositoryResponse {
  message: string;
  repositories: ConnectedRepository[];
  manageUrl: string;
}

/**
 * Fetches connected repositories for the current user.
 */
export async function fetchConnectedRepositories(): Promise<RepositoryListResponse> {
  const res = await fetch(`${API_BASE_URL}/repository`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Failed to fetch repositories (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * Re-queries GitHub to sync the latest authorized repositories.
 */
export async function syncConnectedRepositories(): Promise<SyncRepositoryResponse> {
  const res = await fetch(`${API_BASE_URL}/repository/sync`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Sync failed' }));
    throw new Error(errorData.error || `Failed to sync repositories (${res.status})`);
  }

  return res.json();
}

/**
 * Gets the direct GitHub URL for modifying repository permissions.
 */
export async function fetchManageGithubUrl(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE_URL}/repository/manage-url`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data.manageUrl || 'https://github.com/settings/installations';
    }
  } catch (err) {
    console.warn('Could not fetch manage URL:', err);
  }

  return 'https://github.com/settings/installations';
}
