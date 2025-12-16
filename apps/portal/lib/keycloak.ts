/**
 * Keycloak SSO Integration for Optimal Platform
 * Provides enterprise-grade authentication with OIDC
 */

import Keycloak from 'keycloak-js';

// Keycloak configuration
const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'optimal',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'optimal-portal',
};

// Initialize Keycloak instance
let keycloakInstance: Keycloak | null = null;

/**
 * Get or create Keycloak instance
 */
export const getKeycloak = (): Keycloak => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig);
  }
  return keycloakInstance;
};

/**
 * Initialize Keycloak authentication
 */
export const initKeycloak = async (onAuthenticatedCallback: () => void) => {
  const keycloak = getKeycloak();

  try {
    const authenticated = await keycloak.init({
      onLoad: 'login-required',
      checkLoginIframe: true,
      pkceMethod: 'S256',
      enableLogging: true,
    });

    if (authenticated) {
      console.log('✅ User authenticated via Keycloak');
      
      // Store token in localStorage for API calls
      if (keycloak.token) {
        localStorage.setItem('auth_token', keycloak.token);
        localStorage.setItem('refresh_token', keycloak.refreshToken || '');
      }

      // Store user info
      const userInfo = await keycloak.loadUserInfo();
      localStorage.setItem('user_info', JSON.stringify(userInfo));

      onAuthenticatedCallback();

      // Setup token refresh
      setupTokenRefresh(keycloak);
    } else {
      console.warn('⚠️  User not authenticated');
      keycloak.login();
    }
  } catch (error) {
    console.error('❌ Keycloak initialization failed:', error);
    throw error;
  }

  return keycloak;
};

/**
 * Setup automatic token refresh
 */
const setupTokenRefresh = (keycloak: Keycloak) => {
  // Refresh token every 5 minutes
  setInterval(async () => {
    try {
      const refreshed = await keycloak.updateToken(70); // Refresh if token expires in 70 seconds
      if (refreshed) {
        console.log('🔄 Token refreshed');
        if (keycloak.token) {
          localStorage.setItem('auth_token', keycloak.token);
        }
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      keycloak.login();
    }
  }, 5 * 60 * 1000);
};

/**
 * Logout user
 */
export const doLogout = () => {
  const keycloak = getKeycloak();
  
  // Clear local storage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');

  // Keycloak logout
  keycloak.logout({
    redirectUri: window.location.origin,
  });
};

/**
 * Get current user info
 */
export const getUserInfo = async () => {
  const keycloak = getKeycloak();
  
  if (!keycloak.authenticated) {
    return null;
  }

  return await keycloak.loadUserInfo();
};

/**
 * Check if user has specific role
 */
export const hasRole = (role: string): boolean => {
  const keycloak = getKeycloak();
  return keycloak.hasRealmRole(role) || keycloak.hasResourceRole(role);
};

/**
 * Get access token for API calls
 */
export const getToken = (): string | undefined => {
  const keycloak = getKeycloak();
  return keycloak.token;
};

/**
 * Update token if needed
 */
export const updateToken = async (): Promise<boolean> => {
  const keycloak = getKeycloak();
  return await keycloak.updateToken(5);
};

// Export user roles
export const UserRoles = {
  ADMIN: 'admin',
  SECURITY_ANALYST: 'security-analyst',
  DEVELOPER: 'developer',
  AUDITOR: 'auditor',
  VIEWER: 'viewer',
};
