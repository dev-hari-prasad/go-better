import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildGitHubAuthorizationUrl,
    createGitHubOAuthRequest,
    getCodeChallenge,
    getGitHubOAuthConfiguration,
    resolveClientRedirect,
    statesMatch,
} from './githubOAuth.ts';

const env = {
    API_BASE_URL: 'https://api.example.test',
    CLIENT_URL: 'https://app.example.test',
    GITHUB_OAUTH_CLIENT_ID: 'client-id',
};

test('builds an OAuth authorization URL with email access and PKCE', () => {
    const configuration = getGitHubOAuthConfiguration(env);
    const request = createGitHubOAuthRequest();
    const url = new URL(buildGitHubAuthorizationUrl(configuration, request));

    assert.equal(url.searchParams.get('redirect_uri'), 'https://api.example.test/auth/github/callback');
    assert.equal(url.searchParams.get('scope'), 'user:email');
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(url.searchParams.get('code_challenge'), getCodeChallenge(request.codeVerifier));
    assert.ok(statesMatch(request.state, url.searchParams.get('state')));
});

test('only accepts a configured client origin as a return URL', () => {
    assert.equal(
        resolveClientRedirect('https://app.example.test/login?source=github', env.CLIENT_URL),
        'https://app.example.test/login?source=github',
    );
    assert.equal(
        resolveClientRedirect('https://attacker.example.test', env.CLIENT_URL),
        'https://app.example.test/',
    );
    assert.equal(
        resolveClientRedirect('not-a-url', env.CLIENT_URL),
        'https://app.example.test/',
    );
});

test('keeps legacy GitHub App configuration scope-free', () => {
    const configuration = getGitHubOAuthConfiguration({
        API_BASE_URL: env.API_BASE_URL,
        CLIENT_URL: env.CLIENT_URL,
        GITHUB_APP_CLIENT_ID: 'legacy-client-id',
    });
    const request = createGitHubOAuthRequest();
    const url = new URL(buildGitHubAuthorizationUrl(configuration, request));

    assert.equal(url.searchParams.get('scope'), null);
});
