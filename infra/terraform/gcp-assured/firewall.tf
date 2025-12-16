# =============================================================================
# Firewall Rules - Multi-VPC Security
# FedRAMP High compliant network security
# =============================================================================

# =============================================================================
# Application VPC Firewall Rules
# =============================================================================

# Allow internal communication within Application VPC
resource "google_compute_firewall" "app_internal" {
  name    = "${local.env_prefix}-app-internal"
  network = module.application_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = [
    var.app_vpc_cidr_primary,
    var.app_vpc_cidr_gke_nodes,
    var.app_vpc_cidr_pods,
    var.app_vpc_cidr_services,
  ]

  priority = 1000
}

# Allow HTTPS ingress for web applications
resource "google_compute_firewall" "app_https_ingress" {
  name    = "${local.env_prefix}-app-https-ingress"
  network = module.application_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["443", "80"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["http-server", "https-server"]

  priority = 1000
}

# Allow Keycloak SSO from Management VPC
resource "google_compute_firewall" "app_from_mgmt_keycloak" {
  name    = "${local.env_prefix}-app-from-mgmt-keycloak"
  network = module.application_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["8080", "8443"]
  }

  source_ranges = [
    var.mgmt_vpc_cidr_primary,
    var.mgmt_vpc_cidr_gke_nodes,
  ]

  priority = 900
}

# Allow Prometheus scraping from Monitoring VPC
resource "google_compute_firewall" "app_from_mon_prometheus" {
  name    = "${local.env_prefix}-app-from-mon-prometheus"
  network = module.application_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["9090", "9093", "9100", "8080", "8443"]
  }

  source_ranges = [
    var.mon_vpc_cidr_primary,
    var.mon_vpc_cidr_gke_nodes,
    var.mon_vpc_cidr_pods,
  ]

  priority = 900
}

# Allow security scanning from Security VPC
resource "google_compute_firewall" "app_from_sec_scanning" {
  name    = "${local.env_prefix}-app-from-sec-scanning"
  network = module.application_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["443", "8080", "8443", "5000"] # Harbor registry
  }

  source_ranges = [
    var.sec_vpc_cidr_primary,
    var.sec_vpc_cidr_gke_nodes,
    var.sec_vpc_cidr_pods,
  ]

  priority = 900
}

# Deny all other ingress (default deny)
resource "google_compute_firewall" "app_deny_all" {
  name    = "${local.env_prefix}-app-deny-all"
  network = module.application_vpc.network_name
  project = var.project_id

  deny {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]
  priority      = 65534
}

# =============================================================================
# Monitoring VPC Firewall Rules
# =============================================================================

# Allow internal communication within Monitoring VPC
resource "google_compute_firewall" "mon_internal" {
  name    = "${local.env_prefix}-mon-internal"
  network = module.monitoring_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = [
    var.mon_vpc_cidr_primary,
    var.mon_vpc_cidr_gke_nodes,
    var.mon_vpc_cidr_pods,
    var.mon_vpc_cidr_services,
  ]

  priority = 1000
}

# Allow Grafana/Prometheus access from Application VPC
resource "google_compute_firewall" "mon_from_app" {
  name    = "${local.env_prefix}-mon-from-app"
  network = module.monitoring_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["3000", "9090", "9093", "9200", "5601"] # Grafana, Prometheus, ES, Kibana
  }

  source_ranges = [
    var.app_vpc_cidr_primary,
    var.app_vpc_cidr_gke_nodes,
    var.app_vpc_cidr_pods,
  ]

  priority = 900
}

# Allow metrics push from Security VPC
resource "google_compute_firewall" "mon_from_sec" {
  name    = "${local.env_prefix}-mon-from-sec"
  network = module.monitoring_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["9090", "9200", "8200"] # Prometheus, ES, Falco exporter
  }

  source_ranges = [
    var.sec_vpc_cidr_primary,
    var.sec_vpc_cidr_gke_nodes,
    var.sec_vpc_cidr_pods,
  ]

  priority = 900
}

# Allow admin dashboard access from Management VPC
resource "google_compute_firewall" "mon_from_mgmt" {
  name    = "${local.env_prefix}-mon-from-mgmt"
  network = module.monitoring_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["3000", "9090", "9200", "5601"]
  }

  source_ranges = [
    var.mgmt_vpc_cidr_primary,
    var.mgmt_vpc_cidr_gke_nodes,
    var.mgmt_vpc_cidr_bastion,
  ]

  priority = 900
}

