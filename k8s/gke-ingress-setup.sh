#!/bin/bash
# =============================================================================
# GKE Ingress & SSL Setup for Optimal Platform
# Run this after your GKE cluster is created
# =============================================================================

set -e

NAMESPACE="optimal-system"
DOMAIN="gooptimal.io"
EMAIL="admin@gooptimal.io"  # For Let's Encrypt notifications

echo "=== Setting up GKE Ingress for $DOMAIN ==="

# 1. Create namespace
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# 2. Install NGINX Ingress Controller
echo "Installing NGINX Ingress Controller..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.loadBalancerIP="" \
  --set controller.service.annotations."cloud\.google\.com/load-balancer-type"="External" \
  --set controller.config.use-forwarded-headers="true" \
  --set controller.config.proxy-buffer-size="16k"

# Wait for ingress controller to be ready
echo "Waiting for Ingress Controller..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Get the external IP
echo "Getting External IP..."
sleep 30
EXTERNAL_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "External IP: $EXTERNAL_IP"
echo "Update your DNS records to point to this IP!"

# 3. Install cert-manager for SSL
echo "Installing cert-manager..."
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# Wait for cert-manager
echo "Waiting for cert-manager..."
kubectl wait --namespace cert-manager \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/instance=cert-manager \
  --timeout=120s

# 4. Create ClusterIssuer for Let's Encrypt
echo "Creating Let's Encrypt ClusterIssuer..."
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: $EMAIL
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: $EMAIL
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

echo ""
echo "=== Setup Complete ==="
echo ""
echo "External IP: $EXTERNAL_IP"
echo ""
echo "Next steps:"
echo "1. Update DNS records to point *.${DOMAIN} to ${EXTERNAL_IP}"
echo "2. Deploy Optimal Platform with Helm"
echo "3. SSL certificates will be auto-generated"
echo ""
