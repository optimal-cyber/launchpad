# =============================================================================
# Optimal Platform - GCP Development Environment
# =============================================================================

project_id  = "optimal-platform-dev"
region      = "us-central1"
zones       = ["us-central1-a", "us-central1-b"]
environment = "development"
owner       = "optimal-platform-team"

# Kubernetes
kubernetes_version = "1.28"

# System nodes (smaller for dev)
system_node_machine_type = "e2-medium"
system_node_min_count    = 1
system_node_max_count    = 3

# Application nodes (use preemptible for cost savings)
app_node_machine_type = "e2-standard-2"
app_node_min_count    = 1
app_node_max_count    = 5

# Database (minimal for dev)
enable_cloud_sql = true
cloud_sql_tier   = "db-f1-micro"
db_password      = ""  # Set via environment variable or secrets

# Cache (minimal for dev)
enable_memorystore   = true
redis_memory_size_gb = 1

# No custom domain for dev
domain_name = ""

