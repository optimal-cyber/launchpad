# =============================================================================
# Optimal Platform - AWS Variables
# =============================================================================

# -----------------------------------------------------------------------------
# General Configuration
# -----------------------------------------------------------------------------

variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "us-east-1"
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
  description = "Kubernetes version for EKS"
  type        = string
  default     = "1.28"
}

# -----------------------------------------------------------------------------
# System Node Group Configuration
# -----------------------------------------------------------------------------

variable "system_node_instance_types" {
  description = "Instance types for system node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "system_node_min_size" {
  description = "Minimum number of system nodes"
  type        = number
  default     = 1
}

variable "system_node_max_size" {
  description = "Maximum number of system nodes"
  type        = number
  default     = 3
}

variable "system_node_desired_size" {
  description = "Desired number of system nodes"
  type        = number
  default     = 2
}

# -----------------------------------------------------------------------------
# Application Node Group Configuration
# -----------------------------------------------------------------------------

variable "app_node_instance_types" {
  description = "Instance types for application node group"
  type        = list(string)
  default     = ["t3.large"]
}

variable "app_node_min_size" {
  description = "Minimum number of application nodes"
  type        = number
  default     = 1
}

variable "app_node_max_size" {
  description = "Maximum number of application nodes"
  type        = number
  default     = 10
}

variable "app_node_desired_size" {
  description = "Desired number of application nodes"
  type        = number
  default     = 2
}

# -----------------------------------------------------------------------------
# RDS Configuration
# -----------------------------------------------------------------------------

variable "enable_rds" {
  description = "Enable RDS PostgreSQL"
  type        = bool
  default     = true
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_max_allocated_storage" {
  description = "RDS maximum allocated storage for autoscaling"
  type        = number
  default     = 100
}

# -----------------------------------------------------------------------------
# ElastiCache Configuration
# -----------------------------------------------------------------------------

variable "enable_elasticache" {
  description = "Enable ElastiCache Redis"
  type        = bool
  default     = true
}

variable "elasticache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

# -----------------------------------------------------------------------------
# Domain Configuration
# -----------------------------------------------------------------------------

variable "domain_name" {
  description = "Domain name for the platform (e.g., gooptimal.io)"
  type        = string
  default     = ""
}

variable "use_route53" {
  description = "Use Route53 for DNS management"
  type        = bool
  default     = false
}

