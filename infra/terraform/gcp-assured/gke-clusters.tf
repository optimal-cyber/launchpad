# =============================================================================
# GKE Clusters - Multi-VPC Architecture
# Each VPC gets its own GKE cluster for isolation
# =============================================================================

# =============================================================================
# Application GKE Cluster
# Hosts: Optimal Platform, GitLab, Harbor, ArgoCD
# =============================================================================

module "gke_application" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/private-cluster"
  version = "~> 29.0"

  project_id = var.project_id
  name       = "${local.env_prefix}-app-cluster"
  region     = var.region
  zones      = var.zones

  network           = module.application_vpc.network_name
  subnetwork        = "${local.env_prefix}-app-gke-nodes"
  ip_range_pods     = "pods"
  ip_range_services = "services"

  # Cluster Configuration
  kubernetes_version      = var.kubernetes_version
  release_channel         = "REGULAR"
  enable_private_nodes    = true
  enable_private_endpoint = var.environment == "production"
  master_ipv4_cidr_block  = "172.16.0.0/28"

  # Security - FedRAMP High
  enable_shielded_nodes       = true
  enable_binary_authorization = true

  # Encryption at rest with CMEK
  database_encryption = [{
    state    = "ENCRYPTED"
    key_name = google_kms_crypto_key.gke.id
  }]

  master_authorized_networks = var.environment == "production" ? [
    {
      cidr_block   = var.mgmt_vpc_cidr_bastion
      display_name = "Bastion hosts"
    }
  ] : [
    {
      cidr_block   = "0.0.0.0/0"
      display_name = "All networks (dev only)"
    }
  ]

  # Features
  horizontal_pod_autoscaling      = true
  enable_vertical_pod_autoscaling = true
  http_load_balancing             = true
  network_policy                  = true
  filestore_csi_driver            = true
  gce_pd_csi_driver               = true
  enable_cost_allocation          = true

  # Workload Identity for secure GCP integration
  workload_identity_config = [{
    workload_pool = "${var.project_id}.svc.id.goog"
  }]

  # Node pools
  remove_default_node_pool = true

  node_pools = [
    {
      name               = "system"
      machine_type       = var.app_system_node_type
      node_locations     = join(",", var.zones)
      min_count          = 1
      max_count          = 3
      local_ssd_count    = 0
      spot               = false
      disk_size_gb       = 100
      disk_type          = "pd-ssd"
      image_type         = "COS_CONTAINERD"
      enable_gcfs        = false
      enable_gvnic       = true
      auto_repair        = true
      auto_upgrade       = true
      preemptible        = false
    },
    {
      name               = "optimal-portal"
      machine_type       = var.app_workload_node_type
      node_locations     = join(",", var.zones)
      min_count          = 2
      max_count          = 10
      local_ssd_count    = 0
      spot               = var.environment != "production"
      disk_size_gb       = 100
      disk_type          = "pd-ssd"
      image_type         = "COS_CONTAINERD"
      enable_gcfs        = false
      enable_gvnic       = true
      auto_repair        = true
      auto_upgrade       = true
      preemptible        = false
    },
    {
      name               = "gitlab"
      machine_type       = "n2-standard-4"
      node_locations     = join(",", var.zones)
      min_count          = 1
      max_count          = 5
      local_ssd_count    = 0
      spot               = false
      disk_size_gb       = 200
      disk_type          = "pd-ssd"
      image_type         = "COS_CONTAINERD"
      enable_gcfs        = false
      enable_gvnic       = true
      auto_repair        = true
      auto_upgrade       = true
      preemptible        = false
    },
    {
      name               = "harbor"
      machine_type       = "n2-standard-2"
      node_locations     = join(",", var.zones)
      min_count          = 1
      max_count          = 3
      local_ssd_count    = 0
      spot               = false
      disk_size_gb       = 500
      disk_type          = "pd-ssd"
      image_type         = "COS_CONTAINERD"
      enable_gcfs        = false
      enable_gvnic       = true
      auto_repair        = true
      auto_upgrade       = true
      preemptible        = false
    }
  ]

  node_pools_oauth_scopes = {
    all = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/trace.append",
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }

  node_pools_labels = {
    all = local.labels
    system = { role = "system" }
    optimal-portal = { role = "application", app = "optimal" }
    gitlab = { role = "application", app = "gitlab" }
    harbor = { role = "application", app = "harbor" }
  }

  node_pools_taints = {
    all    = []
    system = []
    optimal-portal = []
    gitlab = [
      {
        key    = "app"
        value  = "gitlab"
        effect = "NO_SCHEDULE"
      }
    ]
    harbor = [
      {
        key    = "app"
        value  = "harbor"
        effect = "NO_SCHEDULE"
      }
    ]
  }

  cluster_resource_labels = local.labels

  depends_on = [
    google_project_service.required_apis,
    module.application_vpc,
    google_kms_crypto_key.gke,
  ]
}

