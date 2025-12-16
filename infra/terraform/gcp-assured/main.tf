# =============================================================================
# Optimal Platform - GCP Assured Workloads (FedRAMP High)
# Multi-VPC Architecture for IL4-IL5 Compliance
# =============================================================================

terraform {
  required_version = ">= 1.5"

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
    bucket = "optimal-terraform-state"
    prefix = "gcp-assured/fedramp-high"
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

# =============================================================================
# Local Variables
# =============================================================================

locals {
  env_prefix = "optimal-${var.environment}"

  # VPC Names
  application_vpc_name = "${local.env_prefix}-app-vpc"
  monitoring_vpc_name  = "${local.env_prefix}-mon-vpc"
  security_vpc_name    = "${local.env_prefix}-sec-vpc"
  management_vpc_name  = "${local.env_prefix}-mgmt-vpc"

  # Common labels for FedRAMP compliance
  labels = {
    project           = "optimal-platform"
    environment       = var.environment
    managed_by        = "terraform"
    compliance        = "fedramp-high"
    data_classification = "cui"
    owner             = var.owner
  }

  # FedRAMP High approved regions
  approved_regions = [
    "us-central1",
    "us-east1",
    "us-east4",
    "us-west1",
    "us-west2"
  ]
}

# =============================================================================
# Enable Required APIs
# =============================================================================

resource "google_project_service" "required_apis" {
  for_each = toset([
    "assuredworkloads.googleapis.com",
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
    "servicenetworking.googleapis.com",
    "cloudkms.googleapis.com",
    "accesscontextmanager.googleapis.com",
    "orgpolicy.googleapis.com",
    "securitycenter.googleapis.com",
    "binaryauthorization.googleapis.com",
    "containerscanning.googleapis.com",
  ])

  project = var.project_id
  service = each.key

  disable_dependent_services = false
  disable_on_destroy         = false
}

# =============================================================================
# Assured Workloads Environment
# =============================================================================

resource "google_assured_workloads_workload" "fedramp_high" {
  count = var.enable_assured_workloads ? 1 : 0

  compliance_regime = "FEDRAMP_HIGH"
  display_name      = "Optimal Platform FedRAMP High"
  location          = var.region
  organization      = var.organization_id
  billing_account   = var.billing_account

  provisioned_resources_parent = "folders/${var.assured_workloads_folder_id}"

  resource_settings {
    resource_type = "CONSUMER_FOLDER"
  }

  labels = local.labels

  depends_on = [google_project_service.required_apis]
}

# =============================================================================
# Cloud KMS for Encryption
# =============================================================================

resource "google_kms_key_ring" "optimal" {
  project  = var.project_id
  name     = "${local.env_prefix}-keyring"
  location = var.region

  depends_on = [google_project_service.required_apis]
}

resource "google_kms_crypto_key" "gke" {
  name            = "${local.env_prefix}-gke-key"
  key_ring        = google_kms_key_ring.optimal.id
  rotation_period = "7776000s" # 90 days

  version_template {
    algorithm        = "GOOGLE_SYMMETRIC_ENCRYPTION"
    protection_level = var.environment == "production" ? "HSM" : "SOFTWARE"
  }

  labels = local.labels
}

resource "google_kms_crypto_key" "storage" {
  name            = "${local.env_prefix}-storage-key"
  key_ring        = google_kms_key_ring.optimal.id
  rotation_period = "7776000s"

  version_template {
    algorithm        = "GOOGLE_SYMMETRIC_ENCRYPTION"
    protection_level = var.environment == "production" ? "HSM" : "SOFTWARE"
  }

  labels = local.labels
}

# =============================================================================
# VPCs - Multi-VPC Architecture
# =============================================================================

# Application VPC - Optimal Platform, GitLab, Harbor, ArgoCD
module "application_vpc" {
  source  = "terraform-google-modules/network/google"
  version = "~> 9.0"

  project_id   = var.project_id
  network_name = local.application_vpc_name
  routing_mode = "GLOBAL"
  description  = "Application VPC for Optimal Platform workloads"

  subnets = [
    {
      subnet_name           = "${local.env_prefix}-app-primary"
      subnet_ip             = var.app_vpc_cidr_primary
      subnet_region         = var.region
      subnet_private_access = true
      subnet_flow_logs      = true
      subnet_flow_logs_sampling = "0.5"
      subnet_flow_logs_metadata = "INCLUDE_ALL_METADATA"
    },
    {
      subnet_name           = "${local.env_prefix}-app-gke-nodes"
      subnet_ip             = var.app_vpc_cidr_gke_nodes
      subnet_region         = var.region
      subnet_private_access = true
      subnet_flow_logs      = true
    }
  ]

  secondary_ranges = {
    "${local.env_prefix}-app-gke-nodes" = [
      {
        range_name    = "pods"
        ip_cidr_range = var.app_vpc_cidr_pods
      },
      {
        range_name    = "services"
        ip_cidr_range = var.app_vpc_cidr_services
      }
    ]
  }

  depends_on = [google_project_service.required_apis]
}

# Monitoring VPC - Grafana, Prometheus, ELK/OpenSearch
module "monitoring_vpc" {
  source  = "terraform-google-modules/network/google"
  version = "~> 9.0"

  project_id   = var.project_id
  network_name = local.monitoring_vpc_name
  routing_mode = "GLOBAL"
  description  = "Monitoring VPC for observability stack"

  subnets = [
    {
      subnet_name           = "${local.env_prefix}-mon-primary"
      subnet_ip             = var.mon_vpc_cidr_primary
      subnet_region         = var.region
      subnet_private_access = true
      subnet_flow_logs      = true
      subnet_flow_logs_sampling = "0.5"
      subnet_flow_logs_metadata = "INCLUDE_ALL_METADATA"
    },
    {
      subnet_name           = "${local.env_prefix}-mon-gke-nodes"
      subnet_ip             = var.mon_vpc_cidr_gke_nodes
      subnet_region         = var.region
      subnet_private_access = true
      subnet_flow_logs      = true
    }
  ]

  secondary_ranges = {
    "${local.env_prefix}-mon-gke-nodes" = [
      {
        range_name    = "pods"
        ip_cidr_range = var.mon_vpc_cidr_pods
      },
      {
        range_name    = "services"
        ip_cidr_range = var.mon_vpc_cidr_services
      }
    ]
  }

  depends_on = [google_project_service.required_apis]
}

# Security VPC - Falco, Kyverno, Trivy, Security Scanning
module "security_vpc" {
  source  = "terraform-google-modules/network/google"
  version = "~> 9.0"

  project_id   = var.project_id
  network_name = local.security_vpc_name
  routing_mode = "GLOBAL"
  description  = "Security VPC for security tools and scanning"

  subnets = [
    {
      subnet_name           = "${local.env_prefix}-sec-primary"
      subnet_ip             = var.sec_vpc_cidr_primary
      subnet_region         = var.region
      subnet_private_access = true
      subnet_flow_logs      = true
      subnet_flow_logs_sampling = "1.0"
      subnet_flow_logs_metadata = "INCLUDE_ALL_METADATA"
    },
    {
      subnet_name           = "${local.env_prefix}-sec-gke-nodes"
      subnet_ip             = var.sec_vpc_cidr_gke_nodes
      subnet_region         = var.region
      subnet_private_access = true
      subnet_flow_logs      = true
    }
  ]

  secondary_ranges = {
    "${local.env_prefix}-sec-gke-nodes" = [
      {
        range_name    = "pods"
        ip_cidr_range = var.sec_vpc_cidr_pods
      },
      {
        range_name    = "services"
        ip_cidr_range = var.sec_vpc_cidr_services
      }
    ]
  }

  depends_on = [google_project_service.required_apis]
}

# Management VPC - Keycloak, Bastion, Admin Tools
module "management_vpc" {
  source  = "terraform-google-modules/network/google"
  version = "~> 9.0"

  project_id   = var.project_id
  network_name = local.management_vpc_name
  routing_mode = "GLOBAL"
  description  = "Management VPC for identity and admin access"

  subnets = [
    {
      subnet_name           = "${local.env_prefix}-mgmt-primary"
      subnet_ip             = var.mgmt_vpc_cidr_primary
      subnet_region         = var.region
      subnet_private_access = true
      subnet_flow_logs      = true
      subnet_flow_logs_sampling = "1.0"
      subnet_flow_logs_metadata = "INCLUDE_ALL_METADATA"
    },
    {
      subnet_name           = "${local.env_prefix}-mgmt-gke-nodes"
      subnet_ip             = var.mgmt_vpc_cidr_gke_nodes
      subnet_region         = var.region
      subnet_private_access = true
      subnet_flow_logs      = true
    },
    {
      subnet_name           = "${local.env_prefix}-mgmt-bastion"
      subnet_ip             = var.mgmt_vpc_cidr_bastion
      subnet_region         = var.region
      subnet_private_access = true
    }
  ]

  secondary_ranges = {
    "${local.env_prefix}-mgmt-gke-nodes" = [
      {
        range_name    = "pods"
        ip_cidr_range = var.mgmt_vpc_cidr_pods
      },
      {
        range_name    = "services"
        ip_cidr_range = var.mgmt_vpc_cidr_services
      }
    ]
  }

  depends_on = [google_project_service.required_apis]
}

# =============================================================================
# Cloud NAT for each VPC
# =============================================================================

module "cloud_nat_app" {
  source  = "terraform-google-modules/cloud-nat/google"
  version = "~> 5.0"

  project_id    = var.project_id
  region        = var.region
  router        = "${local.application_vpc_name}-router"
  network       = module.application_vpc.network_self_link
  create_router = true
}

module "cloud_nat_mon" {
  source  = "terraform-google-modules/cloud-nat/google"
  version = "~> 5.0"

  project_id    = var.project_id
  region        = var.region
  router        = "${local.monitoring_vpc_name}-router"
  network       = module.monitoring_vpc.network_self_link
  create_router = true
}

module "cloud_nat_sec" {
  source  = "terraform-google-modules/cloud-nat/google"
  version = "~> 5.0"

  project_id    = var.project_id
  region        = var.region
  router        = "${local.security_vpc_name}-router"
  network       = module.security_vpc.network_self_link
  create_router = true
}

module "cloud_nat_mgmt" {
  source  = "terraform-google-modules/cloud-nat/google"
  version = "~> 5.0"

  project_id    = var.project_id
  region        = var.region
  router        = "${local.management_vpc_name}-router"
  network       = module.management_vpc.network_self_link
  create_router = true
}

# =============================================================================
# VPC Peering between VPCs
# =============================================================================

# App <-> Management (for Keycloak SSO)
resource "google_compute_network_peering" "app_to_mgmt" {
  name         = "app-to-mgmt"
  network      = module.application_vpc.network_self_link
  peer_network = module.management_vpc.network_self_link

  export_custom_routes = true
  import_custom_routes = true
}

resource "google_compute_network_peering" "mgmt_to_app" {
  name         = "mgmt-to-app"
  network      = module.management_vpc.network_self_link
  peer_network = module.application_vpc.network_self_link

  export_custom_routes = true
  import_custom_routes = true

  depends_on = [google_compute_network_peering.app_to_mgmt]
}

# App <-> Monitoring (for metrics collection)
resource "google_compute_network_peering" "app_to_mon" {
  name         = "app-to-mon"
  network      = module.application_vpc.network_self_link
  peer_network = module.monitoring_vpc.network_self_link

  export_custom_routes = true
  import_custom_routes = true

  depends_on = [google_compute_network_peering.mgmt_to_app]
}

resource "google_compute_network_peering" "mon_to_app" {
  name         = "mon-to-app"
  network      = module.monitoring_vpc.network_self_link
  peer_network = module.application_vpc.network_self_link

  export_custom_routes = true
  import_custom_routes = true

  depends_on = [google_compute_network_peering.app_to_mon]
}

# App <-> Security (for security scanning)
resource "google_compute_network_peering" "app_to_sec" {
  name         = "app-to-sec"
  network      = module.application_vpc.network_self_link
  peer_network = module.security_vpc.network_self_link

  export_custom_routes = true
  import_custom_routes = true

  depends_on = [google_compute_network_peering.mon_to_app]
}

resource "google_compute_network_peering" "sec_to_app" {
  name         = "sec-to-app"
  network      = module.security_vpc.network_self_link
  peer_network = module.application_vpc.network_self_link

  export_custom_routes = true
  import_custom_routes = true

  depends_on = [google_compute_network_peering.app_to_sec]
}

# Security <-> Monitoring (for security alerts)
resource "google_compute_network_peering" "sec_to_mon" {
  name         = "sec-to-mon"
  network      = module.security_vpc.network_self_link
  peer_network = module.monitoring_vpc.network_self_link

  export_custom_routes = true
  import_custom_routes = true

  depends_on = [google_compute_network_peering.sec_to_app]
}

resource "google_compute_network_peering" "mon_to_sec" {
  name         = "mon-to-sec"
  network      = module.monitoring_vpc.network_self_link
  peer_network = module.security_vpc.network_self_link

  export_custom_routes = true
  import_custom_routes = true

  depends_on = [google_compute_network_peering.sec_to_mon]
}

# Management <-> Monitoring (for admin dashboards)
resource "google_compute_network_peering" "mgmt_to_mon" {
  name         = "mgmt-to-mon"
  network      = module.management_vpc.network_self_link
  peer_network = module.monitoring_vpc.network_self_link

  export_custom_routes = true
  import_custom_routes = true

  depends_on = [google_compute_network_peering.mon_to_sec]
}

resource "google_compute_network_peering" "mon_to_mgmt" {
  name         = "mon-to-mgmt"
  network      = module.monitoring_vpc.network_self_link
  peer_network = module.management_vpc.network_self_link

  export_custom_routes = true
  import_custom_routes = true

  depends_on = [google_compute_network_peering.mgmt_to_mon]
}

# Management <-> Security (for security admin)
resource "google_compute_network_peering" "mgmt_to_sec" {
  name         = "mgmt-to-sec"
  network      = module.management_vpc.network_self_link
  peer_network = module.security_vpc.network_self_link

  export_custom_routes = true
  import_custom_routes = true

  depends_on = [google_compute_network_peering.mon_to_mgmt]
}

resource "google_compute_network_peering" "sec_to_mgmt" {
  name         = "sec-to-mgmt"
  network      = module.security_vpc.network_self_link
  peer_network = module.management_vpc.network_self_link

  export_custom_routes = true
  import_custom_routes = true

  depends_on = [google_compute_network_peering.mgmt_to_sec]
}
