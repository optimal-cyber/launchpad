# =============================================================================
# Optimal Platform - Azure Staging Environment
# =============================================================================

environment = "staging"
location    = "eastus"
owner       = "platform-team"

# Kubernetes
kubernetes_version = "1.28"

# System Node Pool - Production-like
system_node_vm_size   = "Standard_D2s_v5"
system_node_count     = 2
system_node_min_count = 2
system_node_max_count = 5

# Application Node Pool - Uses Spot VMs
app_node_vm_size   = "Standard_D4s_v5"
app_node_count     = 2
app_node_min_count = 1
app_node_max_count = 8

# Database - General Purpose tier
enable_postgresql     = true
postgresql_sku_name   = "GP_Standard_D2s_v3"
postgresql_storage_mb = 65536

# Redis - Standard tier
enable_redis   = true
redis_capacity = 1

# No geo-replication for staging
acr_geo_replications = []
