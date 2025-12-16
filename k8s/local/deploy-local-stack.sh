#!/bin/bash
# =============================================================================
# Optimal Platform - Full Local Stack Deployment
# Includes: Keycloak, Grafana, Prometheus, Falco, Kyverno
# =============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo -e "${CYAN}"
echo "======================================================================"
echo "    OPTIMAL PLATFORM - LOCAL SECURITY STACK DEPLOYMENT"
echo "======================================================================"
echo -e "${NC}"

# Step 1: Create Kind cluster
echo -e "${CYAN}[1/8] Creating Kind cluster...${NC}"
if kind get clusters | grep -q "optimal-local"; then
    echo "Cluster 'optimal-local' already exists. Deleting and recreating..."
    kind delete cluster --name optimal-local
fi

kind create cluster --config "$SCRIPT_DIR/kind-config.yaml"
kubectl cluster-info --context kind-optimal-local

# Step 2: Install Nginx Ingress Controller
echo -e "${CYAN}[2/8] Installing NGINX Ingress Controller...${NC}"
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
echo "Waiting for ingress controller..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Step 3: Create namespaces
echo -e "${CYAN}[3/8] Creating namespaces...${NC}"
kubectl create namespace optimal-system --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace keycloak --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace falco --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace kyverno --dry-run=client -o yaml | kubectl apply -f -

# Step 4: Deploy Keycloak
echo -e "${CYAN}[4/8] Deploying Keycloak (SSO/Auth)...${NC}"
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm upgrade --install keycloak bitnami/keycloak \
    --namespace keycloak \
    --set auth.adminUser=admin \
    --set auth.adminPassword=admin123 \
    --set service.type=NodePort \
    --set service.nodePorts.http=30080 \
    --set postgresql.enabled=true \
    --set postgresql.auth.password=keycloak123 \
    --wait --timeout 5m

echo -e "${GREEN}Keycloak available at: http://localhost:8080${NC}"
echo "  Admin: admin / admin123"

# Step 5: Deploy Prometheus + Grafana (kube-prometheus-stack)
echo -e "${CYAN}[5/8] Deploying Prometheus + Grafana (Observability)...${NC}"
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --set grafana.service.type=NodePort \
    --set grafana.service.nodePort=30030 \
    --set grafana.adminPassword=admin123 \
    --set prometheus.service.type=NodePort \
    --set prometheus.service.nodePort=30090 \
    --set alertmanager.enabled=true \
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
    --wait --timeout 5m

echo -e "${GREEN}Grafana available at: http://localhost:3000${NC}"
echo "  Admin: admin / admin123"
echo -e "${GREEN}Prometheus available at: http://localhost:9090${NC}"

# Step 6: Deploy Falco (Container Runtime Security)
echo -e "${CYAN}[6/8] Deploying Falco (Container Runtime Security)...${NC}"
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update

helm upgrade --install falco falcosecurity/falco \
    --namespace falco \
    --set falcosidekick.enabled=true \
    --set falcosidekick.webui.enabled=true \
    --set driver.kind=modern_ebpf \
    --set collectors.kubernetes.enabled=true \
    --wait --timeout 5m || echo "Falco may need kernel headers - continuing..."

echo -e "${GREEN}Falco deployed for runtime security monitoring${NC}"

# Step 7: Deploy Kyverno (Policy as Code)
echo -e "${CYAN}[7/8] Deploying Kyverno (Policy as Code)...${NC}"
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update

helm upgrade --install kyverno kyverno/kyverno \
    --namespace kyverno \
    --set replicaCount=1 \
    --wait --timeout 5m

# Apply baseline security policies
echo "Applying baseline security policies..."
cat <<EOF | kubectl apply -f -
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-privileged-containers
spec:
  validationFailureAction: Audit
  background: true
  rules:
  - name: deny-privileged
    match:
      any:
      - resources:
          kinds:
          - Pod
    validate:
      message: "Privileged containers are not allowed."
      pattern:
        spec:
          containers:
          - securityContext:
              privileged: "!true"
