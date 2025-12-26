---
sidebar_position: 2
title: Kyverno Policies
description: Complete reference for Kyverno policies in Optimal Platform
---

# Kyverno Policies Reference

Optimal Platform includes a comprehensive set of Kyverno policies for security and compliance.

## Policy Categories

### 1. Pod Security Standards

Enforce Kubernetes Pod Security Standards at the Restricted level.

#### require-run-as-non-root

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-run-as-non-root
  annotations:
    policies.kyverno.io/title: Require Run As Non-Root
    policies.kyverno.io/category: Pod Security Standards (Restricted)
    policies.kyverno.io/severity: high
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: run-as-non-root
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "Containers must run as non-root user"
        pattern:
          spec:
            securityContext:
              runAsNonRoot: true
            containers:
              - securityContext:
                  runAsNonRoot: true
```

#### disallow-privilege-escalation

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-privilege-escalation
  annotations:
    policies.kyverno.io/title: Disallow Privilege Escalation
    policies.kyverno.io/category: Pod Security Standards (Restricted)
    policies.kyverno.io/severity: high
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: privilege-escalation
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "Privilege escalation is not allowed"
        pattern:
          spec:
            containers:
              - securityContext:
                  allowPrivilegeEscalation: false
            initContainers:
              - securityContext:
                  allowPrivilegeEscalation: false
```

#### require-read-only-root-filesystem

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-read-only-root-filesystem
  annotations:
    policies.kyverno.io/title: Require Read-Only Root Filesystem
    policies.kyverno.io/category: Pod Security Standards (Restricted)
    policies.kyverno.io/severity: medium
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: read-only-root-filesystem
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "Root filesystem must be read-only"
        pattern:
          spec:
            containers:
              - securityContext:
                  readOnlyRootFilesystem: true
```

#### disallow-capabilities

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-capabilities
  annotations:
    policies.kyverno.io/title: Disallow Added Capabilities
    policies.kyverno.io/category: Pod Security Standards (Restricted)
    policies.kyverno.io/severity: high
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: drop-all-capabilities
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "Containers must drop all capabilities and only add NET_BIND_SERVICE if needed"
        pattern:
          spec:
            containers:
              - securityContext:
                  capabilities:
                    drop:
                      - ALL
            initContainers:
              - securityContext:
                  capabilities:
                    drop:
                      - ALL
```

### 2. Resource Management

#### require-resource-limits

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-resource-limits
  annotations:
    policies.kyverno.io/title: Require Resource Limits
    policies.kyverno.io/category: Resource Management
    policies.kyverno.io/severity: medium
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: require-limits
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "CPU and memory limits are required"
        pattern:
          spec:
            containers:
              - resources:
                  limits:
                    memory: "?*"
                    cpu: "?*"
```

#### limit-container-resources

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: limit-container-resources
  annotations:
    policies.kyverno.io/title: Limit Container Resources
    policies.kyverno.io/category: Resource Management
    policies.kyverno.io/severity: medium
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: memory-limit
      match:
        any:
          - resources:
              kinds:
                - Pod
      preconditions:
        any:
          - key: "{{ request.operation }}"
            operator: In
            value: ["CREATE", "UPDATE"]
      validate:
        message: "Memory limit must not exceed 8Gi"
        pattern:
          spec:
            containers:
              - resources:
                  limits:
                    memory: "<=8Gi"
    - name: cpu-limit
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "CPU limit must not exceed 4 cores"
        pattern:
          spec:
            containers:
              - resources:
                  limits:
                    cpu: "<=4"
```

### 3. Image Security

#### disallow-latest-tag

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-latest-tag
  annotations:
    policies.kyverno.io/title: Disallow Latest Tag
    policies.kyverno.io/category: Image Security
    policies.kyverno.io/severity: medium
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: disallow-latest
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "Using 'latest' tag is not allowed"
        pattern:
          spec:
            containers:
              - image: "!*:latest"
            initContainers:
              - image: "!*:latest"
