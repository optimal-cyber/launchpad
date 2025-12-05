# =============================================================================
# Optimal Platform - GCP Variables
# =============================================================================

# -----------------------------------------------------------------------------
# General Configuration
# -----------------------------------------------------------------------------

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region to deploy to"
  type        = string
  default     = "us-central1"
}

variable "zones" {
  description = "GCP zones for the cluster"
  type        = list(string)
  default     = ["us-central1-a", "us-central1-b", "us-central1-c"]
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "development"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "optimal-platform-team"
}

# -----------------------------------------------------------------------------
# Kubernetes Configuration
# -----------------------------------------------------------------------------

variable "kubernetes_version" {
  description = "Kubernetes version for GKE"
  type        = string
  default     = "1.28"
}

# -----------------------------------------------------------------------------
# System Node Pool Configuration
# -----------------------------------------------------------------------------

variable "system_node_machine_type" {
  description = "Machine type for system node pool"
  type        = string
  default     = "e2-medium"
}

variable "system_node_min_count" {
  description = "Minimum number of system nodes per zone"
  type        = number
  default     = 1
}

variable "system_node_max_count" {
  description = "Maximum number of system nodes per zone"
  type        = number
  default     = 3
}

# -----------------------------------------------------------------------------
# Application Node Pool Configuration
# -----------------------------------------------------------------------------

variable "app_node_machine_type" {
  description = "Machine type for application node pool"
  type        = string
  default     = "e2-standard-2"
}

variable "app_node_min_count" {
  description = "Minimum number of application nodes per zone"
  type        = number
  default     = 1
}

variable "app_node_max_count" {
  description = "Maximum number of application nodes per zone"
  type        = number
  default     = 5
}

# -----------------------------------------------------------------------------
# Cloud SQL Configuration
# -----------------------------------------------------------------------------

variable "enable_cloud_sql" {
  description = "Enable Cloud SQL PostgreSQL"
  type        = bool
  default     = true
}

variable "cloud_sql_tier" {
  description = "Cloud SQL tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_password" {
  description = "Database password for optimal_admin user"
  type        = string
  sensitive   = true
  default     = ""
}

# -----------------------------------------------------------------------------
# Memorystore Redis Configuration
# -----------------------------------------------------------------------------

variable "enable_memorystore" {
  description = "Enable Memorystore Redis"
  type        = bool
  default     = true
}

variable "redis_memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 1
}

# -----------------------------------------------------------------------------
# Domain Configuration
# -----------------------------------------------------------------------------

variable "domain_name" {
  description = "Domain name for the platform (e.g., gooptimal.io)"
  type        = string
  default     = ""
}

