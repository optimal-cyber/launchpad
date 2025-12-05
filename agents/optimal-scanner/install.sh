#!/bin/bash
# =============================================================================
# Optimal Scanner Agent - Quick Install Script
# =============================================================================
#
# Usage:
#   curl -sSL https://get.gooptimal.io/scanner | bash -s -- YOUR_API_TOKEN
#
# Or with custom API URL:
#   curl -sSL https://get.gooptimal.io/scanner | bash -s -- YOUR_API_TOKEN https://custom-api.example.com
#
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
API_TOKEN="${1:-}"
API_URL="${2:-https://api.gooptimal.io}"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
SCANNER_IMAGE="optimal/scanner:latest"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║             Optimal Scanner Agent - Quick Install                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for API token
if [ -z "$API_TOKEN" ]; then
    echo -e "${RED}Error: API token required${NC}"
    echo ""
    echo "Usage: $0 <API_TOKEN> [API_URL]"
    echo ""
    echo "Get your API token at: https://portal.gooptimal.io/settings/tokens"
    exit 1
fi

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

echo -e "${BLUE}Detected:${NC} $OS $ARCH"
echo ""

# Check for Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker detected"
    INSTALL_METHOD="docker"
else
    echo -e "${YELLOW}!${NC} Docker not found, installing Python version"
    INSTALL_METHOD="python"
fi

# Install based on method
if [ "$INSTALL_METHOD" = "docker" ]; then
    echo ""
    echo -e "${BLUE}Installing Docker-based scanner...${NC}"
    
    # Pull the scanner image
    echo "Pulling scanner image..."
    docker pull $SCANNER_IMAGE 2>/dev/null || {
        echo -e "${YELLOW}Could not pull from registry, building locally...${NC}"
        # Build locally if pull fails (for development)
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        if [ -f "$SCRIPT_DIR/Dockerfile" ]; then
            docker build -t $SCANNER_IMAGE "$SCRIPT_DIR"
        else
            echo -e "${RED}Error: Could not install scanner${NC}"
            exit 1
        fi
    }
    
    # Create wrapper script
    echo "Creating wrapper script..."
    cat > /tmp/optimal-scan << EOF
#!/bin/bash
# Optimal Scanner Agent wrapper
docker run --rm \\
    -v /var/run/docker.sock:/var/run/docker.sock \\
    -e OPTIMAL_API_TOKEN="${API_TOKEN}" \\
    $SCANNER_IMAGE \\
    --api-url ${API_URL} \\
    --token ${API_TOKEN} \\
    "\$@"
EOF
    
    # Install wrapper
    if [ -w "$INSTALL_DIR" ]; then
        mv /tmp/optimal-scan "$INSTALL_DIR/optimal-scan"
        chmod +x "$INSTALL_DIR/optimal-scan"
    else
        echo -e "${YELLOW}Need sudo to install to $INSTALL_DIR${NC}"
        sudo mv /tmp/optimal-scan "$INSTALL_DIR/optimal-scan"
        sudo chmod +x "$INSTALL_DIR/optimal-scan"
    fi
    
else
    echo ""
    echo -e "${BLUE}Installing Python-based scanner...${NC}"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Error: Python 3 required${NC}"
        exit 1
    fi
    
    # Install via pip
    pip3 install --user aiohttp docker pyyaml click
    
    # Download scanner script
    SCANNER_SCRIPT="https://raw.githubusercontent.com/optimal-platform/optimal-platform/main/agents/optimal-scanner/scanner.py"
    
    if command -v curl &> /dev/null; then
        curl -sSL -o /tmp/scanner.py "$SCANNER_SCRIPT" 2>/dev/null || {
            echo -e "${YELLOW}Could not download from GitHub, using local copy...${NC}"
        }
    fi
    
    # Create wrapper script
    cat > /tmp/optimal-scan << EOF
#!/bin/bash
# Optimal Scanner Agent wrapper
python3 -c "
import sys
sys.path.insert(0, '/usr/local/share/optimal-scanner')
from scanner import main
import asyncio
asyncio.run(main())
" --api-url ${API_URL} --token ${API_TOKEN} "\$@"
EOF

    # Install
    if [ -w "$INSTALL_DIR" ]; then
        mkdir -p /usr/local/share/optimal-scanner
        cp /tmp/scanner.py /usr/local/share/optimal-scanner/ 2>/dev/null || true
        mv /tmp/optimal-scan "$INSTALL_DIR/optimal-scan"
        chmod +x "$INSTALL_DIR/optimal-scan"
    else
        echo -e "${YELLOW}Need sudo to install to $INSTALL_DIR${NC}"
        sudo mkdir -p /usr/local/share/optimal-scanner
        sudo cp /tmp/scanner.py /usr/local/share/optimal-scanner/ 2>/dev/null || true
        sudo mv /tmp/optimal-scan "$INSTALL_DIR/optimal-scan"
        sudo chmod +x "$INSTALL_DIR/optimal-scan"
    fi
fi

# Verify installation
echo ""
if command -v optimal-scan &> /dev/null; then
    echo -e "${GREEN}✓ Installation complete!${NC}"
    echo ""
    echo -e "${CYAN}Quick Start:${NC}"
    echo ""
    echo "  # Scan a container image"
    echo "  optimal-scan --image nginx:latest"
    echo ""
    echo "  # Scan all running containers"
    echo "  optimal-scan --all-containers"
    echo ""
    echo "  # Scan a directory"
    echo "  optimal-scan --path /app"
    echo ""
    echo "  # Run in daemon mode (continuous scanning)"
    echo "  optimal-scan --daemon --interval 300"
    echo ""
    echo -e "${CYAN}View results at:${NC} https://portal.gooptimal.io/vulnerabilities"
else
    echo -e "${RED}Installation may have failed. Please check the output above.${NC}"
    exit 1
fi

# Test connection
echo ""
echo -e "${BLUE}Testing connection to Optimal Platform...${NC}"
optimal-scan --image alpine:latest 2>/dev/null && {
    echo -e "${GREEN}✓ Connection successful!${NC}"
} || {
    echo -e "${YELLOW}! Could not verify connection (this may be normal for demo mode)${NC}"
}

echo ""
echo -e "${GREEN}Scanner installed successfully!${NC}"

