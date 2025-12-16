# =============================================================================
# Optimal Platform - Azure Variables
# =============================================================================

# -----------------------------------------------------------------------------
# General Configuration
# -----------------------------------------------------------------------------

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "location" {
  description = "Azure region to deploy resources"
  type        = string
  default     = "eastus"
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
  description = "Kubernetes version for AKS"
  type        = string
  default     = "1.28"
}

# -----------------------------------------------------------------------------
# System Node Pool Configuration
# -----------------------------------------------------------------------------

variable "system_node_vm_size" {
  description = "VM size for system node pool"
  type        = string
  default     = "Standard_D2s_v5"
}

variable "system_node_count" {
  description = "Initial number of system nodes"
  type        = number
  default     = 2
}

variable "system_node_min_count" {
  description = "Minimum number of system nodes"
  type        = number
  default     = 2
}

variable "system_node_max_count" {
  description = "Maximum number of system nodes"
  type        = number
  default     = 5
}

# -----------------------------------------------------------------------------
# Application Node Pool Configuration
# -----------------------------------------------------------------------------

variable "app_node_vm_size" {
  description = "VM size for application node pool"
  type        = string
  default     = "Standard_D4s_v5"
}

variable "app_node_count" {
  description = "Initial number of application nodes"
  type        = number
  default     = 2
}

variable "app_node_min_count" {
  description = "Minimum number of application nodes"
  type        = number
  default     = 1
}

variable "app_node_max_count" {
  description = "Maximum number of application nodes"
  type        = number
  default     = 10
}

# -----------------------------------------------------------------------------
# PostgreSQL Configuration
# -----------------------------------------------------------------------------

variable "enable_postgresql" {
  description = "Enable Azure Database for PostgreSQL"
  type        = bool
  default     = true
}

variable "postgresql_sku_name" {
  description = "PostgreSQL SKU name (e.g., B_Standard_B1ms, GP_Standard_D2s_v3)"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "postgresql_storage_mb" {
  description = "PostgreSQL storage in MB"
  type        = number
  default     = 32768
}

variable "db_password" {
  description = "Database password for optimal_admin user"
  type        = string
  sensitive   = true
  default     = ""
}

# -----------------------------------------------------------------------------
# Redis Configuration
# -----------------------------------------------------------------------------

variable "enable_redis" {
  description = "Enable Azure Cache for Redis"
  type        = bool
  default     = true
}

variable "redis_capacity" {
  description = "Redis cache capacity (0-6 for Basic/Standard, 1-4 for Premium)"
  type        = number
  default     = 1
}

# -----------------------------------------------------------------------------
# Container Registry Configuration
# -----------------------------------------------------------------------------

variable "acr_geo_replications" {
  description = "List of regions for ACR geo-replication (production only)"
  type        = list(string)
  default     = ["westus2"]
}

# -----------------------------------------------------------------------------
# Azure AD Configuration
# -----------------------------------------------------------------------------

variable "admin_group_object_ids" {
  description = "List of Azure AD group object IDs for cluster admin access"
  type        = list(string)
  default     = []
}

# -----------------------------------------------------------------------------
# Domain Configuration
# -----------------------------------------------------------------------------

variable "domain_name" {
  description = "Domain name for the platform (e.g., gooptimal.io)"
  type        = string
  default     = ""
}
