#!/bin/bash
# =============================================================================
# Optimal Security Agent - Standalone Installer
# =============================================================================
# One-liner installation for Docker hosts, VMs, and bare-metal servers.
#
# Usage:
#   curl -sSL https://install.gooptimal.io | bash -s -- \
#     --platform-url https://api.gooptimal.io \
#     --client-id <your-client-id> \
#     --client-secret <your-client-secret>
#
# Options:
#   --platform-url    Optimal Platform API URL (default: https://api.gooptimal.io)
#   --client-id       OAuth client ID (required)
#   --client-secret   OAuth client secret (required)
#   --environment     Environment name (default: production)
#   --org-id          Organization ID (default: default)
#   --agent-name      Custom agent name (default: auto-generated)
#   --no-start        Install without starting the agent
#   --uninstall       Remove the agent
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PLATFORM_URL="https://api.gooptimal.io"
CLIENT_ID=""
CLIENT_SECRET=""
ENVIRONMENT="production"
ORG_ID="default"
AGENT_NAME=""
NO_START=false
UNINSTALL=false

# Installation paths
INSTALL_DIR="/opt/optimal-agent"
CONFIG_FILE="/etc/optimal-agent/config.env"
SYSTEMD_FILE="/etc/systemd/system/optimal-agent.service"
DOCKER_COMPOSE_FILE="${INSTALL_DIR}/docker-compose.yml"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

print_banner() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}           Optimal Security Agent Installer                ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}           Version 1.0.0                                   ${BLUE}║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
    fi
}

check_dependencies() {
    log_info "Checking dependencies..."

    # Check for Docker or Podman
    if command -v docker &> /dev/null; then
        CONTAINER_RUNTIME="docker"
        COMPOSE_CMD="docker compose"
        if ! docker compose version &> /dev/null; then
            COMPOSE_CMD="docker-compose"
        fi
    elif command -v podman &> /dev/null; then
        CONTAINER_RUNTIME="podman"
        COMPOSE_CMD="podman-compose"
    else
        log_error "Docker or Podman is required but not installed"
    fi

    log_info "Using container runtime: ${CONTAINER_RUNTIME}"

    # Check for curl
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
    fi
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --platform-url)
                PLATFORM_URL="$2"
                shift 2
                ;;
            --client-id)
                CLIENT_ID="$2"
                shift 2
                ;;
            --client-secret)
                CLIENT_SECRET="$2"
                shift 2
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --org-id)
                ORG_ID="$2"
                shift 2
                ;;
            --agent-name)
                AGENT_NAME="$2"
                shift 2
                ;;
            --no-start)
                NO_START=true
                shift
                ;;
            --uninstall)
                UNINSTALL=true
                shift
                ;;
            -h|--help)
                print_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                ;;
        esac
    done
}

print_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --platform-url URL    Optimal Platform API URL (default: https://api.gooptimal.io)"
    echo "  --client-id ID        OAuth client ID (required for install)"
    echo "  --client-secret SEC   OAuth client secret (required for install)"
    echo "  --environment ENV     Environment name (default: production)"
    echo "  --org-id ID           Organization ID (default: default)"
    echo "  --agent-name NAME     Custom agent name"
    echo "  --no-start            Install without starting the agent"
    echo "  --uninstall           Remove the agent"
    echo "  -h, --help            Show this help message"
}

validate_credentials() {
    if [[ -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]]; then
        log_error "Both --client-id and --client-secret are required"
    fi

    log_info "Validating credentials with platform..."

    # Attempt to get a token to validate credentials
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        "${PLATFORM_URL}/api/auth/agent/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}" \
        2>/dev/null)

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [[ "$HTTP_CODE" == "200" ]]; then
        log_success "Credentials validated successfully"
    elif [[ "$HTTP_CODE" == "401" ]]; then
        log_error "Invalid credentials. Please check your client_id and client_secret"
    else
        log_warning "Could not validate credentials (HTTP ${HTTP_CODE}). Continuing anyway..."
    fi
}

# =============================================================================
# Installation Functions
# =============================================================================

create_directories() {
    log_info "Creating installation directories..."
    mkdir -p "${INSTALL_DIR}"
    mkdir -p "$(dirname ${CONFIG_FILE})"
    mkdir -p "/var/lib/optimal"
}

