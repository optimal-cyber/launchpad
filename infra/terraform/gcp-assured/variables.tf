# =============================================================================
# Optimal Platform - GCP Assured Workloads Variables
# FedRAMP High / IL4-IL5 Configuration
# =============================================================================

# -----------------------------------------------------------------------------
# General Configuration
# -----------------------------------------------------------------------------

variable "project_id" {
  description = "GCP project ID for Assured Workloads"
  type        = string
}

variable "region" {
  description = "GCP region (must be FedRAMP High approved)"
  type        = string
  default     = "us-central1"

  validation {
    condition = contains([
      "us-central1",
      "us-east1",
      "us-east4",
      "us-west1",
      "us-west2"
    ], var.region)
    error_message = "Region must be a FedRAMP High approved region."
  }
}

variable "zones" {
  description = "GCP zones for multi-zone deployment"
  type        = list(string)
  default     = ["us-central1-a", "us-central1-b", "us-central1-c"]
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be: development, staging, or production."
  }
}

variable "owner" {
  description = "Owner/team responsible for resources"
  type        = string
  default     = "optimal-platform-team"
}

# -----------------------------------------------------------------------------
# Assured Workloads Configuration
# -----------------------------------------------------------------------------

variable "enable_assured_workloads" {
  description = "Enable GCP Assured Workloads for FedRAMP High"
  type        = bool
  default     = true
}

variable "organization_id" {
  description = "GCP Organization ID"
  type        = string
  default     = ""
}

variable "billing_account" {
  description = "Billing account ID"
  type        = string
  default     = ""
}

variable "assured_workloads_folder_id" {
  description = "Folder ID for Assured Workloads resources"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Kubernetes Configuration
# -----------------------------------------------------------------------------

variable "kubernetes_version" {
  description = "Kubernetes version for GKE clusters"
  type        = string
  default     = "1.29"
}

# -----------------------------------------------------------------------------
# Application VPC CIDR Configuration
# -----------------------------------------------------------------------------

variable "app_vpc_cidr_primary" {
  description = "Primary CIDR for Application VPC"
  type        = string
  default     = "10.0.0.0/20"
}

variable "app_vpc_cidr_gke_nodes" {
  description = "GKE nodes CIDR for Application VPC"
  type        = string
  default     = "10.0.16.0/20"
}

variable "app_vpc_cidr_pods" {
  description = "GKE pods CIDR for Application VPC"
  type        = string
  default     = "10.4.0.0/14"
}

variable "app_vpc_cidr_services" {
  description = "GKE services CIDR for Application VPC"
  type        = string
  default     = "10.0.32.0/20"
}

# -----------------------------------------------------------------------------
# Monitoring VPC CIDR Configuration
# -----------------------------------------------------------------------------

variable "mon_vpc_cidr_primary" {
  description = "Primary CIDR for Monitoring VPC"
  type        = string
  default     = "10.1.0.0/20"
}

variable "mon_vpc_cidr_gke_nodes" {
  description = "GKE nodes CIDR for Monitoring VPC"
  type        = string
  default     = "10.1.16.0/20"
}

variable "mon_vpc_cidr_pods" {
  description = "GKE pods CIDR for Monitoring VPC"
  type        = string
  default     = "10.8.0.0/14"
}

variable "mon_vpc_cidr_services" {
  description = "GKE services CIDR for Monitoring VPC"
  type        = string
  default     = "10.1.32.0/20"
}

# -----------------------------------------------------------------------------
# Security VPC CIDR Configuration
# -----------------------------------------------------------------------------

variable "sec_vpc_cidr_primary" {
  description = "Primary CIDR for Security VPC"
  type        = string
  default     = "10.2.0.0/20"
}

variable "sec_vpc_cidr_gke_nodes" {
  description = "GKE nodes CIDR for Security VPC"
  type        = string
  default     = "10.2.16.0/20"
}

variable "sec_vpc_cidr_pods" {
  description = "GKE pods CIDR for Security VPC"
  type        = string
  default     = "10.12.0.0/14"
}

variable "sec_vpc_cidr_services" {
  description = "GKE services CIDR for Security VPC"
  type        = string
  default     = "10.2.32.0/20"
}

# -----------------------------------------------------------------------------
# Management VPC CIDR Configuration
# -----------------------------------------------------------------------------

variable "mgmt_vpc_cidr_primary" {
  description = "Primary CIDR for Management VPC"
  type        = string
  default     = "10.3.0.0/20"
}

variable "mgmt_vpc_cidr_gke_nodes" {
  description = "GKE nodes CIDR for Management VPC"
  type        = string
  default     = "10.3.16.0/20"
}

variable "mgmt_vpc_cidr_bastion" {
  description = "Bastion subnet CIDR for Management VPC"
  type        = string
  default     = "10.3.48.0/24"
}

variable "mgmt_vpc_cidr_pods" {
  description = "GKE pods CIDR for Management VPC"
  type        = string
  default     = "10.16.0.0/14"
}

variable "mgmt_vpc_cidr_services" {
  description = "GKE services CIDR for Management VPC"
  type        = string
  default     = "10.3.32.0/20"
}

# -----------------------------------------------------------------------------
# Node Pool Machine Types
# -----------------------------------------------------------------------------

variable "app_system_node_type" {
  description = "Machine type for Application cluster system nodes"
  type        = string
  default     = "n2-standard-2"
}

variable "app_workload_node_type" {
  description = "Machine type for Application cluster workload nodes"
  type        = string
  default     = "n2-standard-4"
}

variable "mon_node_type" {
  description = "Machine type for Monitoring cluster nodes"
  type        = string
  default     = "n2-standard-4"
}

variable "sec_node_type" {
  description = "Machine type for Security cluster nodes"
  type        = string
  default     = "n2-standard-2"
}

variable "mgmt_node_type" {
  description = "Machine type for Management cluster nodes"
  type        = string
  default     = "n2-standard-2"
}

# -----------------------------------------------------------------------------
# Security Configuration
# -----------------------------------------------------------------------------

variable "authorized_admin_cidrs" {
  description = "CIDR blocks authorized for bastion SSH access"
  type        = list(string)
  default     = []
}

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------

variable "enable_cloud_sql" {
  description = "Enable Cloud SQL PostgreSQL"
  type        = bool
  default     = true
}

variable "cloud_sql_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-custom-2-8192"
}

variable "db_password" {
  description = "Database admin password"
  type        = string
  sensitive   = true
  default     = ""
}

# -----------------------------------------------------------------------------
# Redis Configuration
# -----------------------------------------------------------------------------

variable "enable_memorystore" {
  description = "Enable Memorystore Redis"
  type        = bool
  default     = true
}

variable "redis_memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 4
}

# -----------------------------------------------------------------------------
# Domain Configuration
# -----------------------------------------------------------------------------

variable "domain_name" {
  description = "Primary domain for the platform (e.g., gooptimal.io)"
  type        = string
  default     = ""
}

variable "subdomains" {
  description = "Subdomains for services"
  type = object({
    portal     = string
    keycloak   = string
    gitlab     = string
    harbor     = string
    grafana    = string
    argocd     = string
  })
  default = {
    portal     = "portal"
    keycloak   = "auth"
    gitlab     = "gitlab"
    harbor     = "harbor"
    grafana    = "grafana"
    argocd     = "argocd"
  }
}