# Deny all other ingress
resource "google_compute_firewall" "mon_deny_all" {
  name    = "${local.env_prefix}-mon-deny-all"
  network = module.monitoring_vpc.network_name
  project = var.project_id

  deny {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]
  priority      = 65534
}

# =============================================================================
# Security VPC Firewall Rules
# =============================================================================

# Allow internal communication within Security VPC
resource "google_compute_firewall" "sec_internal" {
  name    = "${local.env_prefix}-sec-internal"
  network = module.security_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = [
    var.sec_vpc_cidr_primary,
    var.sec_vpc_cidr_gke_nodes,
    var.sec_vpc_cidr_pods,
    var.sec_vpc_cidr_services,
  ]

  priority = 1000
}

# Allow Falco alerts to Application VPC
resource "google_compute_firewall" "sec_to_app" {
  name    = "${local.env_prefix}-sec-to-app"
  network = module.security_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["443", "8080"]
  }

  source_ranges = [
    var.app_vpc_cidr_primary,
    var.app_vpc_cidr_gke_nodes,
  ]

  direction = "EGRESS"
  priority  = 900
}

# Allow admin access from Management VPC
resource "google_compute_firewall" "sec_from_mgmt" {
  name    = "${local.env_prefix}-sec-from-mgmt"
  network = module.security_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["443", "8080", "8443", "2801", "2802"] # Falco, Trivy
  }

  source_ranges = [
    var.mgmt_vpc_cidr_primary,
    var.mgmt_vpc_cidr_gke_nodes,
    var.mgmt_vpc_cidr_bastion,
  ]

  priority = 900
}

# Deny all other ingress
resource "google_compute_firewall" "sec_deny_all" {
  name    = "${local.env_prefix}-sec-deny-all"
  network = module.security_vpc.network_name
  project = var.project_id

  deny {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]
  priority      = 65534
}

# =============================================================================
# Management VPC Firewall Rules
# =============================================================================

# Allow internal communication within Management VPC
resource "google_compute_firewall" "mgmt_internal" {
  name    = "${local.env_prefix}-mgmt-internal"
  network = module.management_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = [
    var.mgmt_vpc_cidr_primary,
    var.mgmt_vpc_cidr_gke_nodes,
    var.mgmt_vpc_cidr_bastion,
    var.mgmt_vpc_cidr_pods,
    var.mgmt_vpc_cidr_services,
  ]

  priority = 1000
}

# Allow SSH to bastion from authorized IPs only
resource "google_compute_firewall" "mgmt_bastion_ssh" {
  name    = "${local.env_prefix}-mgmt-bastion-ssh"
  network = module.management_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.authorized_admin_cidrs
  target_tags   = ["bastion"]

  priority = 800
}

# Allow IAP for secure bastion access (recommended over direct SSH)
resource "google_compute_firewall" "mgmt_iap" {
  name    = "${local.env_prefix}-mgmt-iap"
  network = module.management_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["22", "3389"]
  }

  # IAP IP range
  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["bastion", "allow-iap"]

  priority = 800
}

# Allow Keycloak access from all VPCs
resource "google_compute_firewall" "mgmt_keycloak" {
  name    = "${local.env_prefix}-mgmt-keycloak"
  network = module.management_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["8080", "8443"]
  }

  source_ranges = [
    var.app_vpc_cidr_primary,
    var.app_vpc_cidr_gke_nodes,
    var.app_vpc_cidr_pods,
    var.mon_vpc_cidr_primary,
    var.mon_vpc_cidr_gke_nodes,
    var.sec_vpc_cidr_primary,
    var.sec_vpc_cidr_gke_nodes,
  ]

  target_tags = ["keycloak"]
  priority    = 900
}

# Allow HTTPS ingress for Keycloak public access
resource "google_compute_firewall" "mgmt_keycloak_public" {
  name    = "${local.env_prefix}-mgmt-keycloak-public"
  network = module.management_vpc.network_name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["keycloak-public"]

  priority = 1000
}

# Deny all other ingress
resource "google_compute_firewall" "mgmt_deny_all" {
  name    = "${local.env_prefix}-mgmt-deny-all"
  network = module.management_vpc.network_name
  project = var.project_id

  deny {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]
  priority      = 65534
}
