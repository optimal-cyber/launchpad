/**
 * Keycloak SSO Helper Library
 * Handles OAuth 2.0/OIDC flows with PKCE for Google, Microsoft, and custom IdP
 */

// SSO Provider Configuration
export const SSO_PROVIDERS = {
  enterprise: {
    alias: 'keycloak',
    displayName: 'Enterprise SSO',
    description: 'Sign in with your organization account',
    icon: 'Shield',
    color: 'cyan',
    enabled: true,
  },
  google: {
    alias: 'google',
    displayName: 'Google',
    description: 'Sign in with Google',
    icon: 'Chrome',
    color: 'red',
    enabled: true,
  },
  microsoft: {
    alias: 'microsoft',
    displayName: 'Microsoft',
    description: 'Sign in with Microsoft Azure AD',
    icon: 'Building2',
    color: 'blue',
    enabled: true,
  },
  github: {
    alias: 'github',
    displayName: 'GitHub',
    description: 'Sign in with GitHub',
    icon: 'Github',
    color: 'gray',
    enabled: false, // Can be enabled when configured in Keycloak
  },
} as const;

export type SSOProvider = keyof typeof SSO_PROVIDERS;

// Environment Configuration
const getKeycloakConfig = () => ({
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'optimal',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'optimal-portal',
});

/**
 * Generate a cryptographically secure random string for PKCE
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate PKCE code verifier (43-128 characters)
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generate PKCE code challenge from verifier using S256
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Base64 URL encode (RFC 4648)
 */
function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(buffer)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generate state parameter for CSRF protection
 */
function generateState(): string {
  return generateRandomString(16);
}

/**
 * Store PKCE and state parameters in session storage
 */
function storePKCEParams(codeVerifier: string, state: string, provider: SSOProvider): void {
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('sso_provider', provider);
  sessionStorage.setItem('sso_initiated_at', Date.now().toString());
}

/**
 * Retrieve and clear PKCE parameters from session storage
 */
export function retrievePKCEParams(): {
  codeVerifier: string | null;
  state: string | null;
  provider: SSOProvider | null;
} {
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
  const state = sessionStorage.getItem('oauth_state');
  const provider = sessionStorage.getItem('sso_provider') as SSOProvider | null;

  // Clear stored params after retrieval
  sessionStorage.removeItem('pkce_code_verifier');
  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('sso_provider');
  sessionStorage.removeItem('sso_initiated_at');

  return { codeVerifier, state, provider };
}

/**
 * Check if SSO flow has timed out (15 minutes)
 */
export function isSSORFlowExpired(): boolean {
  const initiatedAt = sessionStorage.getItem('sso_initiated_at');
  if (!initiatedAt) return true;

  const elapsed = Date.now() - parseInt(initiatedAt, 10);
  const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

  return elapsed > TIMEOUT_MS;
}

/**
 * Build Keycloak authorization URL
 */
function buildAuthorizationUrl(params: {
  codeChallenge: string;
  state: string;
  idpHint?: string;
  loginHint?: string;
}): string {
  const config = getKeycloakConfig();
  const redirectUri = `${window.location.origin}/auth/callback`;

  const searchParams = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    code_challenge: params.codeChallenge,
    code_challenge_method: 'S256',
    state: params.state,
  });

  // Add IdP hint if specified (for direct SSO provider redirect)
  if (params.idpHint) {
    searchParams.set('kc_idp_hint', params.idpHint);
  }

  // Add login hint if specified (pre-fill email)
  if (params.loginHint) {
    searchParams.set('login_hint', params.loginHint);
  }

  return `${config.url}/realms/${config.realm}/protocol/openid-connect/auth?${searchParams.toString()}`;
}

/**
 * Initiate SSO login flow with a specific identity provider
 *
 * @param provider - The SSO provider to use (enterprise, google, microsoft, etc.)
 * @param options - Additional options like login hint
 */
