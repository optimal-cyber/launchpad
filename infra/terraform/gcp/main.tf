# =============================================================================
# Optimal Platform - GCP Infrastructure (GKE)
# Enterprise-grade Kubernetes deployment for Google Cloud
# =============================================================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "gcs" {
    bucket = "optimal-platform-terraform-state"
    prefix = "gcp/gke"
  }
}

# =============================================================================
# Provider Configuration
# =============================================================================

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = "https://${module.gke.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(module.gke.ca_certificate)
}

provider "helm" {
  kubernetes {
    host                   = "https://${module.gke.endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(module.gke.ca_certificate)
  }
}

# =============================================================================
# Local Variables
# =============================================================================

locals {
  cluster_name = "optimal-${var.environment}"
  network_name = "${local.cluster_name}-vpc"

  labels = {
    project     = "optimal-platform"
    environment = var.environment
    managed_by  = "terraform"
    owner       = var.owner
  }
}

# =============================================================================
# Enable Required APIs
# =============================================================================

resource "google_project_service" "required_apis" {
  for_each = toset([
    "container.googleapis.com",
    "compute.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "certificatemanager.googleapis.com",
  ])

  project = var.project_id
  service = each.key

  disable_dependent_services = false
  disable_on_destroy         = false
}

# =============================================================================
# VPC Network
# =============================================================================

module "vpc" {
  source  = "terraform-google-modules/network/google"
  version = "~> 9.0"

  project_id   = var.project_id
  network_name = local.network_name
  routing_mode = "GLOBAL"

  subnets = [
    {
      subnet_name           = "${local.cluster_name}-subnet"
      subnet_ip             = "10.0.0.0/20"
      subnet_region         = var.region
      subnet_private_access = true
    }
  ]

  secondary_ranges = {
    "${local.cluster_name}-subnet" = [
      {
        range_name    = "${local.cluster_name}-pods"
        ip_cidr_range = "10.1.0.0/16"
      },
      {
        range_name    = "${local.cluster_name}-services"
        ip_cidr_range = "10.2.0.0/20"
      }
    ]
  }

  depends_on = [google_project_service.required_apis]
}

# =============================================================================
# Cloud NAT (for private nodes)
# =============================================================================

module "cloud_nat" {
  source  = "terraform-google-modules/cloud-nat/google"
  version = "~> 5.0"

  project_id    = var.project_id
  region        = var.region
  router        = "${local.cluster_name}-router"
  network       = module.vpc.network_self_link
  create_router = true
}

# =============================================================================
# GKE Cluster
# =============================================================================

module "gke" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/private-cluster"
  version = "~> 29.0"

  project_id = var.project_id
  name       = local.cluster_name
  region     = var.region
  zones      = var.zones

  network           = module.vpc.network_name
  subnetwork        = "${local.cluster_name}-subnet"
  ip_range_pods     = "${local.cluster_name}-pods"
  ip_range_services = "${local.cluster_name}-services"

  # Cluster Configuration
  kubernetes_version     = var.kubernetes_version
  release_channel        = "REGULAR"
  enable_private_nodes   = true
  enable_private_endpoint = false
  master_ipv4_cidr_block = "172.16.0.0/28"

  # Security
  enable_shielded_nodes = true
  
  master_authorized_networks = [
    {
      cidr_block   = "0.0.0.0/0"
      display_name = "All networks"
    }
  ]

  # Features
  horizontal_pod_autoscaling = true
  enable_vertical_pod_autoscaling = true
  http_load_balancing        = true
  network_policy             = true
  filestore_csi_driver       = true
  gce_pd_csi_driver          = true

  # Workload Identity
  workload_identity_config = [{
    workload_pool = "${var.project_id}.svc.id.goog"
  }]

  # Node pools
  remove_default_node_pool = true

  node_pools = [
    {
      name               = "system-pool"
      machine_type       = var.system_node_machine_type
      node_locations     = join(",", var.zones)
      min_count          = var.system_node_min_count
      max_count          = var.system_node_max_count
      local_ssd_count    = 0
      spot               = false
      disk_size_gb       = 100
      disk_type          = "pd-standard"
      image_type         = "COS_CONTAINERD"
      enable_gcfs        = false
      enable_gvnic       = false
      auto_repair        = true
      auto_upgrade       = true
      preemptible        = false
    },
    {
      name               = "app-pool"
      machine_type       = var.app_node_machine_type
      node_locations     = join(",", var.zones)
      min_count          = var.app_node_min_count
      max_count          = var.app_node_max_count
      local_ssd_count    = 0
      spot               = var.environment != "production"
      disk_size_gb       = 100
      disk_type          = "pd-ssd"
      image_type         = "COS_CONTAINERD"
      enable_gcfs        = false
      enable_gvnic       = false
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
    system-pool = {
      role = "system"
    }
    app-pool = {
      role = "application"
    }
  }

  node_pools_taints = {
    all = []
    system-pool = []
    app-pool    = []
  }

  cluster_resource_labels = local.labels

  depends_on = [
    google_project_service.required_apis,
    module.vpc,
  ]
}

# =============================================================================
# Cloud SQL PostgreSQL
# =============================================================================