# =============================================================================
# Monitoring GKE Cluster
# Hosts: Grafana, Prometheus, OpenSearch/ELK, Alertmanager
# =============================================================================

module "gke_monitoring" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/private-cluster"
  version = "~> 29.0"

  project_id = var.project_id
  name       = "${local.env_prefix}-mon-cluster"
  region     = var.region
  zones      = var.zones

  network           = module.monitoring_vpc.network_name
  subnetwork        = "${local.env_prefix}-mon-gke-nodes"
  ip_range_pods     = "pods"
  ip_range_services = "services"

  kubernetes_version      = var.kubernetes_version
  release_channel         = "REGULAR"
  enable_private_nodes    = true
  enable_private_endpoint = var.environment == "production"
  master_ipv4_cidr_block  = "172.16.1.0/28"

  enable_shielded_nodes       = true
  enable_binary_authorization = true

  database_encryption = [{
    state    = "ENCRYPTED"
    key_name = google_kms_crypto_key.gke.id
  }]

  master_authorized_networks = var.environment == "production" ? [
    {
      cidr_block   = var.mgmt_vpc_cidr_bastion
      display_name = "Bastion hosts"
    }
  ] : [
    {
      cidr_block   = "0.0.0.0/0"
      display_name = "All networks (dev only)"
    }
  ]

  horizontal_pod_autoscaling      = true
  enable_vertical_pod_autoscaling = true
  http_load_balancing             = true
  network_policy                  = true
  filestore_csi_driver            = true
  gce_pd_csi_driver               = true

  workload_identity_config = [{
    workload_pool = "${var.project_id}.svc.id.goog"
  }]

  remove_default_node_pool = true

  node_pools = [
    {
      name               = "monitoring"
      machine_type       = var.mon_node_type
      node_locations     = join(",", var.zones)
      min_count          = 2
      max_count          = 6
      local_ssd_count    = 0
      spot               = false
      disk_size_gb       = 200
      disk_type          = "pd-ssd"
      image_type         = "COS_CONTAINERD"
      enable_gcfs        = false
      enable_gvnic       = true
      auto_repair        = true
      auto_upgrade       = true
      preemptible        = false
    },
    {
      name               = "elasticsearch"
      machine_type       = "n2-highmem-4"
      node_locations     = join(",", var.zones)
      min_count          = 3
      max_count          = 9
      local_ssd_count    = 2
      spot               = false
      disk_size_gb       = 500
      disk_type          = "pd-ssd"
      image_type         = "COS_CONTAINERD"
      enable_gcfs        = false
      enable_gvnic       = true
      auto_repair        = true
      auto_upgrade       = true
      preemptible        = false
    }
  ]

  node_pools_oauth_scopes = {
    all = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/trace.append",
    ]
  }

  node_pools_labels = {
    all = local.labels
    monitoring = { role = "monitoring" }
    elasticsearch = { role = "logging", app = "elasticsearch" }
  }

  node_pools_taints = {
    all = []
    monitoring = []
    elasticsearch = [
      {
        key    = "app"
        value  = "elasticsearch"
        effect = "NO_SCHEDULE"
      }
    ]
  }

  cluster_resource_labels = local.labels

  depends_on = [
    google_project_service.required_apis,
    module.monitoring_vpc,
    google_kms_crypto_key.gke,
  ]
}

# =============================================================================
# Security GKE Cluster
# Hosts: Falco, Kyverno, Trivy, Vulnerability Scanners
# =============================================================================