export async function initiateSSO(
  provider: SSOProvider,
  options?: { loginHint?: string }
): Promise<void> {
  const providerConfig = SSO_PROVIDERS[provider];

  if (!providerConfig) {
    throw new Error(`Unknown SSO provider: ${provider}`);
  }

  if (!providerConfig.enabled) {
    throw new Error(`SSO provider ${provider} is not enabled`);
  }

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Store for callback validation
  storePKCEParams(codeVerifier, state, provider);

  // Build authorization URL
  const authUrl = buildAuthorizationUrl({
    codeChallenge,
    state,
    idpHint: provider === 'enterprise' ? undefined : providerConfig.alias,
    loginHint: options?.loginHint,
  });

  // Redirect to Keycloak
  window.location.href = authUrl;
}

/**
 * Initiate standard Keycloak login (shows Keycloak login page)
 */
export async function initiateKeycloakLogin(loginHint?: string): Promise<void> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  storePKCEParams(codeVerifier, state, 'enterprise');

  const authUrl = buildAuthorizationUrl({
    codeChallenge,
    state,
    loginHint,
  });

  window.location.href = authUrl;
}

/**
 * Exchange authorization code for tokens
 * This should be called from the /auth/callback page
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  userInfo: {
    sub: string;
    email?: string;
    name?: string;
    preferredUsername?: string;
    roles?: string[];
  };
}> {
  const response = await fetch('/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Token exchange failed' }));
    throw new Error(error.error || 'Token exchange failed');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    userInfo: data.user_info,
  };
}

/**
 * Build Keycloak logout URL
 */
export function buildLogoutUrl(idTokenHint?: string): string {
  const config = getKeycloakConfig();
  const postLogoutRedirectUri = `${window.location.origin}/login`;

  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutRedirectUri,
    client_id: config.clientId,
  });

  if (idTokenHint) {
    params.set('id_token_hint', idTokenHint);
  }

  return `${config.url}/realms/${config.realm}/protocol/openid-connect/logout?${params.toString()}`;
}

/**
 * Logout from Keycloak and clear local session
 */
export function logout(): void {
  // Get ID token for logout hint
  const idToken = localStorage.getItem('id_token');

  // Clear local storage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('id_token');
  localStorage.removeItem('user_info');
  localStorage.removeItem('token_expires_at');

  // Redirect to Keycloak logout
  window.location.href = buildLogoutUrl(idToken || undefined);
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('auth_token');
  const expiresAt = localStorage.getItem('token_expires_at');

  if (!token || !expiresAt) return false;

  // Check if token has expired
  const expiresAtMs = parseInt(expiresAt, 10);
  return Date.now() < expiresAtMs;
}

/**
 * Get current user info from local storage
 */
export function getCurrentUser(): {
  sub: string;
  email?: string;
  name?: string;
  preferredUsername?: string;
  roles?: string[];
} | null {
  const userInfo = localStorage.getItem('user_info');
  if (!userInfo) return null;

  try {
    return JSON.parse(userInfo);
  } catch {
    return null;
  }
}

/**
 * Get current access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Store authentication data in local storage
 */
export function storeAuthData(data: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userInfo: object;
  idToken?: string;
}): void {
  localStorage.setItem('auth_token', data.accessToken);
  localStorage.setItem('refresh_token', data.refreshToken);
  localStorage.setItem('user_info', JSON.stringify(data.userInfo));
  localStorage.setItem('token_expires_at', String(Date.now() + data.expiresIn * 1000));

  if (data.idToken) {
    localStorage.setItem('id_token', data.idToken);
  }
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  try {
    const config = getKeycloakConfig();
    const response = await fetch(
      `${config.url}/realms/${config.realm}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: config.clientId,
          refresh_token: refreshToken,
        }).toString(),
      }
    );

    if (!response.ok) return false;

    const data = await response.json();

    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('token_expires_at', String(Date.now() + data.expires_in * 1000));

    return true;
  } catch {
    return false;
  }
}
