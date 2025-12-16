# =============================================================================
# Optimal Platform - Azure Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# Resource Group
# -----------------------------------------------------------------------------

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.main.location
}

# -----------------------------------------------------------------------------
# AKS Cluster
# -----------------------------------------------------------------------------

output "cluster_name" {
  description = "AKS cluster name"
  value       = azurerm_kubernetes_cluster.main.name
}

output "cluster_id" {
  description = "AKS cluster ID"
  value       = azurerm_kubernetes_cluster.main.id
}

output "cluster_fqdn" {
  description = "AKS cluster FQDN"
  value       = azurerm_kubernetes_cluster.main.fqdn
}

output "cluster_endpoint" {
  description = "AKS cluster API server endpoint"
  value       = azurerm_kubernetes_cluster.main.kube_config[0].host
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "AKS cluster CA certificate (base64)"
  value       = azurerm_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate
  sensitive   = true
}

output "kube_config" {
  description = "AKS kubeconfig file content"
  value       = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive   = true
}

output "kubelet_identity" {
  description = "Kubelet managed identity"
  value = {
    client_id   = azurerm_kubernetes_cluster.main.kubelet_identity[0].client_id
    object_id   = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
    resource_id = azurerm_kubernetes_cluster.main.kubelet_identity[0].user_assigned_identity_id
  }
}

output "oidc_issuer_url" {
  description = "OIDC issuer URL for workload identity"
  value       = azurerm_kubernetes_cluster.main.oidc_issuer_url
}

# -----------------------------------------------------------------------------
# Container Registry
# -----------------------------------------------------------------------------

output "acr_name" {
  description = "Azure Container Registry name"
  value       = azurerm_container_registry.main.name
}

output "acr_login_server" {
  description = "Azure Container Registry login server"
  value       = azurerm_container_registry.main.login_server
}

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------

output "postgresql_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = var.enable_postgresql ? azurerm_postgresql_flexible_server.main[0].fqdn : null
}

output "postgresql_admin_login" {
  description = "PostgreSQL admin username"
  value       = var.enable_postgresql ? azurerm_postgresql_flexible_server.main[0].administrator_login : null
}

# -----------------------------------------------------------------------------
# Redis
# -----------------------------------------------------------------------------

output "redis_hostname" {
  description = "Redis cache hostname"
  value       = var.enable_redis ? azurerm_redis_cache.main[0].hostname : null
}

output "redis_ssl_port" {
  description = "Redis SSL port"
  value       = var.enable_redis ? azurerm_redis_cache.main[0].ssl_port : null
}

output "redis_primary_access_key" {
  description = "Redis primary access key"
  value       = var.enable_redis ? azurerm_redis_cache.main[0].primary_access_key : null
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Storage
# -----------------------------------------------------------------------------

output "storage_account_name" {
  description = "Storage account name"
  value       = azurerm_storage_account.artifacts.name
}

output "storage_account_primary_connection_string" {
  description = "Storage account primary connection string"
  value       = azurerm_storage_account.artifacts.primary_connection_string
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Monitoring
# -----------------------------------------------------------------------------

output "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID"
  value       = azurerm_log_analytics_workspace.main.id
}

output "application_insights_connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

output "application_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Key Vault
# -----------------------------------------------------------------------------

output "key_vault_id" {
  description = "Key Vault ID"
  value       = azurerm_key_vault.main.id
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

# -----------------------------------------------------------------------------
# Networking
# -----------------------------------------------------------------------------

output "vnet_id" {
  description = "Virtual Network ID"
  value       = azurerm_virtual_network.main.id
}

output "aks_subnet_id" {
  description = "AKS subnet ID"
  value       = azurerm_subnet.aks.id
}

# -----------------------------------------------------------------------------
# kubectl Configuration Command
# -----------------------------------------------------------------------------

output "configure_kubectl" {
  description = "Azure CLI command to configure kubectl"
  value       = "az aks get-credentials --resource-group ${azurerm_resource_group.main.name} --name ${azurerm_kubernetes_cluster.main.name} --overwrite-existing"
}

# -----------------------------------------------------------------------------
# Docker Login Command
# -----------------------------------------------------------------------------

output "docker_login_command" {
  description = "Command to login to Azure Container Registry"
  value       = "az acr login --name ${azurerm_container_registry.main.name}"
}
