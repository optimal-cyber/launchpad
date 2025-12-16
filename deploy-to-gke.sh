#!/bin/bash
# =============================================================================
# Optimal Platform - GKE Deployment Script
# For ryan@gooptimal.io
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "======================================================================"
echo "         OPTIMAL PLATFORM - GKE DEPLOYMENT"
echo "======================================================================"
echo -e "${NC}"

# Configuration - EDIT THESE VALUES
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
ZONE="${GCP_ZONE:-us-central1-a}"
CLUSTER_NAME="${GKE_CLUSTER_NAME:-optimal-platform}"
NAMESPACE="optimal-system"
DOMAIN="gooptimal.io"

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI not found${NC}"
    echo "Please install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || echo "")
if [ -z "$CURRENT_ACCOUNT" ]; then
    echo -e "${YELLOW}Not authenticated. Please run:${NC}"
    echo "  gcloud auth login"
    exit 1
fi

echo -e "${GREEN}Authenticated as: ${CURRENT_ACCOUNT}${NC}"

# Function to prompt for input
prompt_for_value() {
    local var_name=$1
    local prompt_text=$2
    local default_value=$3
    local current_value=${!var_name}

    if [ -z "$current_value" ]; then
        echo -n -e "${YELLOW}$prompt_text [$default_value]: ${NC}"
        read input_value
        if [ -z "$input_value" ]; then
            eval "$var_name='$default_value'"
        else
            eval "$var_name='$input_value'"
        fi
    fi
}

# Interactive project selection
echo ""
echo -e "${CYAN}=== Step 1: GCP Project Setup ===${NC}"
echo ""

# List available projects
echo "Available GCP Projects:"
gcloud projects list --format="table(projectId,name,projectNumber)" 2>/dev/null || echo "Unable to list projects"
echo ""

prompt_for_value PROJECT_ID "Enter GCP Project ID" "optimal-platform-prod"

# Set the project
echo ""
echo -e "${GREEN}Setting project to: ${PROJECT_ID}${NC}"
gcloud config set project "$PROJECT_ID" 2>/dev/null || {
    echo -e "${YELLOW}Project doesn't exist. Creating it...${NC}"

    # Check for billing account
    BILLING_ACCOUNT=$(gcloud billing accounts list --format="value(name)" --limit=1 2>/dev/null || echo "")
    if [ -z "$BILLING_ACCOUNT" ]; then
        echo -e "${RED}Error: No billing account found. Please set up billing at:${NC}"
        echo "  https://console.cloud.google.com/billing"
        exit 1
    fi

    # Create project
    gcloud projects create "$PROJECT_ID" --name="Optimal Platform Production" 2>/dev/null || {
        echo -e "${RED}Failed to create project. It may already exist or name is taken.${NC}"
        exit 1
    }

    # Link billing
    gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
    gcloud config set project "$PROJECT_ID"
}

# Enable required APIs
echo ""
echo -e "${CYAN}=== Step 2: Enabling GCP APIs ===${NC}"
echo ""

APIS=(
    "container.googleapis.com"           # GKE
    "compute.googleapis.com"             # Compute Engine
    "cloudresourcemanager.googleapis.com"
    "iam.googleapis.com"
    "dns.googleapis.com"                 # Cloud DNS
    "certificatemanager.googleapis.com"  # Certificate Manager
    "artifactregistry.googleapis.com"    # Container Registry
    "sqladmin.googleapis.com"            # Cloud SQL
    "redis.googleapis.com"               # Memorystore
)

for api in "${APIS[@]}"; do
    echo "Enabling $api..."
    gcloud services enable "$api" --quiet 2>/dev/null || true
done

echo -e "${GREEN}APIs enabled!${NC}"

# GKE Cluster setup
echo ""
echo -e "${CYAN}=== Step 3: GKE Cluster Setup ===${NC}"
echo ""

# Check if cluster exists
EXISTING_CLUSTER=$(gcloud container clusters list --filter="name=$CLUSTER_NAME" --format="value(name)" 2>/dev/null || echo "")

if [ -n "$EXISTING_CLUSTER" ]; then
    echo -e "${GREEN}Cluster '$CLUSTER_NAME' already exists!${NC}"
else
    echo -e "${YELLOW}Creating GKE cluster: $CLUSTER_NAME${NC}"
    echo "This may take 5-10 minutes..."

    prompt_for_value ZONE "Enter preferred zone" "us-central1-a"

    gcloud container clusters create "$CLUSTER_NAME" \
        --zone "$ZONE" \
        --num-nodes 3 \
        --machine-type "e2-standard-4" \
        --disk-size "100GB" \
        --enable-autoscaling \
        --min-nodes 2 \
        --max-nodes 10 \
        --enable-network-policy \
        --workload-pool="${PROJECT_ID}.svc.id.goog" \
        --enable-ip-alias \
        --release-channel "regular"

    echo -e "${GREEN}Cluster created!${NC}"
fi

# Get cluster credentials
echo ""
echo "Getting cluster credentials..."
gcloud container clusters get-credentials "$CLUSTER_NAME" --zone "$ZONE"

