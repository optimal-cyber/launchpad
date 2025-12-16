# =============================================================================
# Database, IAM, and DNS Resources
# =============================================================================

# =============================================================================
# Cloud SQL PostgreSQL (in Application VPC)
# =============================================================================

resource "google_compute_global_address" "private_ip_range" {
  count = var.enable_cloud_sql ? 1 : 0

  project       = var.project_id
  name          = "${local.env_prefix}-private-ip-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = module.application_vpc.network_self_link
}

resource "google_service_networking_connection" "private_vpc_connection" {
  count = var.enable_cloud_sql ? 1 : 0

  network                 = module.application_vpc.network_self_link
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range[0].name]
}

resource "google_sql_database_instance" "optimal" {
  count = var.enable_cloud_sql ? 1 : 0

  project          = var.project_id
  name             = "${local.env_prefix}-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  deletion_protection = var.environment == "production"

  settings {
    tier              = var.cloud_sql_tier
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = 100
    disk_autoresize   = true

    # FedRAMP High encryption
    disk_autoresize_limit = 500

    ip_configuration {
      ipv4_enabled    = false
      private_network = module.application_vpc.network_self_link
      require_ssl     = true

      ssl_mode = "ENCRYPTED_ONLY"
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      location                       = var.region
      point_in_time_recovery_enabled = var.environment == "production"
      transaction_log_retention_days = var.environment == "production" ? 7 : 3
      backup_retention_settings {
        retained_backups = var.environment == "production" ? 30 : 7
        retention_unit   = "COUNT"
      }
    }

    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 5
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }

    maintenance_window {
      day          = 7 # Sunday
      hour         = 3
      update_track = "stable"
    }

    database_flags {
      name  = "log_temp_files"
      value = "0"
    }

    database_flags {
      name  = "log_lock_waits"
      value = "on"
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    # Audit logging for FedRAMP
    database_flags {
      name  = "log_connections"
      value = "on"
    }

    database_flags {
      name  = "log_disconnections"
      value = "on"
    }

    user_labels = local.labels
  }

  depends_on = [
    google_service_networking_connection.private_vpc_connection,
  ]
}

# Databases
resource "google_sql_database" "optimal" {
  count = var.enable_cloud_sql ? 1 : 0

  project  = var.project_id
  name     = "optimal"
  instance = google_sql_database_instance.optimal[0].name
  charset  = "UTF8"
}

resource "google_sql_database" "keycloak" {
  count = var.enable_cloud_sql ? 1 : 0

  project  = var.project_id
  name     = "keycloak"
  instance = google_sql_database_instance.optimal[0].name
  charset  = "UTF8"
}

resource "google_sql_database" "gitlab" {
  count = var.enable_cloud_sql ? 1 : 0

  project  = var.project_id
  name     = "gitlab"
  instance = google_sql_database_instance.optimal[0].name
  charset  = "UTF8"
}

# Database User
resource "google_sql_user" "optimal_admin" {
  count = var.enable_cloud_sql ? 1 : 0

  project  = var.project_id
  name     = "optimal_admin"
  instance = google_sql_database_instance.optimal[0].name
  password = var.db_password
}

# =============================================================================
# Memorystore Redis (in Application VPC)
# =============================================================================

resource "google_redis_instance" "cache" {
  count = var.enable_memorystore ? 1 : 0

  project        = var.project_id
  name           = "${local.env_prefix}-redis"
  region         = var.region
  tier           = var.environment == "production" ? "STANDARD_HA" : "BASIC"
  memory_size_gb = var.redis_memory_size_gb
  redis_version  = "REDIS_7_0"

  authorized_network = module.application_vpc.network_self_link
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  transit_encryption_mode = "SERVER_AUTHENTICATION"
  auth_enabled            = true

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
    google_service_networking_connection.private_vpc_connection,
  ]
}

# =============================================================================
# Service Accounts for Workload Identity
# =============================================================================

# Optimal Platform Service Account
resource "google_service_account" "optimal_platform" {
  project      = var.project_id
  account_id   = "optimal-platform"
  display_name = "Optimal Platform Service Account"
}

resource "google_project_iam_member" "optimal_platform_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/storage.objectAdmin",
    "roles/secretmanager.secretAccessor",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
    "roles/cloudtrace.agent",
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.optimal_platform.email}"
}

resource "google_service_account_iam_member" "optimal_workload_identity" {
  service_account_id = google_service_account.optimal_platform.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[optimal-system/optimal-platform]"

  depends_on = [module.gke_application]
}

