# =============================================================================
# Optimal Platform - GCP Production Environment
# =============================================================================

project_id  = "optimal-platform-prod"
region      = "us-central1"
zones       = ["us-central1-a", "us-central1-b", "us-central1-c"]
environment = "production"
owner       = "optimal-platform-team"

# Kubernetes
kubernetes_version = "1.28"

# System nodes (production-grade)
system_node_machine_type = "e2-standard-4"
system_node_min_count    = 2
system_node_max_count    = 5

# Application nodes (on-demand for reliability)
app_node_machine_type = "e2-standard-8"
app_node_min_count    = 3
app_node_max_count    = 20

# Database (production-grade)
enable_cloud_sql = true
cloud_sql_tier   = "db-custom-4-15360"  # 4 vCPU, 15GB RAM
db_password      = ""  # Set via environment variable or secrets

# Cache (production-grade)
enable_memorystore   = true
redis_memory_size_gb = 5

# Domain configuration
domain_name = "gooptimal.io"

