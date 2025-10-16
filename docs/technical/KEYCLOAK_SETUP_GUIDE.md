# 🔐 Keycloak SSO Setup Guide for Optimal Platform

This guide will help you set up Keycloak Single Sign-On (SSO) integration for the Optimal Platform services.

## 📋 Prerequisites

- Keycloak server running (version 18+)
- Admin access to Keycloak
- Optimal Platform services configured

## 🚀 Quick Setup

### 1. Install Keycloak

#### Using Docker (Recommended)
```bash
# Create Keycloak network
docker network create keycloak-network

# Run Keycloak with PostgreSQL
docker run -d \
  --name keycloak \
  --network keycloak-network \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  -e KC_DB=postgres \
  -e KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak \
  -e KC_DB_USERNAME=keycloak \
  -e KC_DB_PASSWORD=keycloak \
  quay.io/keycloak/keycloak:latest \
  start-dev
```

#### Using Docker Compose
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - keycloak-network

  keycloak:
    image: quay.io/keycloak/keycloak:latest
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    networks:
      - keycloak-network
    command: start-dev

volumes:
  postgres_data:

networks:
  keycloak-network:
    driver: bridge
```

### 2. Configure Keycloak Realm

1. **Access Keycloak Admin Console**
   - Go to http://localhost:8080
   - Login with admin/admin

2. **Create Optimal Platform Realm**
   - Click "Create Realm"
   - Name: `optimal-platform`
   - Click "Create"

3. **Configure Realm Settings**
   - Go to Realm Settings → General
   - Set Display name: "Optimal Platform"
   - Set Login theme: "keycloak" (or custom theme)

### 3. Create Clients for Each Service

#### Frontend Client (Optimal Platform Portal)
```bash
# Client ID: optimal-platform-frontend
# Client Protocol: openid-connect
# Access Type: public
# Valid Redirect URIs: 
#   - http://localhost:3000/auth/callback
#   - http://localhost:3000/*
# Web Origins: http://localhost:3000
```

#### Service Clients
Create a client for each service that supports SSO:

1. **GitLab SSO Client**
   - Client ID: `gitlab-sso`
   - Protocol: `openid-connect`
   - Access Type: `confidential`
   - Service Accounts: `Enabled`
   - Valid Redirect URIs: `https://gitlab.com/users/auth/keycloak/callback`

2. **Grafana SSO Client**
   - Client ID: `grafana-sso`
   - Protocol: `openid-connect`
   - Access Type: `confidential`
   - Service Accounts: `Enabled`
   - Valid Redirect URIs: `http://localhost:3001/login/generic_oauth`

3. **Jira SSO Client**
   - Client ID: `jira-sso`
   - Protocol: `openid-connect`
   - Access Type: `confidential`
   - Service Accounts: `Enabled`
   - Valid Redirect URIs: `https://jira.example.com/plugins/servlet/oauth/authorize`

4. **Confluence SSO Client**
   - Client ID: `confluence-sso`
   - Protocol: `openid-connect`
   - Access Type: `confidential`
   - Service Accounts: `Enabled`
   - Valid Redirect URIs: `https://confluence.example.com/plugins/servlet/oauth/authorize`

5. **Vault SSO Client**
   - Client ID: `vault-sso`
   - Protocol: `openid-connect`
   - Access Type: `confidential`
   - Service Accounts: `Enabled`
   - Valid Redirect URIs: `https://vault.example.com/ui/vault/auth/oidc/oidc/callback`

### 4. Create Roles

Create the following roles in the realm:

#### User Roles
- `user` - Basic user access
- `developer` - Development team access
- `maintainer` - Project maintainer access
- `viewer` - Read-only access
- `editor` - Content editing access
- `analyst` - Data analysis access
- `security` - Security team access
- `admin` - Administrative access

#### Service-Specific Roles
- `gitlab-developer` - GitLab development access
- `grafana-viewer` - Grafana dashboard access
- `jira-user` - Jira project access
- `vault-admin` - Vault secrets management
- `kubecost-viewer` - Cost monitoring access

### 5. Create Users and Assign Roles

1. **Create Users**
   - Go to Users → Add User
   - Fill in user details
   - Set temporary password
   - Enable "Email Verified"

2. **Assign Roles**
   - Go to Users → [User] → Role Mappings
   - Assign appropriate realm roles
   - Assign service-specific roles

### 6. Configure Service Integrations

