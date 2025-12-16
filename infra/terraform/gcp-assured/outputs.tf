# =============================================================================
# Optimal Platform - GCP Assured Workloads Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# VPC Outputs
# -----------------------------------------------------------------------------

output "application_vpc" {
  description = "Application VPC details"
  value = {
    network_name    = module.application_vpc.network_name
    network_id      = module.application_vpc.network_id
    subnets         = module.application_vpc.subnets_names
    subnet_ips      = module.application_vpc.subnets_ips
  }
}

output "monitoring_vpc" {
  description = "Monitoring VPC details"
  value = {
    network_name    = module.monitoring_vpc.network_name
    network_id      = module.monitoring_vpc.network_id
    subnets         = module.monitoring_vpc.subnets_names
    subnet_ips      = module.monitoring_vpc.subnets_ips
  }
}

output "security_vpc" {
  description = "Security VPC details"
  value = {
    network_name    = module.security_vpc.network_name
    network_id      = module.security_vpc.network_id
    subnets         = module.security_vpc.subnets_names
    subnet_ips      = module.security_vpc.subnets_ips
  }
}

output "management_vpc" {
  description = "Management VPC details"
  value = {
    network_name    = module.management_vpc.network_name
    network_id      = module.management_vpc.network_id
    subnets         = module.management_vpc.subnets_names
    subnet_ips      = module.management_vpc.subnets_ips
  }
}

# -----------------------------------------------------------------------------
# GKE Cluster Outputs
# -----------------------------------------------------------------------------

output "gke_application_cluster" {
  description = "Application GKE cluster details"
  value = {
    name       = module.gke_application.name
    endpoint   = module.gke_application.endpoint
    location   = module.gke_application.location
    cluster_id = module.gke_application.cluster_id
  }
  sensitive = true
}

output "gke_monitoring_cluster" {
  description = "Monitoring GKE cluster details"
  value = {
    name       = module.gke_monitoring.name
    endpoint   = module.gke_monitoring.endpoint
    location   = module.gke_monitoring.location
    cluster_id = module.gke_monitoring.cluster_id
  }
  sensitive = true
}

output "gke_security_cluster" {
  description = "Security GKE cluster details"
  value = {
    name       = module.gke_security.name
    endpoint   = module.gke_security.endpoint
    location   = module.gke_security.location
    cluster_id = module.gke_security.cluster_id
  }
  sensitive = true
}

output "gke_management_cluster" {
  description = "Management GKE cluster details"
  value = {
    name       = module.gke_management.name
    endpoint   = module.gke_management.endpoint
    location   = module.gke_management.location
    cluster_id = module.gke_management.cluster_id
  }
  sensitive = true
}

# -----------------------------------------------------------------------------
# Connection Commands
# -----------------------------------------------------------------------------

output "cluster_connection_commands" {
  description = "Commands to connect to each GKE cluster"
  value = {
    application = "gcloud container clusters get-credentials ${module.gke_application.name} --region ${var.region} --project ${var.project_id}"
    monitoring  = "gcloud container clusters get-credentials ${module.gke_monitoring.name} --region ${var.region} --project ${var.project_id}"
    security    = "gcloud container clusters get-credentials ${module.gke_security.name} --region ${var.region} --project ${var.project_id}"
    management  = "gcloud container clusters get-credentials ${module.gke_management.name} --region ${var.region} --project ${var.project_id}"
  }
}

# -----------------------------------------------------------------------------
# Database Outputs
# -----------------------------------------------------------------------------

output "cloud_sql_instance" {
  description = "Cloud SQL instance details"
  value = var.enable_cloud_sql ? {
    instance_name      = google_sql_database_instance.optimal[0].name
    connection_name    = google_sql_database_instance.optimal[0].connection_name
    private_ip         = google_sql_database_instance.optimal[0].private_ip_address
    database_version   = google_sql_database_instance.optimal[0].database_version
  } : null
  sensitive = true
}

output "redis_instance" {
  description = "Redis instance details"
  value = var.enable_memorystore ? {
    instance_name = google_redis_instance.cache[0].name
    host          = google_redis_instance.cache[0].host
    port          = google_redis_instance.cache[0].port
    memory_size   = google_redis_instance.cache[0].memory_size_gb
  } : null
  sensitive = true
}

# -----------------------------------------------------------------------------
# Service Account Outputs
# -----------------------------------------------------------------------------

output "service_accounts" {
  description = "Service accounts for workload identity"
  value = {
    optimal_platform = google_service_account.optimal_platform.email
    gitlab           = google_service_account.gitlab.email
    monitoring       = google_service_account.monitoring.email
    security         = google_service_account.security.email
  }
}

# -----------------------------------------------------------------------------
# KMS Outputs
# -----------------------------------------------------------------------------

output "kms_keys" {
  description = "KMS encryption keys"
  value = {
    keyring     = google_kms_key_ring.optimal.id
    gke_key     = google_kms_crypto_key.gke.id
    storage_key = google_kms_crypto_key.storage.id
  }
}

# -----------------------------------------------------------------------------
# Artifact Registry Outputs
# -----------------------------------------------------------------------------

output "artifact_registries" {
  description = "Artifact Registry repositories"
  value = {
    for name, repo in google_artifact_registry_repository.services :
    name => "${var.region}-docker.pkg.dev/${var.project_id}/${repo.repository_id}"
  }
}

# -----------------------------------------------------------------------------
# DNS Outputs
# -----------------------------------------------------------------------------

output "dns_zone" {
  description = "Cloud DNS managed zone"
  value = var.domain_name != "" ? {
    name        = google_dns_managed_zone.optimal[0].name
    dns_name    = google_dns_managed_zone.optimal[0].dns_name
    name_servers = google_dns_managed_zone.optimal[0].name_servers
  } : null
}

# -----------------------------------------------------------------------------
# Network CIDR Summary
# -----------------------------------------------------------------------------

output "network_cidrs" {
  description = "Summary of all network CIDRs"
  value = {
    application = {
      primary  = var.app_vpc_cidr_primary
      nodes    = var.app_vpc_cidr_gke_nodes
      pods     = var.app_vpc_cidr_pods
      services = var.app_vpc_cidr_services
    }
    monitoring = {
      primary  = var.mon_vpc_cidr_primary
      nodes    = var.mon_vpc_cidr_gke_nodes
      pods     = var.mon_vpc_cidr_pods
      services = var.mon_vpc_cidr_services
    }
    security = {
      primary  = var.sec_vpc_cidr_primary
      nodes    = var.sec_vpc_cidr_gke_nodes
      pods     = var.sec_vpc_cidr_pods
      services = var.sec_vpc_cidr_services
    }
    management = {
      primary  = var.mgmt_vpc_cidr_primary
      nodes    = var.mgmt_vpc_cidr_gke_nodes
      bastion  = var.mgmt_vpc_cidr_bastion
      pods     = var.mgmt_vpc_cidr_pods
      services = var.mgmt_vpc_cidr_services
    }
  }
}