# Verify kubectl access
echo ""
kubectl cluster-info

# Install Helm if not present
echo ""
echo -e "${CYAN}=== Step 4: Installing Helm ===${NC}"
echo ""

if ! command -v helm &> /dev/null; then
    echo "Installing Helm..."
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi
echo -e "${GREEN}Helm version: $(helm version --short)${NC}"

# Install nginx-ingress
echo ""
echo -e "${CYAN}=== Step 5: Installing NGINX Ingress Controller ===${NC}"
echo ""

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
    --namespace ingress-nginx \
    --create-namespace \
    --set controller.service.annotations."cloud\.google\.com/load-balancer-type"="External" \
    --set controller.config.use-forwarded-headers="true" \
    --set controller.config.proxy-buffer-size="16k" \
    --wait

echo ""
echo "Waiting for external IP..."
sleep 30

EXTERNAL_IP=""
for i in {1..30}; do
    EXTERNAL_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    if [ -n "$EXTERNAL_IP" ]; then
        break
    fi
    echo "Waiting for IP... ($i/30)"
    sleep 10
done

if [ -z "$EXTERNAL_IP" ]; then
    echo -e "${RED}Failed to get external IP. Please check the ingress controller manually.${NC}"
    exit 1
fi

echo -e "${GREEN}External IP: $EXTERNAL_IP${NC}"

# Install cert-manager
echo ""
echo -e "${CYAN}=== Step 6: Installing cert-manager ===${NC}"
echo ""

helm repo add jetstack https://charts.jetstack.io
helm repo update

helm upgrade --install cert-manager jetstack/cert-manager \
    --namespace cert-manager \
    --create-namespace \
    --set installCRDs=true \
    --wait

# Create ClusterIssuer
echo ""
echo "Creating Let's Encrypt ClusterIssuer..."

cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@${DOMAIN}
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Create namespace for optimal platform
echo ""
echo -e "${CYAN}=== Step 7: Creating Optimal Platform Namespace ===${NC}"
echo ""

kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Build and push container images
echo ""
echo -e "${CYAN}=== Step 8: Container Registry Setup ===${NC}"
echo ""

REGISTRY="$REGION-docker.pkg.dev/$PROJECT_ID/optimal-platform"

# Create Artifact Registry repository
gcloud artifacts repositories create optimal-platform \
    --repository-format=docker \
    --location="$REGION" \
    --description="Optimal Platform container images" 2>/dev/null || echo "Repository already exists"

# Configure Docker to use gcloud credentials
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

# Build and push images
echo ""
echo "Building and pushing container images..."
echo "This may take several minutes..."

cd "$(dirname "$0")"

# Tag and push portal image
docker tag optimal-platform-portal:latest "$REGISTRY/portal:latest"
docker push "$REGISTRY/portal:latest"

# Tag and push api-gateway if it exists
if docker image inspect optimal-platform-api-gateway:latest >/dev/null 2>&1; then
    docker tag optimal-platform-api-gateway:latest "$REGISTRY/api-gateway:latest"
    docker push "$REGISTRY/api-gateway:latest"
fi

echo -e "${GREEN}Images pushed to registry!${NC}"

# Deploy with Helm
echo ""
echo -e "${CYAN}=== Step 9: Deploying Optimal Platform ===${NC}"
echo ""

helm upgrade --install optimal-platform \
    ./k8s/helm-charts/optimal-platform \
    -f ./k8s/helm-charts/optimal-platform/values-gooptimal.yaml \
    --namespace "$NAMESPACE" \
    --set portal.image.repository="$REGISTRY/portal" \
    --set portal.image.tag="latest" \
    --set apiGateway.image.repository="$REGISTRY/api-gateway" \
    --set apiGateway.image.tag="latest" \
    --wait \
    --timeout 10m

# Summary
echo ""
echo -e "${CYAN}======================================================================"
echo "         DEPLOYMENT COMPLETE!"
echo "======================================================================${NC}"
echo ""
echo -e "${GREEN}External IP: $EXTERNAL_IP${NC}"
echo ""
echo -e "${YELLOW}DNS CONFIGURATION REQUIRED:${NC}"
echo ""
echo "Add the following DNS records to your domain registrar for ${DOMAIN}:"
echo ""
echo "  Type: A    Name: launchpad     Value: $EXTERNAL_IP"
echo "  Type: A    Name: api           Value: $EXTERNAL_IP"
echo "  Type: A    Name: keycloak      Value: $EXTERNAL_IP"
echo "  Type: A    Name: gitlab        Value: $EXTERNAL_IP"
echo "  Type: A    Name: harbor        Value: $EXTERNAL_IP"
echo "  Type: A    Name: grafana       Value: $EXTERNAL_IP"
echo ""
echo "Or use a wildcard:"
echo "  Type: A    Name: *             Value: $EXTERNAL_IP"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "1. Configure DNS records (above)"
echo "2. Wait ~5-10 mins for DNS propagation"
echo "3. SSL certificates will auto-provision once DNS is active"
echo "4. Access the platform at: https://launchpad.${DOMAIN}"
echo ""
echo -e "${GREEN}Happy deploying!${NC}"
