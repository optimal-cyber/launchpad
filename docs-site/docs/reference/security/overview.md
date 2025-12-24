---
sidebar_position: 1
title: Security Overview
description: Security architecture and features of Optimal Platform
---

# Security Overview

Optimal Platform implements defense-in-depth security across all layers of the stack.

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Network Security                                       │
│  ├── Network Policies (deny by default)                         │
│  ├── Ingress TLS termination                                    │
│  └── Service-to-service encryption                              │
│                                                                  │
│  Layer 2: Policy Enforcement                                     │
│  ├── Kyverno validating webhooks                                │
│  ├── Kyverno mutating webhooks                                  │
│  └── Pod Security Standards                                      │
│                                                                  │
│  Layer 3: Runtime Security                                       │
│  ├── Falco syscall monitoring                                   │
│  ├── Container escape detection                                  │
│  └── Anomaly detection                                          │
│                                                                  │
│  Layer 4: Application Security                                   │
│  ├── OIDC/JWT authentication                                    │
│  ├── Role-based access control                                  │
│  └── Vulnerability scanning                                      │
│                                                                  │
│  Layer 5: Data Security                                          │
│  ├── Encryption at rest                                         │
│  ├── Encryption in transit                                      │
│  └── Secret management                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Policy Enforcement (Kyverno)

Kyverno provides Kubernetes-native policy management:

### Policy Categories

| Category | Purpose | Example |
|----------|---------|---------|
| Validation | Reject non-compliant resources | Require resource limits |
| Mutation | Modify resources automatically | Add default labels |
| Generation | Create resources automatically | Generate NetworkPolicies |
| Verification | Verify image signatures | Require signed images |

### Default Policies

```yaml
# Pod Security Standards (Restricted)
- require-run-as-non-root
- require-read-only-root-filesystem
- disallow-privilege-escalation
- disallow-host-namespaces
- disallow-host-ports
- restrict-volume-types
- restrict-seccomp-profiles

# Resource Management
- require-resource-limits
- require-resource-requests
- limit-container-resources

# Best Practices
- require-labels
- require-probes
- disallow-latest-tag
- require-image-digest
```

See [Kyverno Policies](./kyverno-policies) for complete reference.

## Runtime Security (Falco)

Falco monitors runtime behavior for threats:

### Detection Categories

| Category | Examples |
|----------|----------|
| Container Escape | ptrace, mount namespace escapes |
| Privilege Escalation | setuid binaries, capability abuse |
| Cryptomining | Suspicious CPU patterns, mining pools |
| Data Exfiltration | Unusual outbound connections |
| Shell Activity | Shells in containers, reverse shells |

### Default Rules

```yaml
- rule: Container Escape via ptrace
  desc: Detect ptrace usage that could indicate escape attempt
  condition: >
    evt.type = ptrace and
    container and
    proc.name != known_debuggers
  output: "Possible container escape (user=%user.name command=%proc.cmdline)"
  priority: CRITICAL

- rule: Crypto Mining Activity
  desc: Detect crypto mining based on process names
  condition: >
    spawned_process and
    container and
    proc.name in (crypto_mining_processes)
  output: "Crypto mining detected (command=%proc.cmdline)"
  priority: CRITICAL
```

See [Runtime Security](./runtime-security) for complete reference.

## Network Security

### Default Deny Policies

All namespaces implement deny-by-default:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: optimal-system
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

### Allowed Traffic

Explicit allow policies for required communication:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-portal-to-api
spec:
  podSelector:
    matchLabels:
      app: optimal-api-gateway
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: optimal-portal
      ports:
        - port: 8000
```

See [Network Policies](./network-policies) for complete reference.

## Authentication & Authorization

### OIDC Authentication

```
User → Portal → Keycloak → Identity Provider
                    ↓
              JWT Token (signed)
                    ↓
API Gateway → Validate JWT → Authorize Request
```

### RBAC Model

```yaml
# Roles
- platform-admin    # Full access
- tenant-admin      # Tenant management
- developer         # Read + limited write
- viewer            # Read-only

# Permissions
- vulnerabilities:read
- vulnerabilities:write
- sbom:read
- sbom:write
- agents:manage
- settings:manage
```

## Secret Management

### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: optimal-credentials
  annotations:
    # Seal with sealed-secrets (optional)
    sealedsecrets.bitnami.com/managed: "true"
type: Opaque
data:
  database-password: <base64>
  jwt-secret: <base64>
```

### External Secret Stores (Optional)

Integration with external secret stores:

- HashiCorp Vault
- AWS Secrets Manager
- GCP Secret Manager
- Azure Key Vault

## Compliance

### Supported Frameworks

| Framework | Coverage |
|-----------|----------|
| NIST 800-53 | Controls mapped |
| FedRAMP | Moderate/High |
| DoD IL4/IL5 | Supported |
| SOC 2 | Type II ready |
| HIPAA | Technical controls |

### Automated Controls

- Continuous vulnerability scanning
- SBOM generation and tracking
- Policy compliance reporting
- Audit logging
- Access reviews

## Next Steps

- [Kyverno Policies](./kyverno-policies) - Policy reference
- [Network Policies](./network-policies) - Network security
- [Runtime Security](./runtime-security) - Falco configuration
