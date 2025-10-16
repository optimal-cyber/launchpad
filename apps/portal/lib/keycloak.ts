/**
 * Keycloak SSO Integration for Optimal Platform
 * Handles authentication and service access via Keycloak
 */

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  redirectUri: string;
}

export interface ServiceSSOConfig {
  serviceId: string;
  serviceUrl: string;
  keycloakClientId: string;
  requiredRoles?: string[];
}

export class KeycloakSSO {
  private config: KeycloakConfig;
  private serviceConfigs: Map<string, ServiceSSOConfig> = new Map();

  constructor(config: KeycloakConfig) {
    this.config = config;
  }

  /**
   * Register a service for SSO access
   */
  registerService(config: ServiceSSOConfig): void {
    this.serviceConfigs.set(config.serviceId, config);
  }

  /**
   * Initiate SSO flow for a service
   */
  async initiateSSO(serviceId: string): Promise<string> {
    const serviceConfig = this.serviceConfigs.get(serviceId);
    if (!serviceConfig) {
      throw new Error(`Service ${serviceId} not configured for SSO`);
    }

    // Check if user is already authenticated
    const token = this.getStoredToken();
    if (token && this.isTokenValid(token)) {
      return this.buildServiceUrl(serviceConfig, token);
    }

    // Redirect to Keycloak for authentication
    const authUrl = this.buildAuthUrl(serviceConfig);
    return authUrl;
  }

  /**
   * Handle Keycloak callback and extract authorization code
   */
  async handleCallback(code: string, state: string): Promise<string> {
    try {
      // Exchange authorization code for access token
      const tokenResponse = await fetch(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          code: code,
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json();
      this.storeToken(tokenData.access_token, tokenData.expires_in);
      
      return tokenData.access_token;
    } catch (error) {
      console.error('Keycloak callback error:', error);
      throw error;
    }
  }

  /**
   * Build Keycloak authorization URL
   */
  private buildAuthUrl(serviceConfig: ServiceSSOConfig): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: serviceConfig.keycloakClientId,
      redirect_uri: this.config.redirectUri,
      scope: 'openid profile email',
      state: serviceConfig.serviceId,
    });

    if (serviceConfig.requiredRoles) {
      params.append('roles', serviceConfig.requiredRoles.join(' '));
    }

    return `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/auth?${params.toString()}`;
  }

  /**
   * Build service URL with SSO token
   */
  private buildServiceUrl(serviceConfig: ServiceSSOConfig, token: string): string {
    const url = new URL(serviceConfig.serviceUrl);
    url.searchParams.set('sso_token', token);
    url.searchParams.set('service', serviceConfig.serviceId);
    return url.toString();
  }

  /**
   * Get stored access token
   */
  private getStoredToken(): string | null {
    return localStorage.getItem('keycloak_access_token');
  }

  /**
   * Store access token with expiration
   */
  private storeToken(token: string, expiresIn: number): void {
    const expirationTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem('keycloak_access_token', token);
    localStorage.setItem('keycloak_token_expires', expirationTime.toString());
  }

  /**
   * Check if stored token is still valid
   */
  private isTokenValid(token: string): boolean {
    const expirationTime = localStorage.getItem('keycloak_token_expires');
    if (!expirationTime) return false;
    
    return Date.now() < parseInt(expirationTime);
  }

  /**
   * Logout and clear stored tokens
   */
  logout(): void {
    localStorage.removeItem('keycloak_access_token');
    localStorage.removeItem('keycloak_token_expires');
  }

  /**
   * Get user information from token
   */
  async getUserInfo(): Promise<any> {
    const token = this.getStoredToken();
    if (!token) return null;

    try {
      const response = await fetch(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/userinfo`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }
}

// Default Keycloak configuration
export const defaultKeycloakConfig: KeycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://keycloak.example.com',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'optimal-platform',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'optimal-platform-frontend',
  redirectUri: process.env.NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI || 'http://localhost:3000/auth/callback',
};

// Service configurations
export const serviceSSOConfigs: ServiceSSOConfig[] = [
  {
    serviceId: 'gitlab',
    serviceUrl: 'https://gitlab.com',
    keycloakClientId: 'gitlab-sso',
    requiredRoles: ['developer', 'maintainer'],
  },
  {
    serviceId: 'grafana',
    serviceUrl: 'http://localhost:3001',
    keycloakClientId: 'grafana-sso',
    requiredRoles: ['viewer', 'editor'],
  },
  {
    serviceId: 'jira',
    serviceUrl: 'https://jira.example.com',
    keycloakClientId: 'jira-sso',
    requiredRoles: ['user', 'developer'],
  },
  {
    serviceId: 'confluence',
    serviceUrl: 'https://confluence.example.com',
    keycloakClientId: 'confluence-sso',
    requiredRoles: ['user', 'editor'],
  },
  {
    serviceId: 'vault',
    serviceUrl: 'https://vault.example.com',
    keycloakClientId: 'vault-sso',
    requiredRoles: ['admin', 'security'],
  },
  {
    serviceId: 'kubecost',
    serviceUrl: 'https://kubecost.example.com',
    keycloakClientId: 'kubecost-sso',
    requiredRoles: ['viewer', 'admin'],
  },
  {
    serviceId: 'argo',
    serviceUrl: 'https://argo.example.com',
    keycloakClientId: 'argo-sso',
    requiredRoles: ['developer', 'admin'],
  },
  {
    serviceId: 'kion',
    serviceUrl: 'https://kion.example.com',
    keycloakClientId: 'kion-sso',
    requiredRoles: ['security', 'admin'],
  },
  {
    serviceId: 'drawio',
    serviceUrl: 'https://draw.io',
    keycloakClientId: 'drawio-sso',
    requiredRoles: ['user'],
  },
  {
    serviceId: 'superset',
    serviceUrl: 'https://superset.example.com',
    keycloakClientId: 'superset-sso',
    requiredRoles: ['viewer', 'analyst'],
  },
];

// Initialize Keycloak SSO instance
export const keycloakSSO = new KeycloakSSO(defaultKeycloakConfig);

// Register all services
serviceSSOConfigs.forEach(config => {
  keycloakSSO.registerService(config);
});
