---
sidebar_position: 1
title: Reference Overview
description: Technical reference documentation for Optimal Platform
---

# Reference Documentation

This section provides detailed technical reference for all Optimal Platform components.

## Configuration

- [Configuration Reference](./configuration) - All configuration options
- [Environment Variables](./configuration#environment-variables) - Environment-based configuration

## Optimal Operator

The Optimal Operator manages the lifecycle of platform components:

- [Packages](./operator/packages) - Package management
- [Exemptions](./operator/exemptions) - Policy exemptions
- [Custom Resources](./operator/custom-resources) - CRD reference

## Security

Comprehensive security documentation:

- [Security Overview](./security/overview) - Security architecture
- [Kyverno Policies](./security/kyverno-policies) - Policy reference
- [Network Policies](./security/network-policies) - Network security
- [Runtime Security](./security/runtime-security) - Falco configuration

## Observability

Monitoring and logging:

- [Observability Overview](./observability/overview) - Stack overview
- [Prometheus](./observability/prometheus) - Metrics configuration
- [Grafana](./observability/grafana) - Dashboard reference
- [Loki](./observability/loki) - Log aggregation
- [Alerting](./observability/alerting) - Alert configuration

## IAM & SSO

Identity and access management:

- [IAM Overview](./iam/overview) - Authentication architecture
- [Keycloak](./iam/keycloak) - Keycloak configuration
- [SSO Providers](./iam/sso-providers) - Google, Azure AD, Okta
- [RBAC](./iam/rbac) - Role-based access control

## CLI Reference

- [CLI Commands](./cli) - Optimal CLI reference

## API Reference

- [API Documentation](./api) - REST API reference
