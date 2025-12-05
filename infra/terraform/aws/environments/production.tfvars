# =============================================================================
# Optimal Platform - AWS Production Environment
# =============================================================================

aws_region  = "us-east-1"
environment = "production"
owner       = "optimal-platform-team"

# Kubernetes
kubernetes_version = "1.28"

# System nodes (production-grade)
system_node_instance_types = ["m5.large", "m5.xlarge"]
system_node_min_size       = 2
system_node_max_size       = 5
system_node_desired_size   = 3

# Application nodes (on-demand for reliability)
app_node_instance_types = ["m5.xlarge", "m5.2xlarge"]
app_node_min_size       = 3
app_node_max_size       = 20
app_node_desired_size   = 5

# Database (production-grade with Multi-AZ)
enable_rds                = true
rds_instance_class        = "db.r5.large"
rds_allocated_storage     = 100
rds_max_allocated_storage = 500

# Cache (production-grade)
enable_elasticache    = true
elasticache_node_type = "cache.r5.large"

# Domain configuration
domain_name = "gooptimal.io"
use_route53 = true

