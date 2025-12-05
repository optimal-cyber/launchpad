# =============================================================================
# Optimal Platform - AWS Staging Environment
# =============================================================================

aws_region  = "us-east-1"
environment = "staging"
owner       = "optimal-platform-team"

# Kubernetes
kubernetes_version = "1.28"

# System nodes
system_node_instance_types = ["t3.large"]
system_node_min_size       = 2
system_node_max_size       = 4
system_node_desired_size   = 2

# Application nodes
app_node_instance_types = ["t3.xlarge"]
app_node_min_size       = 2
app_node_max_size       = 10
app_node_desired_size   = 3

# Database
enable_rds                = true
rds_instance_class        = "db.t3.medium"
rds_allocated_storage     = 50
rds_max_allocated_storage = 200

# Cache
enable_elasticache    = true
elasticache_node_type = "cache.t3.small"

# Domain configuration
domain_name = "staging.gooptimal.io"
use_route53 = true

