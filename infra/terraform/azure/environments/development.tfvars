# =============================================================================
# Optimal Platform - Azure Development Environment
# =============================================================================

environment = "development"
location    = "eastus"
owner       = "platform-team"

# Kubernetes
kubernetes_version = "1.28"

# System Node Pool - Minimal for dev
system_node_vm_size   = "Standard_D2s_v5"
system_node_count     = 2
system_node_min_count = 2
system_node_max_count = 3

# Application Node Pool - Uses Spot VMs to reduce cost
app_node_vm_size   = "Standard_D2s_v5"
app_node_count     = 1
app_node_min_count = 1
app_node_max_count = 5

# Database - Basic tier for development
enable_postgresql     = true
postgresql_sku_name   = "B_Standard_B1ms"
postgresql_storage_mb = 32768

# Redis - Standard tier
enable_redis   = true
redis_capacity = 0

# No geo-replication for development
acr_geo_replications = []

