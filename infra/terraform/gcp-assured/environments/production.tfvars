# =============================================================================
# Optimal Platform - GCP Assured Workloads Production Environment
# FedRAMP High / IL4-IL5 Configuration
# =============================================================================

# -----------------------------------------------------------------------------
# General Configuration
# -----------------------------------------------------------------------------

project_id  = "optimal-production"
region      = "us-central1"
zones       = ["us-central1-a", "us-central1-b", "us-central1-c"]
environment = "production"
owner       = "optimal-security-team"

# -----------------------------------------------------------------------------
# Assured Workloads
# -----------------------------------------------------------------------------

enable_assured_workloads    = true
organization_id             = ""  # Set to your GCP org ID
billing_account             = ""  # Set to your billing account
assured_workloads_folder_id = ""  # Set to your Assured Workloads folder ID

# -----------------------------------------------------------------------------
# Kubernetes
# -----------------------------------------------------------------------------

kubernetes_version = "1.29"

# -----------------------------------------------------------------------------
# Application VPC CIDRs
# -----------------------------------------------------------------------------

app_vpc_cidr_primary   = "10.0.0.0/20"
app_vpc_cidr_gke_nodes = "10.0.16.0/20"
app_vpc_cidr_pods      = "10.4.0.0/14"
app_vpc_cidr_services  = "10.0.32.0/20"

# -----------------------------------------------------------------------------
# Monitoring VPC CIDRs
# -----------------------------------------------------------------------------

mon_vpc_cidr_primary   = "10.1.0.0/20"
mon_vpc_cidr_gke_nodes = "10.1.16.0/20"
mon_vpc_cidr_pods      = "10.8.0.0/14"
mon_vpc_cidr_services  = "10.1.32.0/20"

# -----------------------------------------------------------------------------
# Security VPC CIDRs
# -----------------------------------------------------------------------------

sec_vpc_cidr_primary   = "10.2.0.0/20"
sec_vpc_cidr_gke_nodes = "10.2.16.0/20"
sec_vpc_cidr_pods      = "10.12.0.0/14"
sec_vpc_cidr_services  = "10.2.32.0/20"

# -----------------------------------------------------------------------------
# Management VPC CIDRs
# -----------------------------------------------------------------------------

mgmt_vpc_cidr_primary   = "10.3.0.0/20"
mgmt_vpc_cidr_gke_nodes = "10.3.16.0/20"
mgmt_vpc_cidr_bastion   = "10.3.48.0/24"
mgmt_vpc_cidr_pods      = "10.16.0.0/14"
mgmt_vpc_cidr_services  = "10.3.32.0/20"

# -----------------------------------------------------------------------------
# Node Pool Machine Types (Production sizing)
# -----------------------------------------------------------------------------

app_system_node_type   = "n2-standard-4"
app_workload_node_type = "n2-standard-8"
mon_node_type          = "n2-standard-8"
sec_node_type          = "n2-standard-4"
mgmt_node_type         = "n2-standard-4"

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------

# Add your admin CIDR ranges here
authorized_admin_cidrs = []

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------

enable_cloud_sql = true
cloud_sql_tier   = "db-custom-4-16384"  # 4 vCPU, 16GB RAM
# db_password is set via TF_VAR_db_password environment variable

# -----------------------------------------------------------------------------
# Redis
# -----------------------------------------------------------------------------

enable_memorystore   = true
redis_memory_size_gb = 8

# -----------------------------------------------------------------------------
# Domain
# -----------------------------------------------------------------------------

domain_name = "gooptimal.io"

subdomains = {
  portal   = "portal"
  keycloak = "auth"
  gitlab   = "gitlab"
  harbor   = "harbor"
  grafana  = "grafana"
  argocd   = "argocd"
}
