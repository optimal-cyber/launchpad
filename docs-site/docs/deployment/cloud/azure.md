---
sidebar_position: 3
title: Azure Deployment
description: Deploy Optimal Platform to Azure AKS
---

# Azure Deployment

Deploy Optimal Platform to Microsoft Azure using AKS (Azure Kubernetes Service).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AZURE SUBSCRIPTION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        RESOURCE GROUP                                │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                      VNET (10.0.0.0/8)                       │    │   │
│  │  │                                                               │    │   │
│  │  │  ┌───────────────────────────────────────────────────────┐  │    │   │
│  │  │  │                    AKS CLUSTER                         │  │    │   │
│  │  │  │                                                         │  │    │   │
│  │  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │    │   │
│  │  │  │  │  System     │  │  User       │  │  User       │    │  │    │   │
│  │  │  │  │  Node Pool  │  │  Node Pool  │  │  Node Pool  │    │  │    │   │
│  │  │  │  │  (Zone 1)   │  │  (Zone 2)   │  │  (Zone 3)   │    │  │    │   │
│  │  │  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │    │   │
│  │  │  │                                                         │  │    │   │
│  │  │  └─────────────────────────────────────────────────────────┘  │    │   │
│  │  │                                                               │    │   │
│  │  └───────────────────────────────────────────────────────────────┘    │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │  Azure DB   │  │ Azure Cache │  │   Blob      │                  │   │
│  │  │ PostgreSQL  │  │  for Redis  │  │  Storage    │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │  Azure DNS  │  │ Key Vault   │  │  Azure      │                         │
│  │             │  │             │  │  Monitor    │                         │
│  └─────────────┘  └─────────────┘  └─────────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Azure CLI (`az`)
- Terraform 1.5+
- kubectl
- Helm 3.x

## Deployment Steps

### 1. Configure Azure

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your Subscription Name"

# Register required providers
az provider register --namespace Microsoft.ContainerService
az provider register --namespace Microsoft.KeyVault
```

### 2. Configure Terraform

```bash
cd infra/terraform/azure

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
# Azure Configuration
subscription_id = "your-subscription-id"
location        = "eastus"
environment     = "production"

# Resource Group
resource_group_name = "optimal-production-rg"

# Cluster Configuration
cluster_name = "optimal-production"
kubernetes_version = "1.28"

# Node Pools
system_node_pool = {
  name       = "system"
  vm_size    = "Standard_D4s_v3"
  node_count = 3
  zones      = ["1", "2", "3"]
}

user_node_pool = {
  name           = "application"
  vm_size        = "Standard_D8s_v3"
  min_count      = 3
  max_count      = 10
  zones          = ["1", "2", "3"]
}

# Domain (optional)
domain_name = "yourdomain.com"
```

### 3. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review plan
terraform plan

# Apply (takes ~15-20 minutes)
terraform apply
```

### 4. Configure kubectl

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group optimal-production-rg \
  --name optimal-production

# Verify connection
kubectl get nodes
```

### 5. Deploy Platform

```bash
cd ../../..

# Deploy platform
helm upgrade --install optimal-platform k8s/helm-charts/optimal-platform \
  --namespace optimal-system \
  --create-namespace \
  -f k8s/helm-charts/optimal-platform/values-production.yaml \
  --set global.domain=yourdomain.com
```

### 6. Configure DNS

```bash
# Get Load Balancer IP
kubectl get svc -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Create DNS zone (if needed)
az network dns zone create \
  --resource-group optimal-production-rg \
  --name yourdomain.com

# Create A record
az network dns record-set a add-record \
  --resource-group optimal-production-rg \
  --zone-name yourdomain.com \
  --record-set-name portal \
  --ipv4-address <LOAD_BALANCER_IP>
```

## Azure Services Used

| Service | Purpose | Configuration |
|---------|---------|---------------|
| AKS | Kubernetes cluster | Multi-zone |
| Azure Database for PostgreSQL | Database | Flexible Server |
| Azure Cache for Redis | Cache | Premium tier |
| Blob Storage | Backup storage | LRS/GRS |
| Azure DNS | DNS management | Optional |
| Key Vault | Secrets management | RBAC enabled |
| Azure Monitor | Monitoring | Container Insights |

## Production Configuration

### High Availability

```yaml
# values-production.yaml
global:
  highAvailability: true

portal:
  replicas: 3
  podDisruptionBudget:
    minAvailable: 2

# Zone redundancy
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
```

### Azure Database for PostgreSQL

```yaml
postgresql:
  enabled: false  # Use Azure PostgreSQL instead

externalDatabase:
  host: optimal-db.postgres.database.azure.com
  port: 5432
  database: optimal
  sslMode: require
  existingSecret: azure-db-credentials
```

### Key Vault Integration

```yaml
# Use Azure Key Vault for secrets
csi:
  enabled: true
  secrets-store:
    azure:
      enabled: true
      keyvaultName: optimal-keyvault
      tenantId: your-tenant-id
```

### Azure AD Integration

```yaml
# Azure AD for authentication
keycloak:
  identityProviders:
    azure:
      enabled: true
      tenantId: your-tenant-id
      clientId: your-client-id
```

## Security

### Azure Policy

Enable Azure Policy for AKS:

```bash
az aks enable-addons \
  --addons azure-policy \
  --name optimal-production \
  --resource-group optimal-production-rg
```

### Private Cluster

```hcl
# terraform.tfvars
private_cluster_enabled = true
private_dns_zone_id     = "/subscriptions/.../privateDnsZones/privatelink.eastus.azmk8s.io"
```

### Network Security

```hcl
# Network Security Groups
network_security_rules = {
  allow-https = {
    priority  = 100
    direction = "Inbound"
    access    = "Allow"
    protocol  = "Tcp"
    port      = 443
  }
}
```

## Monitoring

### Azure Monitor / Container Insights

Container Insights is automatically enabled:

```bash
# View logs
az monitor log-analytics query \
  --workspace optimal-workspace \
  --analytics-query "ContainerLog | take 100"
```

### Application Insights

```yaml
# Enable Application Insights
applicationInsights:
  enabled: true
  connectionString: ${APP_INSIGHTS_CONNECTION_STRING}
```

## Government Cloud

For Azure Government:

```hcl
# terraform.tfvars
environment = "usgovernment"
location    = "usgovvirginia"
```

## Cleanup

```bash
# Delete platform
helm uninstall optimal-platform -n optimal-system

# Delete infrastructure
cd infra/terraform/azure
terraform destroy
```

## Troubleshooting

### AKS Node Issues

```bash
# Check node pool status
az aks nodepool show \
  --resource-group optimal-production-rg \
  --cluster-name optimal-production \
  --name application

# Scale node pool
az aks nodepool scale \
  --resource-group optimal-production-rg \
  --cluster-name optimal-production \
  --name application \
  --node-count 5
```

### Azure PostgreSQL Connection

```bash
# Test connectivity
az postgres flexible-server connect \
  --name optimal-db \
  --admin-user optimal_admin \
  --admin-password <password>
```