module "gke_security" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/private-cluster"
  version = "~> 29.0"

  project_id = var.project_id
  name       = "${local.env_prefix}-sec-cluster"
  region     = var.region
  zones      = var.zones

  network           = module.security_vpc.network_name
  subnetwork        = "${local.env_prefix}-sec-gke-nodes"
  ip_range_pods     = "pods"
  ip_range_services = "services"

  kubernetes_version      = var.kubernetes_version
  release_channel         = "STABLE" # More conservative for security tools
  enable_private_nodes    = true
  enable_private_endpoint = var.environment == "production"
  master_ipv4_cidr_block  = "172.16.2.0/28"

  enable_shielded_nodes       = true
  enable_binary_authorization = true

  database_encryption = [{
    state    = "ENCRYPTED"
    key_name = google_kms_crypto_key.gke.id
  }]

  master_authorized_networks = var.environment == "production" ? [
    {
      cidr_block   = var.mgmt_vpc_cidr_bastion
      display_name = "Bastion hosts"
    }
  ] : [
    {
      cidr_block   = "0.0.0.0/0"
      display_name = "All networks (dev only)"
    }
  ]

  horizontal_pod_autoscaling      = true
  enable_vertical_pod_autoscaling = true
  http_load_balancing             = true
  network_policy                  = true
  gce_pd_csi_driver               = true

  workload_identity_config = [{
    workload_pool = "${var.project_id}.svc.id.goog"
  }]

  remove_default_node_pool = true

  node_pools = [
    {
      name               = "security-tools"
      machine_type       = var.sec_node_type
      node_locations     = join(",", var.zones)
      min_count          = 2
      max_count          = 5
      local_ssd_count    = 0
      spot               = false
      disk_size_gb       = 100
      disk_type          = "pd-ssd"
      image_type         = "COS_CONTAINERD"
      enable_gcfs        = false
      enable_gvnic       = true
      auto_repair        = true
      auto_upgrade       = true
      preemptible        = false
    },
    {
      name               = "scanners"
      machine_type       = "n2-standard-4"
      node_locations     = join(",", var.zones)
      min_count          = 1
      max_count          = 10
      local_ssd_count    = 0
      spot               = var.environment != "production"
      disk_size_gb       = 200
      disk_type          = "pd-ssd"
      image_type         = "COS_CONTAINERD"
      enable_gcfs        = false
      enable_gvnic       = true
      auto_repair        = true
      auto_upgrade       = true
      preemptible        = false
    }
  ]

  node_pools_oauth_scopes = {
    all = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }

  node_pools_labels = {
    all = local.labels
    security-tools = { role = "security" }
    scanners = { role = "scanner" }
  }

  node_pools_taints = {
    all = []
    security-tools = []
    scanners = []
  }

  cluster_resource_labels = local.labels

  depends_on = [
    google_project_service.required_apis,
    module.security_vpc,
    google_kms_crypto_key.gke,
  ]
}

# =============================================================================
# Management GKE Cluster
# Hosts: Keycloak, Admin Tools, Bastion Services
# =============================================================================

module "gke_management" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/private-cluster"
  version = "~> 29.0"

  project_id = var.project_id
  name       = "${local.env_prefix}-mgmt-cluster"
  region     = var.region
  zones      = var.zones

  network           = module.management_vpc.network_name
  subnetwork        = "${local.env_prefix}-mgmt-gke-nodes"
  ip_range_pods     = "pods"
  ip_range_services = "services"

  kubernetes_version      = var.kubernetes_version
  release_channel         = "STABLE"
  enable_private_nodes    = true
  enable_private_endpoint = var.environment == "production"
  master_ipv4_cidr_block  = "172.16.3.0/28"

  enable_shielded_nodes       = true
  enable_binary_authorization = true

  database_encryption = [{
    state    = "ENCRYPTED"
    key_name = google_kms_crypto_key.gke.id
  }]

  master_authorized_networks = var.environment == "production" ? [
    {
      cidr_block   = var.mgmt_vpc_cidr_bastion
      display_name = "Bastion hosts"
    }
  ] : [
    {
      cidr_block   = "0.0.0.0/0"
      display_name = "All networks (dev only)"
    }
  ]

  horizontal_pod_autoscaling      = true
  enable_vertical_pod_autoscaling = true
  http_load_balancing             = true
  network_policy                  = true
  gce_pd_csi_driver               = true

  workload_identity_config = [{
    workload_pool = "${var.project_id}.svc.id.goog"
  }]

  remove_default_node_pool = true

  node_pools = [
    {
      name               = "management"
      machine_type       = var.mgmt_node_type
      node_locations     = join(",", var.zones)
      min_count          = 2
      max_count          = 4
      local_ssd_count    = 0
      spot               = false
      disk_size_gb       = 100
      disk_type          = "pd-ssd"
      image_type         = "COS_CONTAINERD"
      enable_gcfs        = false
      enable_gvnic       = true
      auto_repair        = true
      auto_upgrade       = true
      preemptible        = false
    },
    {
      name               = "keycloak"
      machine_type       = "n2-standard-2"
      node_locations     = join(",", var.zones)
      min_count          = 2
      max_count          = 4
      local_ssd_count    = 0
      spot               = false
      disk_size_gb       = 50
      disk_type          = "pd-ssd"
      image_type         = "COS_CONTAINERD"
      enable_gcfs        = false
      enable_gvnic       = true
      auto_repair        = true
      auto_upgrade       = true
      preemptible        = false
    }
  ]

  node_pools_oauth_scopes = {
    all = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }

  node_pools_labels = {
    all = local.labels
    management = { role = "management" }
    keycloak = { role = "identity", app = "keycloak" }
  }

  node_pools_taints = {
    all = []
    management = []
    keycloak = [
      {
        key    = "app"
        value  = "keycloak"
        effect = "NO_SCHEDULE"
      }
    ]
  }

  cluster_resource_labels = local.labels

  depends_on = [
    google_project_service.required_apis,
    module.management_vpc,
    google_kms_crypto_key.gke,
  ]
}
