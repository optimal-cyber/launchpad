# =============================================================================
# Optimal Platform - Azure Production Environment
# =============================================================================

environment = "production"
location    = "eastus"
owner       = "platform-team"

# Kubernetes
kubernetes_version = "1.28"

# System Node Pool - High availability
system_node_vm_size   = "Standard_D4s_v5"
system_node_count     = 3
system_node_min_count = 3
system_node_max_count = 5

# Application Node Pool - Regular VMs (not Spot)
app_node_vm_size   = "Standard_D8s_v5"
app_node_count     = 3
app_node_min_count = 2
app_node_max_count = 20

# Database - General Purpose tier with HA
enable_postgresql     = true
postgresql_sku_name   = "GP_Standard_D4s_v3"
postgresql_storage_mb = 131072

# Redis - Premium tier with clustering
enable_redis   = true
redis_capacity = 2

# Geo-replication for high availability
acr_geo_replications = ["westus2"]

