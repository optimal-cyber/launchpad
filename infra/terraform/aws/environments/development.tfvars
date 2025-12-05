# =============================================================================
# Optimal Platform - AWS Development Environment
# =============================================================================

aws_region  = "us-east-1"
environment = "development"
owner       = "optimal-platform-team"

# Kubernetes
kubernetes_version = "1.28"

# System nodes (smaller for dev)
system_node_instance_types = ["t3.medium"]
system_node_min_size       = 1
system_node_max_size       = 3
system_node_desired_size   = 2

# Application nodes (use spot for cost savings)
app_node_instance_types = ["t3.large"]
app_node_min_size       = 1
app_node_max_size       = 5
app_node_desired_size   = 2

# Database (smaller for dev)
enable_rds                = true
rds_instance_class        = "db.t3.small"
rds_allocated_storage     = 20
rds_max_allocated_storage = 50

# Cache (minimal for dev)
enable_elasticache    = true
elasticache_node_type = "cache.t3.micro"

# No custom domain for dev (use Load Balancer URL)
domain_name = ""
use_route53 = false

