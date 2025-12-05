# =============================================================================
# Optimal Platform - GCP Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# GKE Cluster Outputs
# -----------------------------------------------------------------------------

output "cluster_name" {
  description = "GKE cluster name"
  value       = module.gke.name
}

output "cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = module.gke.endpoint
}

output "cluster_ca_certificate" {
  description = "GKE cluster CA certificate"
  value       = module.gke.ca_certificate
  sensitive   = true
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${module.gke.name} --region ${var.region} --project ${var.project_id}"
}

# -----------------------------------------------------------------------------
# VPC Outputs
# -----------------------------------------------------------------------------

output "network_name" {
  description = "VPC network name"
  value       = module.vpc.network_name
}

output "network_self_link" {
  description = "VPC network self link"
  value       = module.vpc.network_self_link
}

output "subnets" {
  description = "Subnet names"
  value       = module.vpc.subnets_names
}

# -----------------------------------------------------------------------------
# Cloud SQL Outputs
# -----------------------------------------------------------------------------

output "cloud_sql_instance_name" {
  description = "Cloud SQL instance name"
  value       = var.enable_cloud_sql ? module.cloud_sql[0].instance_name : null
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL connection name for Cloud SQL Proxy"
  value       = var.enable_cloud_sql ? module.cloud_sql[0].instance_connection_name : null
}

output "cloud_sql_private_ip" {
  description = "Cloud SQL private IP address"
  value       = var.enable_cloud_sql ? module.cloud_sql[0].private_ip_address : null
}

# -----------------------------------------------------------------------------
# Memorystore Outputs
# -----------------------------------------------------------------------------

output "redis_host" {
  description = "Redis host address"
  value       = var.enable_memorystore ? google_redis_instance.cache[0].host : null
}

output "redis_port" {
  description = "Redis port"
  value       = var.enable_memorystore ? google_redis_instance.cache[0].port : null
}

# -----------------------------------------------------------------------------
# Artifact Registry Outputs
# -----------------------------------------------------------------------------

output "artifact_registry_urls" {
  description = "Artifact Registry repository URLs"
  value = {
    for name, repo in google_artifact_registry_repository.services :
    name => "${var.region}-docker.pkg.dev/${var.project_id}/${repo.repository_id}"
  }
}

# -----------------------------------------------------------------------------
# GCS Outputs
# -----------------------------------------------------------------------------

output "artifacts_bucket_name" {
  description = "GCS bucket name for artifacts"
  value       = google_storage_bucket.artifacts.name
}

output "artifacts_bucket_url" {
  description = "GCS bucket URL for artifacts"
  value       = google_storage_bucket.artifacts.url
}

# -----------------------------------------------------------------------------
# Service Account Outputs
# -----------------------------------------------------------------------------

output "service_account_email" {
  description = "Service account email for workload identity"
  value       = google_service_account.optimal_platform.email
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