module "cloud_sql" {
  source  = "GoogleCloudPlatform/sql-db/google//modules/postgresql"
  version = "~> 18.0"

  count = var.enable_cloud_sql ? 1 : 0

  project_id       = var.project_id
  name             = "${local.cluster_name}-postgres"
  database_version = "POSTGRES_15"
  region           = var.region
  zone             = var.zones[0]
  tier             = var.cloud_sql_tier

  deletion_protection = var.environment == "production"

  ip_configuration = {
    ipv4_enabled        = false
    private_network     = module.vpc.network_self_link
    require_ssl         = true
    allocated_ip_range  = null
    authorized_networks = []
  }

  backup_configuration = {
    enabled                        = true
    start_time                     = "02:00"
    location                       = var.region
    point_in_time_recovery_enabled = var.environment == "production"
    transaction_log_retention_days = var.environment == "production" ? 7 : 3
    retained_backups               = var.environment == "production" ? 30 : 7
    retention_unit                 = "COUNT"
  }

  insights_config = {
    query_insights_enabled  = true
    query_plans_per_minute  = 5
    query_string_length     = 1024
    record_application_tags = true
    record_client_address   = true
  }

  database_flags = [
    {
      name  = "log_temp_files"
      value = "0"
    }
  ]

  user_labels = local.labels

  additional_databases = [
    {
      name      = "optimal"
      charset   = "UTF8"
      collation = "en_US.UTF8"
    },
    {
      name      = "keycloak"
      charset   = "UTF8"
      collation = "en_US.UTF8"
    }
  ]

  additional_users = [
    {
      name     = "optimal_admin"
      password = var.db_password
    }
  ]

  depends_on = [
    google_project_service.required_apis,
    module.vpc,
  ]
}

# =============================================================================
# Memorystore Redis
# =============================================================================

resource "google_redis_instance" "cache" {
  count = var.enable_memorystore ? 1 : 0

  project        = var.project_id
  name           = "${local.cluster_name}-redis"
  region         = var.region
  tier           = var.environment == "production" ? "STANDARD_HA" : "BASIC"
  memory_size_gb = var.redis_memory_size_gb
  redis_version  = "REDIS_7_0"

  authorized_network = module.vpc.network_self_link
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 2
        minutes = 0
      }
    }
  }

  labels = local.labels

  depends_on = [
    google_project_service.required_apis,
    module.vpc,
  ]
}

# =============================================================================
# Artifact Registry
# =============================================================================

resource "google_artifact_registry_repository" "services" {
  for_each = toset([
    "portal",
    "api-gateway",
    "sbom-service",
    "vuln-service",
    "gitlab-listener",
    "worker",
    "runtime-security-agent"
  ])

  project       = var.project_id
  location      = var.region
  repository_id = "optimal-${each.key}"
  description   = "Container images for optimal-platform ${each.key}"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-recent-versions"
    action = "KEEP"
    most_recent_versions {
      keep_count = 30
    }
  }

  cleanup_policies {
    id     = "delete-old-untagged"
    action = "DELETE"
    condition {
      tag_state  = "UNTAGGED"
      older_than = "604800s" # 7 days
    }
  }

  labels = local.labels

  depends_on = [google_project_service.required_apis]
}

# =============================================================================
# GCS Bucket for artifacts
# =============================================================================

resource "google_storage_bucket" "artifacts" {
  project  = var.project_id
  name     = "${local.cluster_name}-artifacts-${var.project_id}"
  location = var.region

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }

  labels = local.labels

  depends_on = [google_project_service.required_apis]
}

# =============================================================================
# Service Accounts for Workload Identity
# =============================================================================

resource "google_service_account" "optimal_platform" {
  project      = var.project_id
  account_id   = "optimal-platform"
  display_name = "Optimal Platform Service Account"
}

resource "google_project_iam_member" "optimal_platform_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/storage.objectViewer",
    "roles/secretmanager.secretAccessor",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.optimal_platform.email}"
}

resource "google_service_account_iam_member" "workload_identity_binding" {
  service_account_id = google_service_account.optimal_platform.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[optimal-system/optimal-platform]"

  depends_on = [module.gke]
}

# =============================================================================
# SSL Certificate (for custom domain)
# =============================================================================

resource "google_certificate_manager_certificate" "main" {
  count = var.domain_name != "" ? 1 : 0

  project  = var.project_id
  name     = "${local.cluster_name}-cert"
  location = "global"

  managed {
    domains = [
      var.domain_name,
      "*.${var.domain_name}"
    ]
  }

  labels = local.labels

  depends_on = [google_project_service.required_apis]
}

# =============================================================================
# Secret Manager (for sensitive configuration)
# =============================================================================

resource "google_secret_manager_secret" "db_password" {
  count = var.enable_cloud_sql ? 1 : 0

  project   = var.project_id
  secret_id = "${local.cluster_name}-db-password"

  replication {
    auto {}
  }

  labels = local.labels

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "db_password" {
  count = var.enable_cloud_sql ? 1 : 0

  secret      = google_secret_manager_secret.db_password[0].id
  secret_data = var.db_password
}