create_config() {
    log_info "Creating configuration..."

    # Generate agent name if not provided
    if [[ -z "$AGENT_NAME" ]]; then
        AGENT_NAME="agent-$(hostname)-$(date +%s | tail -c 6)"
    fi

    cat > "${CONFIG_FILE}" << EOF
# Optimal Security Agent Configuration
# Generated on $(date)

# Platform connection
OPTIMAL_API_URL=${PLATFORM_URL}

# OAuth credentials
OPTIMAL_CLIENT_ID=${CLIENT_ID}
OPTIMAL_CLIENT_SECRET=${CLIENT_SECRET}

# Agent identification
OPTIMAL_AGENT_NAME=${AGENT_NAME}
OPTIMAL_ENVIRONMENT=${ENVIRONMENT}
OPTIMAL_ORG_ID=${ORG_ID}

# Scan settings
OPTIMAL_HEARTBEAT_INTERVAL=60
OPTIMAL_SCAN_INTERVAL=300

# Features
OPTIMAL_VULN_SCANNING=true
OPTIMAL_SBOM_GENERATION=true
OPTIMAL_RUNTIME_SECURITY=true

# Offline support
OPTIMAL_OFFLINE_QUEUE_ENABLED=true
OPTIMAL_OFFLINE_QUEUE_PATH=/var/lib/optimal/queue.db

# Logging
OPTIMAL_LOG_LEVEL=INFO
EOF

    chmod 600 "${CONFIG_FILE}"
    log_success "Configuration created at ${CONFIG_FILE}"
}

create_docker_compose() {
    log_info "Creating Docker Compose file..."

    cat > "${DOCKER_COMPOSE_FILE}" << 'EOF'
version: '3.8'

services:
  optimal-agent:
    image: ghcr.io/optimal-platform/optimal-agent:latest
    container_name: optimal-agent
    restart: unless-stopped
    env_file:
      - /etc/optimal-agent/config.env
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - optimal-data:/var/lib/optimal
      - /:/host:ro
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 256M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    ports:
      - "8080:8080"

volumes:
  optimal-data:
    driver: local
EOF

    log_success "Docker Compose file created at ${DOCKER_COMPOSE_FILE}"
}

create_systemd_service() {
    log_info "Creating systemd service..."

    cat > "${SYSTEMD_FILE}" << EOF
[Unit]
Description=Optimal Security Agent
Documentation=https://docs.gooptimal.io/agents
After=docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/docker compose -f ${DOCKER_COMPOSE_FILE} up
ExecStop=/usr/bin/docker compose -f ${DOCKER_COMPOSE_FILE} down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable optimal-agent.service

    log_success "Systemd service created and enabled"
}

start_agent() {
    log_info "Starting Optimal Security Agent..."

    systemctl start optimal-agent.service

    # Wait for agent to be healthy
    sleep 5

    if systemctl is-active --quiet optimal-agent.service; then
        log_success "Agent started successfully!"
    else
        log_warning "Agent may not have started correctly. Check logs with: journalctl -u optimal-agent -f"
    fi
}

# =============================================================================
# Uninstallation Function
# =============================================================================

uninstall() {
    log_info "Uninstalling Optimal Security Agent..."

    # Stop and disable service
    if systemctl is-active --quiet optimal-agent.service 2>/dev/null; then
        systemctl stop optimal-agent.service
    fi
    if systemctl is-enabled --quiet optimal-agent.service 2>/dev/null; then
        systemctl disable optimal-agent.service
    fi

    # Remove files
    rm -f "${SYSTEMD_FILE}"
    rm -rf "${INSTALL_DIR}"
    rm -rf "$(dirname ${CONFIG_FILE})"

    # Remove Docker volume (optional - keep data by default)
    read -p "Remove agent data volume? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume rm optimal-data 2>/dev/null || true
    fi

    systemctl daemon-reload

    log_success "Optimal Security Agent uninstalled"
}

# =============================================================================
# Main
# =============================================================================

main() {
    print_banner
    check_root
    parse_args "$@"

    if [[ "$UNINSTALL" == true ]]; then
        uninstall
        exit 0
    fi

    check_dependencies
    validate_credentials
    create_directories
    create_config
    create_docker_compose
    create_systemd_service

    if [[ "$NO_START" != true ]]; then
        start_agent
    else
        log_info "Agent installed but not started. Start with: systemctl start optimal-agent"
    fi

    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}           Installation Complete!                           ${GREEN}║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Agent Name: ${AGENT_NAME}"
    echo "Platform:   ${PLATFORM_URL}"
    echo ""
    echo "Useful commands:"
    echo "  View logs:     journalctl -u optimal-agent -f"
    echo "  Check status:  systemctl status optimal-agent"
    echo "  Restart:       systemctl restart optimal-agent"
    echo "  Stop:          systemctl stop optimal-agent"
    echo "  Uninstall:     $0 --uninstall"
    echo ""
}

main "$@"
