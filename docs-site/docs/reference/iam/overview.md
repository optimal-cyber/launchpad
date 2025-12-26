---
sidebar_position: 1
title: IAM Overview
description: Identity and Access Management with Keycloak
---

# IAM Overview

Optimal Platform uses Keycloak for identity and access management, providing enterprise SSO, multi-tenancy, and RBAC.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌──────────┐         ┌──────────┐         ┌──────────────────┐          │
│    │  User    │────────▶│  Portal  │────────▶│    Keycloak      │          │
│    │          │         │ (Next.js)│         │   (OIDC/SAML)    │          │
│    └──────────┘         └────┬─────┘         └────────┬─────────┘          │
│                              │                        │                     │
│                              │   JWT Token            │  Identity Provider  │
│                              │   ◀─────────────────────                     │
│                              │                        │  - Google           │
│                              ▼                        │  - Azure AD         │
│                        ┌──────────┐                   │  - Okta             │
│                        │   API    │                   │  - SAML             │
│                        │ Gateway  │                   └─────────────────────┘
│                        └────┬─────┘                                         │
│                             │                                               │
│              ┌──────────────┼──────────────┐                               │
│              │              │              │                               │
│              ▼              ▼              ▼                               │
│        ┌──────────┐  ┌──────────┐  ┌──────────┐                           │
│        │  SBOM    │  │   Vuln   │  │  Tenant  │                           │
│        │ Service  │  │ Service  │  │ Service  │                           │
│        └──────────┘  └──────────┘  └──────────┘                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Keycloak Configuration

### Realm Setup

The platform uses the `optimal` realm with the following configuration:

```yaml
keycloak:
  realm: optimal
  clients:
    - name: optimal-portal
      type: public
      redirectUris:
        - "https://*.portal.gooptimal.io/*"
        - "http://localhost:3000/*"
    - name: optimal-api
      type: confidential
      serviceAccount: true
```

### Identity Providers

#### Google OAuth

```yaml
identityProviders:
  google:
    enabled: true
    clientId: ${GOOGLE_CLIENT_ID}
    clientSecret: ${GOOGLE_CLIENT_SECRET}
    defaultScopes: "openid email profile"
```

#### Azure AD / Entra

```yaml
identityProviders:
  azure:
    enabled: true
    tenantId: ${AZURE_TENANT_ID}
    clientId: ${AZURE_CLIENT_ID}
    clientSecret: ${AZURE_CLIENT_SECRET}
```

#### Okta

```yaml
identityProviders:
  okta:
    enabled: true
    domain: ${OKTA_DOMAIN}
    clientId: ${OKTA_CLIENT_ID}
    clientSecret: ${OKTA_CLIENT_SECRET}
```

## Roles and Permissions

### Platform Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `platform-admin` | Full platform access | All operations |
| `tenant-admin` | Tenant management | Manage tenant users, settings |
| `developer` | Standard user | Read + limited write |
| `viewer` | Read-only access | View dashboards, reports |

### Permission Matrix

| Permission | Platform Admin | Tenant Admin | Developer | Viewer |
|------------|---------------|--------------|-----------|--------|
| View dashboards | Yes | Yes | Yes | Yes |
| View vulnerabilities | Yes | Yes | Yes | Yes |
| Create scans | Yes | Yes | Yes | No |
| Manage agents | Yes | Yes | No | No |
| Manage users | Yes | Yes | No | No |
| System settings | Yes | No | No | No |

## Multi-Tenancy

### Tenant Isolation

Each tenant gets:
- Dedicated Keycloak realm: `optimal-{tenant-id}`
- Isolated database: `optimal_tenant_{tenant-id}`
- Subdomain: `{tenant}.portal.gooptimal.io`

### Auto-Provisioning

```yaml
multiTenancy:
  keycloak:
    autoProvisionRealm: true
    realmTemplate: "optimal-{TenantID}"
    defaultClients:
      - optimal-portal
      - optimal-api
```

## JWT Token Structure

Tokens issued by Keycloak include:

```json
{
  "sub": "user-uuid",
  "iss": "https://keycloak.gooptimal.io/realms/optimal",
  "aud": "optimal-portal",
  "exp": 1703520000,
  "realm_access": {
    "roles": ["developer"]
  },
  "tenant_id": "acme-corp",
  "email": "user@example.com",
  "name": "John Doe"
}
```

## API Authentication

### Service-to-Service

Internal services use service account tokens:

```python
# API Gateway validates JWT
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def verify_token(token: str = Depends(security)):
    # Verify with Keycloak public key
    payload = jwt.decode(token, public_key, algorithms=["RS256"])
    return payload
```

### API Keys

For tenant agents and external integrations:

```bash
# Generate API key
curl -X POST https://api.gooptimal.io/v1/api-keys \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"name": "production-agent", "scopes": ["agent:write", "scan:create"]}'
```

## Accessing Keycloak Admin

```bash
# Port forward for local access
kubectl port-forward svc/keycloak 8080:80 -n keycloak

# Access admin console at http://localhost:8080/admin
# Credentials from secret: keycloak-admin-credentials
```

## Session Management

### Token Lifetimes

| Token Type | Default Lifetime |
|------------|-----------------|
| Access Token | 5 minutes |
| Refresh Token | 30 minutes |
| SSO Session | 8 hours |

### Session Configuration

```yaml
keycloak:
  sessions:
    accessTokenLifespan: 300  # 5 minutes
    refreshTokenLifespan: 1800  # 30 minutes
    ssoSessionIdleTimeout: 28800  # 8 hours
```