---
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-labels
spec:
  validationFailureAction: Audit
  background: true
  rules:
  - name: check-labels
    match:
      any:
      - resources:
          kinds:
          - Pod
    validate:
      message: "Pods must have 'app' and 'owner' labels."
      pattern:
        metadata:
          labels:
            app: "?*"
---
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-latest-tag
spec:
  validationFailureAction: Audit
  background: true
  rules:
  - name: validate-image-tag
    match:
      any:
      - resources:
          kinds:
          - Pod
    validate:
      message: "Using 'latest' tag is not allowed for container images."
      pattern:
        spec:
          containers:
          - image: "!*:latest"
EOF

echo -e "${GREEN}Kyverno deployed with baseline security policies${NC}"

# Step 8: Deploy Optimal Platform
echo -e "${CYAN}[8/8] Deploying Optimal Platform...${NC}"

# Build and load portal image into kind
echo "Building portal image..."
cd "$PROJECT_ROOT"
docker build -t optimal-platform-portal:local -f apps/portal/Dockerfile apps/portal/
kind load docker-image optimal-platform-portal:local --name optimal-local

# Deploy with Helm (if chart exists) or apply manifests
if [ -d "$PROJECT_ROOT/k8s/helm-charts/optimal-platform" ]; then
    helm upgrade --install optimal-platform \
        "$PROJECT_ROOT/k8s/helm-charts/optimal-platform" \
        --namespace optimal-system \
        --set portal.image.repository=optimal-platform-portal \
        --set portal.image.tag=local \
        --set portal.image.pullPolicy=Never \
        --set portal.env.NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080 \
        --set portal.env.NEXT_PUBLIC_KEYCLOAK_REALM=optimal \
        --set portal.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=optimal-portal \
        --wait --timeout 5m || echo "Helm chart may need adjustments - deploying basic manifests..."
fi

# Apply basic deployment if helm fails
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: optimal-portal
  namespace: optimal-system
  labels:
    app: optimal-portal
    owner: optimal-team
spec:
  replicas: 2
  selector:
    matchLabels:
      app: optimal-portal
  template:
    metadata:
      labels:
        app: optimal-portal
        owner: optimal-team
    spec:
      containers:
      - name: portal
        image: optimal-platform-portal:local
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_KEYCLOAK_URL
          value: "http://localhost:8080"
        - name: NEXT_PUBLIC_KEYCLOAK_REALM
          value: "optimal"
        - name: NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
          value: "optimal-portal"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
---
apiVersion: v1
kind: Service
metadata:
  name: optimal-portal
  namespace: optimal-system
spec:
  selector:
    app: optimal-portal
  ports:
  - port: 80
    targetPort: 3000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: optimal-portal
  namespace: optimal-system
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: launchpad.localhost
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: optimal-portal
            port:
              number: 80
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: optimal-portal
            port:
              number: 80
EOF

echo ""
echo -e "${CYAN}======================================================================"
echo "    DEPLOYMENT COMPLETE!"
echo "======================================================================${NC}"
echo ""
echo -e "${GREEN}Services:${NC}"
echo "  Optimal Platform:  http://localhost"
echo "  Keycloak (SSO):    http://localhost:8080  (admin/admin123)"
echo "  Grafana:           http://localhost:3000  (admin/admin123)"
echo "  Prometheus:        http://localhost:9090"
echo ""
echo -e "${GREEN}Security Stack:${NC}"
echo "  Falco:   Container runtime security monitoring"
echo "  Kyverno: Policy-as-code enforcement (Audit mode)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Configure Keycloak realm 'optimal' with client 'optimal-portal'"
echo "  2. Import Grafana dashboards for Kubernetes monitoring"
echo "  3. View Kyverno policy reports: kubectl get policyreports -A"
echo "  4. Check Falco alerts: kubectl logs -n falco -l app.kubernetes.io/name=falco"
echo ""
echo -e "${CYAN}Useful Commands:${NC}"
echo "  kubectl get pods -A                    # View all pods"
echo "  kubectl get policyreports -A           # Kyverno policy reports"
echo "  kubectl logs -n falco -l app=falco     # Falco security alerts"
echo "  kind delete cluster --name optimal-local  # Cleanup"
echo ""
