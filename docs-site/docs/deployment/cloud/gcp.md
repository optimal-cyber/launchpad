---
sidebar_position: 2
title: GCP Deployment
description: Deploy Optimal Platform to Google Cloud GKE
---

# GCP Deployment

Deploy Optimal Platform to Google Cloud Platform using GKE (Google Kubernetes Engine).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GCP PROJECT                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                            VPC NETWORK                               │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                      GKE CLUSTER                             │    │   │
│  │  │                                                               │    │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │    │   │
│  │  │  │  Zone A     │  │  Zone B     │  │  Zone C     │          │    │   │
│  │  │  │  Nodes      │  │  Nodes      │  │  Nodes      │          │    │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘          │    │   │
│  │  │                                                               │    │   │
│  │  │  ┌────────────────────────────────────────────────────────┐ │    │   │
│  │  │  │              Optimal Platform                           │ │    │   │
│  │  │  │  Portal │ API │ Services │ Monitoring │ Security       │ │    │   │
│  │  │  └────────────────────────────────────────────────────────┘ │    │   │
│  │  │                                                               │    │   │
│  │  └───────────────────────────────────────────────────────────────┘    │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Cloud SQL  │  │ Memorystore │  │   Cloud     │  │  Cloud DNS  │        │
│  │ PostgreSQL  │  │   Redis     │  │   Storage   │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Google Cloud SDK (`gcloud`)
- Terraform 1.5+
- kubectl
- Helm 3.x

## Deployment Steps

### 1. Configure GCP

```bash
# Authenticate
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

### 2. Configure Terraform

```bash
cd infra/terraform/gcp

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
# GCP Configuration
project_id  = "your-project-id"
region      = "us-central1"
environment = "production"

# Cluster Configuration
cluster_name = "optimal-production"
node_pools = {
  system = {
    machine_type = "e2-standard-4"
    min_count    = 1
    max_count    = 3
    disk_size_gb = 100
  }
  application = {
    machine_type = "e2-standard-8"
    min_count    = 3
    max_count    = 10
    disk_size_gb = 100
  }
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
# Get cluster credentials
gcloud container clusters get-credentials optimal-production \
  --region us-central1 \
  --project YOUR_PROJECT_ID

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

# Create DNS records in Cloud DNS
gcloud dns record-sets create portal.yourdomain.com. \
  --zone=your-zone \
  --type=A \
  --ttl=300 \
  --rrdatas=<LOAD_BALANCER_IP>
```

## GCP Services Used

| Service | Purpose | Configuration |
|---------|---------|---------------|
| GKE | Kubernetes cluster | Regional cluster |
| Cloud SQL | PostgreSQL database | High availability |
| Memorystore | Redis cache | Standard tier |
| Cloud Storage | Backup storage | Regional |
| Cloud DNS | DNS management | Optional |
| Cloud Armor | WAF/DDoS protection | Optional |

## GKE Autopilot

For simplified operations, use GKE Autopilot:

```hcl
# terraform.tfvars
cluster_mode = "autopilot"  # Instead of "standard"
```

Autopilot benefits:
- Fully managed nodes
- Automatic scaling
- Security hardening
- Per-pod billing

## Production Configuration

### High Availability

```yaml
# values-production.yaml
global:
  highAvailability: true

portal:
  replicas: 3
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
```

### Cloud SQL Configuration

```yaml
postgresql:
  enabled: false  # Use Cloud SQL instead

externalDatabase:
  host: /cloudsql/project:region:instance
  port: 5432
  database: optimal
  existingSecret: cloudsql-credentials
```

### Workload Identity

```yaml
serviceAccount:
  annotations:
    iam.gke.io/gcp-service-account: optimal-platform@project.iam.gserviceaccount.com
```

## GCP Assured Workloads

For compliance requirements (FedRAMP, IL4), use the GCP Assured variant:

```bash
cd infra/terraform/gcp-assured
terraform init
terraform apply
```

This creates:
- Assured Workloads environment
- Compliant GKE cluster
- Encryption with CMEK
- VPC Service Controls

## Security

### VPC Service Controls

```hcl
# Enable VPC-SC perimeter
vpc_service_controls = {
  enabled = true
  allowed_services = [
    "container.googleapis.com",
    "sqladmin.googleapis.com",
    "storage.googleapis.com"
  ]
}
```

### Binary Authorization

```yaml
binaryAuthorization:
  enabled: true
  policy: require-attestation
```

## Monitoring

### Cloud Monitoring Integration

GKE automatically exports metrics to Cloud Monitoring:

```bash
# View cluster metrics
gcloud monitoring dashboards list

# Create alert policy
gcloud monitoring policies create --policy-from-file=alert-policy.yaml
```

## Cleanup

```bash
# Delete platform
helm uninstall optimal-platform -n optimal-system

# Delete infrastructure
cd infra/terraform/gcp
terraform destroy
```

## Troubleshooting

### GKE Node Issues

```bash
# Check node pools
gcloud container node-pools list \
  --cluster=optimal-production \
  --region=us-central1

# Resize node pool
gcloud container clusters resize optimal-production \
  --node-pool=application \
  --num-nodes=5 \
  --region=us-central1
```

### Cloud SQL Connection

```bash
# Get connection name
gcloud sql instances describe optimal-db --format='value(connectionName)'

# Test with Cloud SQL Proxy
cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432
```
