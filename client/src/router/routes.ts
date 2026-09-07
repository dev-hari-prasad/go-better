export type NavTab =
  | 'overview'
  | 'repositories'
  | 'pull-requests'
  | 'reviews'
  | 'activity'
  | 'settings'
  | 'byok'
  | 'ai-chat'
  | 'analytics'
  | 'roadmap'
  | 'try-public'
  | 'terms'
  | 'privacy-policy'
  | 'subprocessors';

export type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

export interface RouteMatch {
  tab: NavTab;
  prId?: string;
  authMode?: AuthMode;
  filter?: string;
  isNotFound?: boolean;
}

/**
 * Canonical URL path for each navigational tab.
 * Notice: 'ai-chat' -> '/gobe-ai', 'byok' -> '/byok', 'pull-requests' -> '/pull-requests'.
 */
export const TAB_TO_PATH: Record<NavTab, string> = {
  overview: '/dashboard',
  'ai-chat': '/gobe-ai',
  'pull-requests': '/pull-requests',
  reviews: '/reviews',
  repositories: '/repositories',
  activity: '/activity',
  settings: '/settings',
  byok: '/byok',
  analytics: '/analytics',
  roadmap: '/roadmap',
  'try-public': '/try-public',
  terms: '/terms',
  'privacy-policy': '/privacy-policy',
  subprocessors: '/subprocessors',
};

/**
 * Page titles matching each view
 */
export const TAB_TITLES: Record<NavTab, string> = {
  overview: 'Dashboard | GoBetter AI',
  'ai-chat': 'Gobe AI Chat | GoBetter AI',
  'pull-requests': 'Pull Requests | GoBetter AI',
  reviews: 'Code Review | GoBetter AI',
  repositories: 'Repositories | GoBetter AI',
  activity: 'Activity Log | GoBetter AI',
  settings: 'Workspace Settings | GoBetter AI',
  byok: 'BYOK & API Keys | GoBetter AI',
  analytics: 'Analytics & Spending | GoBetter AI',
  roadmap: 'Project Roadmap | GoBetter AI',
  'try-public': 'Try Public Repo Sandbox | GoBetter AI',
  terms: 'Terms of Service | GoBetter AI',
  'privacy-policy': 'Privacy Policy | GoBetter AI',
  subprocessors: 'Subprocessors | GoBetter AI',
};

/**
 * Parses any incoming browser URL pathname and search query string into a structured RouteMatch.
 */
