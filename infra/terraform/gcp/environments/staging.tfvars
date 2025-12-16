# =============================================================================
# Optimal Platform - GCP Staging Environment
# =============================================================================

environment = "staging"
region      = "us-central1"
zones       = ["us-central1-a", "us-central1-b", "us-central1-c"]
owner       = "platform-team"

# Kubernetes
kubernetes_version = "1.28"

# System Node Pool - Production-like
system_node_machine_type = "e2-standard-2"
system_node_min_count    = 2
system_node_max_count    = 5

# Application Node Pool - Uses preemptible VMs
app_node_machine_type = "e2-standard-4"
app_node_min_count    = 2
app_node_max_count    = 10

# Database - Moderate tier
enable_cloud_sql = true
cloud_sql_tier   = "db-custom-2-7680"

# Redis - Standard tier
enable_memorystore   = true
redis_memory_size_gb = 2
