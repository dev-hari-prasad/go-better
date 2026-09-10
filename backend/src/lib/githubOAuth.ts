import crypto from 'node:crypto';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const DEFAULT_API_URL = 'http://localhost:5000';
const DEFAULT_CLIENT_URL = 'http://localhost:3000';

export type GitHubOAuthRequest = {
    state: string;
    codeVerifier: string;
};

export type GitHubOAuthConfiguration = {
    clientId: string | undefined;
    clientSecret: string | undefined;
    clientUrl: string;
    callbackUrl: string;
    scope: string;
};

function asHttpUrl(value: string, name: string): URL {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error(`${name} must use http or https`);
    }

    return url;
}

export function getGitHubOAuthConfiguration(
    env: NodeJS.ProcessEnv = process.env,
): GitHubOAuthConfiguration {
    const apiUrl = asHttpUrl(env.API_BASE_URL || DEFAULT_API_URL, 'API_BASE_URL');
    const clientUrl = asHttpUrl(env.CLIENT_URL || DEFAULT_CLIENT_URL, 'CLIENT_URL');
    const callbackUrl = new URL('/auth/github/callback', apiUrl).toString();

    return {
        // GITHUB_APP_* remains supported for installations already using the
        // original variable names. New deployments should use the OAuth names.
        clientId: env.GITHUB_OAUTH_CLIENT_ID?.trim() || env.GITHUB_APP_CLIENT_ID?.trim(),
        clientSecret: env.GITHUB_OAUTH_CLIENT_SECRET?.trim() || env.GITHUB_APP_CLIENT_SECRET?.trim(),
        clientUrl: clientUrl.toString(),
        callbackUrl,
        // OAuth apps need this permission for GET /user/emails. Preserve the
        // legacy GitHub App variables without a scope because GitHub Apps use
        // fine-grained permissions instead.
        scope: env.GITHUB_OAUTH_SCOPE
            ?? (env.GITHUB_OAUTH_CLIENT_ID || env.GITHUB_OAUTH_CLIENT_SECRET ? 'user:email' : ''),
    };
}

export function resolveClientRedirect(
    requestedUrl: string | undefined,
    configuredClientUrl: string,
): string {
    const configuredUrl = asHttpUrl(configuredClientUrl, 'CLIENT_URL');
    if (!requestedUrl) {
        return configuredUrl.toString();
    }

    try {
        const candidateUrl = asHttpUrl(requestedUrl, 'redirect_uri');
        return candidateUrl.origin === configuredUrl.origin
            ? candidateUrl.toString()
            : configuredUrl.toString();
    } catch {
        return configuredUrl.toString();
    }
}

export function createGitHubOAuthRequest(): GitHubOAuthRequest {
    return {
        state: crypto.randomBytes(32).toString('hex'),
        // A 32-byte base64url value is a valid 43-character PKCE verifier.
        codeVerifier: crypto.randomBytes(32).toString('base64url'),
    };
}

export function getCodeChallenge(codeVerifier: string): string {
    return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
}

export function statesMatch(expected: string | undefined, received: unknown): boolean {
    if (typeof received !== 'string' || !expected || expected.length !== received.length) {
        return false;
    }

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export function buildGitHubAuthorizationUrl(
    configuration: GitHubOAuthConfiguration,
    request: GitHubOAuthRequest,
): string {
    if (!configuration.clientId) {
        throw new Error('GitHub OAuth client ID is not configured');
    }

    const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
    authorizeUrl.searchParams.set('client_id', configuration.clientId);
    authorizeUrl.searchParams.set('redirect_uri', configuration.callbackUrl);
    authorizeUrl.searchParams.set('state', request.state);
    authorizeUrl.searchParams.set('code_challenge', getCodeChallenge(request.codeVerifier));
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');
    if (configuration.scope.trim()) {
        authorizeUrl.searchParams.set('scope', configuration.scope.trim());
    }

    return authorizeUrl.toString();
}