# GitLab Service Account
resource "google_service_account" "gitlab" {
  project      = var.project_id
  account_id   = "gitlab"
  display_name = "GitLab Service Account"
}

resource "google_project_iam_member" "gitlab_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/storage.objectAdmin",
    "roles/artifactregistry.writer",
    "roles/secretmanager.secretAccessor",
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.gitlab.email}"
}

resource "google_service_account_iam_member" "gitlab_workload_identity" {
  service_account_id = google_service_account.gitlab.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[gitlab/gitlab]"

  depends_on = [module.gke_application]
}

# Monitoring Service Account
resource "google_service_account" "monitoring" {
  project      = var.project_id
  account_id   = "monitoring"
  display_name = "Monitoring Stack Service Account"
}

resource "google_project_iam_member" "monitoring_roles" {
  for_each = toset([
    "roles/monitoring.viewer",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
    "roles/cloudtrace.agent",
    "roles/storage.objectViewer",
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.monitoring.email}"
}

resource "google_service_account_iam_member" "monitoring_workload_identity" {
  service_account_id = google_service_account.monitoring.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[monitoring/prometheus]"

  depends_on = [module.gke_monitoring]
}

# Security Service Account
resource "google_service_account" "security" {
  project      = var.project_id
  account_id   = "security-tools"
  display_name = "Security Tools Service Account"
}

resource "google_project_iam_member" "security_roles" {
  for_each = toset([
    "roles/containeranalysis.occurrences.viewer",
    "roles/containeranalysis.notes.viewer",
    "roles/artifactregistry.reader",
    "roles/securitycenter.findingsEditor",
    "roles/logging.logWriter",
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.security.email}"
}

resource "google_service_account_iam_member" "security_workload_identity" {
  service_account_id = google_service_account.security.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[security/trivy-operator]"

  depends_on = [module.gke_security]
}

# =============================================================================
# Artifact Registry
# =============================================================================

resource "google_artifact_registry_repository" "services" {
  for_each = toset([
    "portal",
    "api-gateway",
    "gitlab-listener",
    "optimal-agent",
    "optimal-scanner",
    "keycloak",
  ])

  project       = var.project_id
  location      = var.region
  repository_id = "optimal-${each.key}"
  description   = "Container images for ${each.key}"
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
# GCS Buckets
# =============================================================================

resource "google_storage_bucket" "artifacts" {
  project  = var.project_id
  name     = "${local.env_prefix}-artifacts-${var.project_id}"
  location = var.region

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  encryption {
    default_kms_key_name = google_kms_crypto_key.storage.id
  }

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
}

resource "google_storage_bucket" "backups" {
  project  = var.project_id
  name     = "${local.env_prefix}-backups-${var.project_id}"
  location = var.region

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  encryption {
    default_kms_key_name = google_kms_crypto_key.storage.id
  }

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  labels = local.labels
}

# =============================================================================
# Cloud DNS
# =============================================================================

resource "google_dns_managed_zone" "optimal" {
  count = var.domain_name != "" ? 1 : 0

  project     = var.project_id
  name        = "${local.env_prefix}-dns-zone"
  dns_name    = "${var.domain_name}."
  description = "DNS zone for Optimal Platform"

  dnssec_config {
    state = "on"
    default_key_specs {
      algorithm  = "rsasha256"
      key_length = 2048
      key_type   = "keySigning"
    }
    default_key_specs {
      algorithm  = "rsasha256"
      key_length = 1024
      key_type   = "zoneSigning"
    }
  }

  labels = local.labels
}

# =============================================================================
# Secret Manager
# =============================================================================

resource "google_secret_manager_secret" "db_password" {
  count = var.enable_cloud_sql ? 1 : 0

  project   = var.project_id
  secret_id = "${local.env_prefix}-db-password"

  replication {
    auto {}
  }

  labels = local.labels
}

resource "google_secret_manager_secret_version" "db_password" {
  count = var.enable_cloud_sql ? 1 : 0

  secret      = google_secret_manager_secret.db_password[0].id
  secret_data = var.db_password
}

resource "google_secret_manager_secret" "redis_auth" {
  count = var.enable_memorystore ? 1 : 0

  project   = var.project_id
  secret_id = "${local.env_prefix}-redis-auth"

  replication {
    auto {}
  }

  labels = local.labels
}

resource "google_secret_manager_secret_version" "redis_auth" {
  count = var.enable_memorystore ? 1 : 0

  secret      = google_secret_manager_secret.redis_auth[0].id
  secret_data = google_redis_instance.cache[0].auth_string
}