```

#### require-image-digest

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-image-digest
  annotations:
    policies.kyverno.io/title: Require Image Digest
    policies.kyverno.io/category: Image Security
    policies.kyverno.io/severity: high
spec:
  validationFailureAction: Audit  # Start with Audit, move to Enforce
  background: true
  rules:
    - name: require-digest
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "Images must use digest (sha256)"
        pattern:
          spec:
            containers:
              - image: "*@sha256:*"
```

#### restrict-image-registries

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: restrict-image-registries
  annotations:
    policies.kyverno.io/title: Restrict Image Registries
    policies.kyverno.io/category: Image Security
    policies.kyverno.io/severity: high
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: allowed-registries
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "Images must come from allowed registries"
        pattern:
          spec:
            containers:
              - image: "ghcr.io/optimal-platform/* | docker.io/bitnami/* | quay.io/* | registry.k8s.io/*"
            initContainers:
              - image: "ghcr.io/optimal-platform/* | docker.io/bitnami/* | quay.io/* | registry.k8s.io/*"
```

### 4. Best Practices

#### require-labels

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-labels
  annotations:
    policies.kyverno.io/title: Require Labels
    policies.kyverno.io/category: Best Practices
    policies.kyverno.io/severity: low
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: require-app-label
      match:
        any:
          - resources:
              kinds:
                - Pod
                - Deployment
                - StatefulSet
                - DaemonSet
      validate:
        message: "Label 'app' is required"
        pattern:
          metadata:
            labels:
              app: "?*"
```

#### require-probes

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-probes
  annotations:
    policies.kyverno.io/title: Require Probes
    policies.kyverno.io/category: Best Practices
    policies.kyverno.io/severity: medium
spec:
  validationFailureAction: Audit
  background: true
  rules:
    - name: require-liveness-probe
      match:
        any:
          - resources:
              kinds:
                - Deployment
                - StatefulSet
      validate:
        message: "Liveness probe is required"
        pattern:
          spec:
            template:
              spec:
                containers:
                  - livenessProbe:
                      periodSeconds: ">0"
    - name: require-readiness-probe
      match:
        any:
          - resources:
              kinds:
                - Deployment
                - StatefulSet
      validate:
        message: "Readiness probe is required"
        pattern:
          spec:
            template:
              spec:
                containers:
                  - readinessProbe:
                      periodSeconds: ">0"
```

### 5. Mutating Policies

#### add-default-security-context

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: add-default-security-context
  annotations:
    policies.kyverno.io/title: Add Default Security Context
    policies.kyverno.io/category: Mutation
spec:
  background: false
  rules:
    - name: add-security-context
      match:
        any:
          - resources:
              kinds:
                - Pod
      mutate:
        patchStrategicMerge:
          spec:
            securityContext:
              runAsNonRoot: true
              seccompProfile:
                type: RuntimeDefault
```

#### add-default-labels

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: add-default-labels
  annotations:
    policies.kyverno.io/title: Add Default Labels
    policies.kyverno.io/category: Mutation
spec:
  background: false
  rules:
    - name: add-managed-by-label
      match:
        any:
          - resources:
              kinds:
                - Pod
                - Deployment
                - StatefulSet
                - Service
      mutate:
        patchStrategicMerge:
          metadata:
            labels:
              app.kubernetes.io/managed-by: optimal-platform
```

## Policy Exemptions

For workloads that need exemptions from specific policies:

```yaml
apiVersion: kyverno.io/v2beta1
kind: PolicyException
metadata:
  name: allow-keycloak-root
  namespace: keycloak
spec:
  exceptions:
    - policyName: require-run-as-non-root
      ruleNames:
        - run-as-non-root
  match:
    any:
      - resources:
          kinds:
            - Pod
          namespaces:
            - keycloak
          names:
            - keycloak-*
```

## Viewing Policy Reports

```bash
# View policy reports
kubectl get policyreport -A

# View cluster policy reports
kubectl get clusterpolicyreport

# Detailed report
kubectl describe policyreport -n optimal-system
```

## Next Steps

- [Security Overview](./overview) - Security architecture overview
