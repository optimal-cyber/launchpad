---
sidebar_position: 1
title: AWS Deployment
description: Deploy Optimal Platform to AWS EKS
---

# AWS Deployment

Deploy Optimal Platform to Amazon Web Services using EKS (Elastic Kubernetes Service).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS REGION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                            VPC (10.0.0.0/16)                         │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │  Public     │  │  Public     │  │  Public     │                  │   │
│  │  │  Subnet AZ1 │  │  Subnet AZ2 │  │  Subnet AZ3 │                  │   │
│  │  │  (NAT, ALB) │  │  (NAT, ALB) │  │  (NAT, ALB) │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │  Private    │  │  Private    │  │  Private    │                  │   │
│  │  │  Subnet AZ1 │  │  Subnet AZ2 │  │  Subnet AZ3 │                  │   │
│  │  │  (EKS Nodes)│  │  (EKS Nodes)│  │  (EKS Nodes)│                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  │                                                                       │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │                      EKS CLUSTER                                │ │   │
│  │  │  ┌─────────────────┐  ┌─────────────────┐                      │ │   │
│  │  │  │ System Node     │  │ App Node        │                      │ │   │
│  │  │  │ Group           │  │ Group           │                      │ │   │
│  │  │  │ (m5.large x3)   │  │ (m5.xlarge x3+) │                      │ │   │
│  │  │  └─────────────────┘  └─────────────────┘                      │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    RDS      │  │ ElastiCache │  │     S3      │  │  Route 53   │        │
│  │ PostgreSQL  │  │   Redis     │  │  (Backups)  │  │   (DNS)     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform 1.5+
- kubectl
- Helm 3.x

## Deployment Steps

### 1. Configure Terraform

```bash
cd infra/terraform/aws

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
# AWS Configuration
aws_region  = "us-east-1"
environment = "production"

# Cluster Configuration
cluster_name    = "optimal-production"
cluster_version = "1.28"

# Networking
vpc_cidr = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Node Groups
system_node_instance_type = "m5.large"
system_node_desired_size  = 3
app_node_instance_type    = "m5.xlarge"
app_node_min_size         = 3
app_node_max_size         = 10

# Domain (optional)
domain_name = "yourdomain.com"
```

### 2. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review plan
terraform plan

# Apply (takes ~15-20 minutes)
terraform apply
```

### 3. Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --name optimal-production \
  --region us-east-1

# Verify connection
kubectl get nodes
```

### 4. Deploy Platform

```bash
cd ../../..

# Install dependencies
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Deploy platform
helm upgrade --install optimal-platform k8s/helm-charts/optimal-platform \
  --namespace optimal-system \
  --create-namespace \
  -f k8s/helm-charts/optimal-platform/values-production.yaml \
  --set global.domain=yourdomain.com
```

### 5. Configure DNS

If using Route 53:

```bash
# Get Load Balancer hostname
kubectl get svc -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Create DNS records in Route 53
# - portal.yourdomain.com -> ALB
# - api.yourdomain.com -> ALB
# - keycloak.yourdomain.com -> ALB
```

## AWS Services Used

| Service | Purpose | Configuration |
|---------|---------|---------------|
| EKS | Kubernetes cluster | Managed control plane |
| EC2 | Worker nodes | Auto-scaling groups |
| RDS | PostgreSQL database | Multi-AZ (optional) |
| ElastiCache | Redis cache | Cluster mode |
| S3 | Backup storage | Versioning enabled |
| Route 53 | DNS management | Optional |
| ACM | TLS certificates | Auto-renewal |
| ALB | Load balancer | Via ingress |

## Production Configuration

### High Availability

```yaml
# values-production.yaml
portal:
  replicas: 3
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - topologyKey: topology.kubernetes.io/zone

apiGateway:
  replicas: 3

postgresql:
  architecture: replication
  readReplicas:
    replicaCount: 2
```

### Autoscaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilization: 70
  targetMemoryUtilization: 80
```

### Backup with S3

```yaml
velero:
  enabled: true
  provider: aws
  bucket: optimal-backups-production
  region: us-east-1
```

## Security

### IAM Roles

The Terraform creates:
- EKS cluster role
- Node group role
- Service account roles (IRSA)

### Security Groups

- Cluster security group (control plane)
- Node security group (workers)
- Database security group (RDS)

### Encryption

- EKS secrets encryption with KMS
- RDS encryption at rest
- S3 bucket encryption
- EBS volume encryption

## Monitoring

### CloudWatch Integration

```yaml
# Enable CloudWatch logging
cloudwatch:
  enabled: true
  logRetention: 30
  logGroups:
    - /aws/eks/optimal-production/cluster
```

### Cost Optimization

- Use Spot instances for non-critical workloads
- Configure cluster autoscaler
- Set resource requests/limits appropriately
- Use S3 Intelligent-Tiering for backups

## Cleanup

```bash
# Delete platform
helm uninstall optimal-platform -n optimal-system

# Delete infrastructure
cd infra/terraform/aws
terraform destroy
```

## Troubleshooting

### EKS Node Issues

```bash
# Check node status
kubectl describe node <node-name>

# View node group scaling
aws eks describe-nodegroup \
  --cluster-name optimal-production \
  --nodegroup-name app-nodes
```

### RDS Connection

```bash
# Get RDS endpoint
aws rds describe-db-instances \
  --query 'DBInstances[0].Endpoint.Address'

# Test from pod
kubectl exec -it <pod> -- pg_isready -h <rds-endpoint>
```
