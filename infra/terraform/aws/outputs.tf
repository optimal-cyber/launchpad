# =============================================================================
# Optimal Platform - AWS Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# EKS Cluster Outputs
# -----------------------------------------------------------------------------

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  description = "EKS cluster CA certificate"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "cluster_oidc_provider_arn" {
  description = "EKS OIDC provider ARN"
  value       = module.eks.oidc_provider_arn
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

# -----------------------------------------------------------------------------
# VPC Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

# -----------------------------------------------------------------------------
# RDS Outputs
# -----------------------------------------------------------------------------

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = var.enable_rds ? module.rds[0].db_instance_endpoint : null
}

output "rds_database_name" {
  description = "RDS database name"
  value       = var.enable_rds ? module.rds[0].db_instance_name : null
}

# -----------------------------------------------------------------------------
# ElastiCache Outputs
# -----------------------------------------------------------------------------

output "elasticache_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = var.enable_elasticache ? module.elasticache[0].cluster_cache_nodes[0].address : null
}

# -----------------------------------------------------------------------------
# ECR Outputs
# -----------------------------------------------------------------------------

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value = {
    for name, repo in aws_ecr_repository.services : name => repo.repository_url
  }
}

# -----------------------------------------------------------------------------
# S3 Outputs
# -----------------------------------------------------------------------------

output "artifacts_bucket_name" {
  description = "S3 bucket name for artifacts"
  value       = module.s3_bucket.s3_bucket_id
}

output "artifacts_bucket_arn" {
  description = "S3 bucket ARN for artifacts"
  value       = module.s3_bucket.s3_bucket_arn
}

# -----------------------------------------------------------------------------
# Certificate Outputs
# -----------------------------------------------------------------------------

output "acm_certificate_arn" {
  description = "ACM certificate ARN"
  value       = var.domain_name != "" ? aws_acm_certificate.main[0].arn : null
}

# -----------------------------------------------------------------------------
# Environment-specific URLs (after Helm deployment)
# -----------------------------------------------------------------------------

output "expected_urls" {
  description = "Expected URLs after deployment"
  value = var.domain_name != "" ? {
    portal        = "https://portal.${var.domain_name}"
    api           = "https://api.${var.domain_name}"
    hub           = "https://hub.${var.domain_name}"
    observability = "https://observability.${var.domain_name}"
    keycloak      = "https://keycloak.${var.domain_name}"
  } : null
}