export function parseRoute(
  pathname: string = window.location.pathname,
  search: string = window.location.search
): RouteMatch {
  // Normalize pathname: remove trailing slashes and normalize case
  const normalized = (pathname || '/').replace(/\/+$/, '') || '/';
  const clean = normalized.toLowerCase();
  const params = new URLSearchParams(search);
  const prFromQuery = params.get('pr') || params.get('id') || undefined;
  const statusFilter = params.get('status') || undefined;
  const authFromQuery = params.get('auth');

  // Direct Auth routes
  if (clean === '/login') {
    return { tab: 'overview', authMode: 'login' };
  }
  if (clean === '/signup') {
    return { tab: 'overview', authMode: 'signup' };
  }
  if (clean === '/forgot-password' || clean === '/forgotpassword') {
    return { tab: 'overview', authMode: 'forgot-password' };
  }
  if (clean === '/reset-password' || clean === '/resetpassword') {
    return { tab: 'overview', authMode: 'reset-password' };
  }

  // Legal documentation routes
  if (
    clean === '/terms' ||
    clean === '/terms-of-service' ||
    clean === '/tos' ||
    clean === '/legal/terms' ||
    clean === '/legal/terms-of-service'
  ) {
    return { tab: 'terms' };
  }
  if (
    clean === '/privacy-policy' ||
    clean === '/privacy' ||
    clean === '/legal/privacy' ||
    clean === '/legal/privacy-policy'
  ) {
    return { tab: 'privacy-policy' };
  }
  if (
    clean === '/subprocessors' ||
    clean === '/sub-processors' ||
    clean === '/legal/subprocessors' ||
    clean === '/legal/sub-processors'
  ) {
    return { tab: 'subprocessors' };
  }

  // GoBetter AI Chat (explicitly requested: /gobe-ai)
  if (clean === '/gobe-ai' || clean === '/ai-chat' || clean === '/chat' || clean === '/ai') {
    return { tab: 'ai-chat' };
  }

  // Pull Requests & Specific PR Review: /pull-requests/:id or /reviews/:id
  const prDetailMatch = normalized.match(/^\/(?:pull-requests|reviews)\/([^/]+)/i);
  if (prDetailMatch) {
    const rawId = prDetailMatch[1];
    return { tab: 'reviews', prId: decodeURIComponent(rawId) };
  }

  if (clean === '/pull-requests' || clean === '/prs') {
    if (prFromQuery) {
      return { tab: 'reviews', prId: prFromQuery, filter: statusFilter };
    }
    return { tab: 'pull-requests', filter: statusFilter };
  }

  if (clean === '/reviews') {
    return { tab: 'reviews', prId: prFromQuery };
  }

  // BYOK & Keys (explicitly requested: /byok)
  if (clean === '/byok' || clean === '/keys' || clean === '/byok-keys') {
    return { tab: 'byok' };
  }

  // Repositories
  if (clean === '/repositories' || clean === '/repos' || clean === '/repo') {
    return { tab: 'repositories' };
  }

  // Activity Log
  if (clean === '/activity' || clean === '/logs' || clean === '/activity-log') {
    return { tab: 'activity' };
  }

  // Analytics & Spending
  if (clean === '/analytics' || clean === '/usage' || clean === '/spending') {
    return { tab: 'analytics' };
  }

  // Roadmap
  if (clean === '/roadmap') {
    return { tab: 'roadmap' };
  }

  // Try Public Repo Sandbox
  if (clean === '/try-public' || clean === '/explore' || clean === '/sandbox') {
    return { tab: 'try-public' };
  }

  // Workspace Settings
  if (clean === '/settings' || clean === '/workspace-settings') {
    return { tab: 'settings' };
  }

  // Overview / Dashboard Root
  if (clean === '/' || clean === '/overview' || clean === '/dashboard') {
    const validAuth = authFromQuery === 'login' || authFromQuery === 'signup' || authFromQuery === 'forgot-password' || authFromQuery === 'reset-password';
    return {
      tab: 'overview',
      authMode: validAuth ? (authFromQuery as AuthMode) : undefined,
      filter: statusFilter,
    };
  }

  // Fallback / Unknown path -> Default to overview
  return { tab: 'overview', isNotFound: true };
}

/**
 * Builds the canonical URL string for a given tab and options.
 */
export function buildUrl(
  tab: NavTab,
  options?: {
    prId?: string;
    filter?: string;
    authMode?: AuthMode;
  }
): string {
  if (options?.authMode) {
    return `/${options.authMode}`;
  }

  let basePath = TAB_TO_PATH[tab] || '/dashboard';

  // For specific PR review, use /pull-requests/:id
  if (tab === 'reviews' && options?.prId) {
    basePath = `/pull-requests/${encodeURIComponent(options.prId)}`;
  }

  const queryParams = new URLSearchParams();
  if (options?.filter && options.filter !== 'all') {
    queryParams.set('status', options.filter);
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return `${basePath}${queryString}`;
}

export interface NavigateOptions {
  prId?: string;
  filter?: string;
  authMode?: AuthMode;
  replace?: boolean;
}

/**
 * Programmatically changes the route, updating browser URL history and dispatching event.
 */
export function navigateTo(tab: NavTab, options?: NavigateOptions): void {
  const targetUrl = buildUrl(tab, options);
  const currentUrl = window.location.pathname + window.location.search;

  if (currentUrl !== targetUrl) {
    if (options?.replace) {
      window.history.replaceState({ tab, prId: options?.prId }, '', targetUrl);
    } else {
      window.history.pushState({ tab, prId: options?.prId }, '', targetUrl);
    }
  }

  // Update document title
  const newTitle = TAB_TITLES[tab] || 'GoBetter AI';
  document.title = newTitle;

  // Dispatch custom navigation event so all app subscribers sync immediately
  window.dispatchEvent(
    new CustomEvent('app-route-change', {
      detail: {
        tab,
        prId: options?.prId,
        filter: options?.filter,
        authMode: options?.authMode,
        url: targetUrl,
      },
    })
  );
}