#### Grafana Configuration
```ini
[auth.generic_oauth]
enabled = true
name = Keycloak
allow_sign_up = true
client_id = grafana-sso
client_secret = your-client-secret
scopes = openid profile email
auth_url = http://localhost:8080/realms/optimal-platform/protocol/openid-connect/auth
token_url = http://localhost:8080/realms/optimal-platform/protocol/openid-connect/token
api_url = http://localhost:8080/realms/optimal-platform/protocol/openid-connect/userinfo
```

#### GitLab Configuration
```yaml
# In GitLab configuration
omniauth:
  enabled: true
  allow_single_sign_on: ['keycloak']
  block_auto_created_users: false
  auto_link_ldap_user: false
  auto_link_saml_user: false
  auto_link_provider: 'keycloak'

keycloak:
  name: 'keycloak'
  label: 'Keycloak'
  args:
    name: 'keycloak'
    scope: 'openid'
    response_type: 'code'
    issuer: 'http://localhost:8080/realms/optimal-platform'
    discovery: true
    client_options:
      identifier: 'gitlab-sso'
      secret: 'your-client-secret'
      redirect_uri: 'https://gitlab.com/users/auth/keycloak/callback'
```

#### Jira Configuration
```xml
<!-- In Jira configuration -->
<authentication>
  <provider>
    <name>keycloak</name>
    <class>com.atlassian.plugins.authentication.oidc.OidcAuthenticationProvider</class>
    <config>
      <clientId>jira-sso</clientId>
      <clientSecret>your-client-secret</clientSecret>
      <issuer>http://localhost:8080/realms/optimal-platform</issuer>
      <redirectUri>https://jira.example.com/plugins/servlet/oauth/authorize</redirectUri>
    </config>
  </provider>
</authentication>
```

### 7. Update Optimal Platform Configuration

#### Environment Variables
```bash
# Add to .env file
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=optimal-platform
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=optimal-platform-frontend
NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI=http://localhost:3000/auth/callback
```

#### Update Service URLs
Update the service configurations in `apps/portal/lib/keycloak.ts` with your actual service URLs:

```typescript
export const serviceSSOConfigs: ServiceSSOConfig[] = [
  {
    serviceId: 'gitlab',
    serviceUrl: 'https://your-gitlab.com',
    keycloakClientId: 'gitlab-sso',
    requiredRoles: ['developer', 'maintainer'],
  },
  {
    serviceId: 'grafana',
    serviceUrl: 'http://localhost:3001',
    keycloakClientId: 'grafana-sso',
    requiredRoles: ['viewer', 'editor'],
  },
  // ... other services
];
```

## 🔧 Testing the Integration

### 1. Test Frontend Authentication
```bash
# Start the Optimal Platform
npm run dev

# Navigate to http://localhost:3000
# Click on any SSO-enabled service
# Should redirect to Keycloak login
```

### 2. Test Service Access
1. Login through Keycloak
2. Click on services (GitLab, Grafana, etc.)
3. Should automatically authenticate and access the service

### 3. Test Role-Based Access
1. Create users with different roles
2. Test that users only see services they have access to
3. Verify that role restrictions are enforced

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Errors**
   - Add your frontend URL to Keycloak Web Origins
   - Check service CORS configuration

2. **Invalid Redirect URI**
   - Verify redirect URIs in Keycloak client configuration
   - Check for trailing slashes and protocol mismatches

3. **Token Validation Errors**
   - Verify client secrets are correct
   - Check token expiration settings
   - Ensure proper scopes are requested

4. **Service Integration Issues**
   - Verify service-specific OIDC configuration
   - Check service logs for authentication errors
   - Ensure service URLs are accessible

### Debug Mode
Enable debug logging in Keycloak:
```bash
# Add to Keycloak startup
-Dkeycloak.log.level=DEBUG
```

## 📚 Additional Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OIDC Configuration Guide](https://openid.net/connect/)
- [Grafana OAuth Configuration](https://grafana.com/docs/grafana/latest/auth/generic-oauth/)
- [GitLab OAuth Configuration](https://docs.gitlab.com/ee/integration/omniauth.html)

## 🔒 Security Best Practices

1. **Use HTTPS in Production**
   - Never use HTTP for production Keycloak
   - Configure proper SSL certificates

2. **Secure Client Secrets**
   - Use strong, unique client secrets
   - Rotate secrets regularly
   - Store secrets securely

3. **Configure Token Expiration**
   - Set appropriate access token lifetimes
   - Enable refresh token rotation
   - Configure session timeouts

4. **Enable Audit Logging**
   - Monitor authentication events
   - Track failed login attempts
   - Set up alerts for suspicious activity

5. **Regular Security Updates**
   - Keep Keycloak updated
   - Monitor security advisories
   - Apply security patches promptly

---

**Status**: ✅ Ready for production deployment with proper Keycloak configuration
