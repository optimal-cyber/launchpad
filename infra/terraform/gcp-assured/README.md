# Optimal Platform - GCP Assured Workloads Deployment

FedRAMP High / IL4-IL5 compliant infrastructure deployment for GCP Assured Workloads.

## Architecture Overview

This Terraform configuration deploys a multi-VPC architecture designed for security isolation and FedRAMP High compliance:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GCP Assured Workloads                                │
│                         (FedRAMP High Region)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐        ┌─────────────────────┐                    │
│  │   Application VPC   │◄──────►│   Management VPC    │                    │
│  │   10.0.0.0/16       │        │   10.3.0.0/16       │                    │
│  │                     │        │                     │                    │
│  │  • Optimal Portal   │        │  • Keycloak (SSO)   │                    │
│  │  • GitLab           │        │  • Bastion Hosts    │                    │
│  │  • Harbor Registry  │        │  • Admin Tools      │                    │
│  │  • ArgoCD           │        │                     │                    │
│  │  • PostgreSQL       │        └──────────┬──────────┘                    │
│  │  • Redis            │                   │                               │
│  └──────────┬──────────┘                   │                               │
│             │                              │                               │
│             │         ┌────────────────────┤                               │
│             │         │                    │                               │
│             ▼         ▼                    ▼                               │
│  ┌─────────────────────┐        ┌─────────────────────┐                    │
│  │   Monitoring VPC    │◄──────►│    Security VPC     │                    │
│  │   10.1.0.0/16       │        │   10.2.0.0/16       │                    │
│  │                     │        │                     │                    │
│  │  • Grafana          │        │  • Falco            │                    │
│  │  • Prometheus       │        │  • Kyverno          │                    │
│  │  • Alertmanager     │        │  • Trivy            │                    │
│  │  • OpenSearch/ELK   │        │  • Security Scans   │                    │
│  │                     │        │                     │                    │
│  └─────────────────────┘        └─────────────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## VPC Segmentation

| VPC | Purpose | CIDR Range | Components |
|-----|---------|------------|------------|
| Application | Core platform workloads | 10.0.0.0/16 | Optimal Platform, GitLab, Harbor, ArgoCD, PostgreSQL, Redis |
| Monitoring | Observability stack | 10.1.0.0/16 | Grafana, Prometheus, Alertmanager, OpenSearch/ELK |
| Security | Security tools | 10.2.0.0/16 | Falco, Kyverno, Trivy, vulnerability scanners |
| Management | Identity & admin | 10.3.0.0/16 | Keycloak, Bastion hosts, admin tools |

## Prerequisites

1. **GCP Organization** with Assured Workloads enabled
2. **Billing Account** linked to the organization
3. **Service Account** with Owner or appropriate IAM roles
4. **Terraform** >= 1.5
5. **gcloud CLI** authenticated

## Deployment Steps

### 1. Initialize Terraform Backend

Create the GCS bucket for Terraform state:

```bash
gsutil mb -l us-central1 -p YOUR_PROJECT_ID gs://optimal-terraform-state
gsutil versioning set on gs://optimal-terraform-state
```

### 2. Configure Variables

```bash
cd infra/terraform/gcp-assured
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Set Sensitive Variables

```bash
export TF_VAR_db_password="your-secure-database-password"
```

### 4. Initialize and Apply

```bash
# Development environment
terraform init
terraform plan -var-file=environments/development.tfvars
terraform apply -var-file=environments/development.tfvars

# Production environment
terraform plan -var-file=environments/production.tfvars
terraform apply -var-file=environments/production.tfvars
```

### 5. Connect to Clusters

After deployment, connect to each GKE cluster:

```bash
# Application cluster
gcloud container clusters get-credentials optimal-production-app-cluster \
  --region us-central1 --project YOUR_PROJECT_ID

# Monitoring cluster
gcloud container clusters get-credentials optimal-production-mon-cluster \
  --region us-central1 --project YOUR_PROJECT_ID

# Security cluster
gcloud container clusters get-credentials optimal-production-sec-cluster \
  --region us-central1 --project YOUR_PROJECT_ID

# Management cluster
gcloud container clusters get-credentials optimal-production-mgmt-cluster \
  --region us-central1 --project YOUR_PROJECT_ID
```

## FedRAMP High Compliance Features

- **Assured Workloads**: Enforces data residency and personnel controls
- **CMEK Encryption**: All data encrypted with customer-managed keys
- **Private GKE**: Clusters with private nodes and authorized networks
- **Binary Authorization**: Only signed container images allowed
- **VPC Flow Logs**: Full network traffic logging
- **Audit Logging**: Cloud Audit Logs enabled for all services
- **Shielded VMs**: All GKE nodes run on Shielded VMs
- **Workload Identity**: Secure service account binding

## Security Controls

### Network Security
- Default deny firewall rules
- Explicit allow rules for required traffic
- VPC peering with controlled routes
- IAP for bastion access

### Data Security
- Cloud KMS with HSM protection (production)
- SSL/TLS encryption for all database connections
- Redis auth enabled with encryption in transit
- Secret Manager for credential storage

### Identity Security
- Keycloak for centralized SSO
- Workload Identity for GCP API access
- IAM least-privilege service accounts

## Estimated Monthly Costs

| Environment | Estimated Cost |
|-------------|---------------|
| Development | ~$500-800/mo |
| Staging | ~$1,500-2,000/mo |
| Production | ~$4,000-6,000/mo |

*Costs vary based on actual usage, node scaling, and data transfer.*

## Files

| File | Description |
|------|-------------|
| `main.tf` | Provider config, VPCs, VPC peering, KMS |
| `gke-clusters.tf` | GKE cluster configurations for each VPC |
| `firewall.tf` | Firewall rules for all VPCs |
| `database-iam.tf` | Cloud SQL, Redis, Service Accounts, DNS |
| `variables.tf` | Input variable definitions |
| `outputs.tf` | Output values |
| `environments/*.tfvars` | Environment-specific configurations |

## Troubleshooting

### VPC Peering Limits
GCP has a limit of 25 VPC peerings per network. This configuration uses 12 peerings (full mesh between 4 VPCs).

### Assured Workloads Errors
Ensure your organization has Assured Workloads enabled and you're using an approved region.

### GKE Private Cluster Access
In production, clusters are private. Use IAP or the bastion host for kubectl access.

## Support

For issues, contact the Optimal Platform team or open a GitHub issue.
