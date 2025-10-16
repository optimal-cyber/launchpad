#!/bin/bash

echo "🚀 Optimal Platform - Operationalization Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check required tools
    local tools=("kubectl" "helm" "docker" "git" "curl" "jq")
    for tool in "${tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            print_error "$tool is not installed. Please install it first."
            exit 1
        fi
    done
    
    # Check cloud provider CLI
    if command -v aws &> /dev/null; then
        print_success "AWS CLI found"
        CLOUD_PROVIDER="aws"
    elif command -v gcloud &> /dev/null; then
        print_success "Google Cloud CLI found"
        CLOUD_PROVIDER="gcp"
    elif command -v az &> /dev/null; then
        print_success "Azure CLI found"
        CLOUD_PROVIDER="azure"
    else
        print_warning "No cloud provider CLI found. Please install AWS, GCP, or Azure CLI."
        CLOUD_PROVIDER="local"
    fi
    
    print_success "Prerequisites check completed"
}

# Function to create production infrastructure
create_infrastructure() {
    print_status "Creating production infrastructure..."
    
    # Create Kubernetes namespaces
    kubectl create namespace optimal-platform --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace optimal-platform-monitoring --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace optimal-platform-security --dry-run=client -o yaml | kubectl apply -f -
    
    # Create resource quotas
    cat > k8s/resource-quotas.yaml << EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: optimal-platform-quota
  namespace: optimal-platform
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    persistentvolumeclaims: "10"
    services: "10"
    secrets: "20"
    configmaps: "20"
EOF
    
    kubectl apply -f k8s/resource-quotas.yaml
    
    # Create network policies
    cat > k8s/network-policies.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: optimal-platform-netpol
  namespace: optimal-platform
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: optimal-platform
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: optimal-platform
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80
EOF
    
    kubectl apply -f k8s/network-policies.yaml
    
    print_success "Infrastructure created successfully"
}

# Function to set up monitoring
setup_monitoring() {
    print_status "Setting up monitoring and observability..."
    
    # Add Prometheus Helm repository
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo update
    
    # Install Prometheus
    helm install prometheus prometheus-community/kube-prometheus-stack \
        --namespace optimal-platform-monitoring \
        --create-namespace \
        --set grafana.adminPassword=admin \
        --set prometheus.prometheusSpec.retention=30d \
        --set alertmanager.alertmanagerSpec.retention=30d
    
    # Install Jaeger for tracing
    helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
    helm install jaeger jaegertracing/jaeger \
        --namespace optimal-platform-monitoring \
        --set storage.type=memory
    
    # Install ELK stack for logging
    helm repo add elastic https://helm.elastic.co
    helm install elasticsearch elastic/elasticsearch \
        --namespace optimal-platform-monitoring \
        --set replicas=1 \
        --set volumeClaimTemplate.resources.requests.storage=10Gi
    
    helm install kibana elastic/kibana \
        --namespace optimal-platform-monitoring \
        --set elasticsearchHosts=http://elasticsearch-master:9200
    
    helm install logstash elastic/logstash \
        --namespace optimal-platform-monitoring
    
    print_success "Monitoring stack installed successfully"
}

# Function to set up security scanning
setup_security() {
    print_status "Setting up security scanning and compliance..."
    
    # Install Trivy operator for vulnerability scanning
    kubectl apply -f https://raw.githubusercontent.com/aquasecurity/trivy-operator/main/deploy/static/trivy-operator.yaml
    
    # Install Falco for runtime security
    helm repo add falcosecurity https://falcosecurity.github.io/charts
    helm install falco falcosecurity/falco \
        --namespace optimal-platform-security \
        --create-namespace \
        --set falco.grpc.enabled=true \
        --set falco.grpcOutput.enabled=true
    
    # Install OPA Gatekeeper for policy enforcement
    kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/release-3.14/deploy/gatekeeper.yaml
    
    # Create security policies
    cat > k8s/security-policies.yaml << EOF
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        properties:
          labels:
            type: array
            items:
              type: string
        type: object
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels
        violation[{"msg": msg}] {
          required := input.parameters.labels
          provided := input.review.object.metadata.labels
          missing := required[_]
          not provided[missing]
          msg := sprintf("Missing required label: %v", [missing])
        }
---
apiVersion: config.gatekeeper.sh/v1alpha1
kind: K8sRequiredLabels
metadata:
  name: must-have-required-labels
spec:
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
  parameters:
    labels: ["app", "version"]
EOF
    
    kubectl apply -f k8s/security-policies.yaml
    
    print_success "Security scanning and compliance setup completed"
}

# Function to create CI/CD pipeline
setup_cicd() {
    print_status "Setting up CI/CD pipeline..."
    
    # Create GitLab CI configuration
    cat > .gitlab-ci.yml << EOF
stages:
  - security-scan
  - build
  - test
  - deploy-staging
  - deploy-production

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

services:
  - docker:dind

before_script:
  - docker info
  - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY

security-scan:
  stage: security-scan
  image: aquasec/trivy:latest
  script:
    - trivy image --exit-code 1 --severity HIGH,CRITICAL $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - trivy image --format table $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main
    - develop

build:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main
    - develop

test:
  stage: test
  script:
    - echo "Running tests..."
    - docker run --rm $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA npm test
  only:
    - main
    - develop

deploy-staging:
  stage: deploy-staging
  script:
    - helm upgrade --install optimal-platform-staging ./helm-charts/optimal-platform
        --namespace optimal-platform-staging
        --create-namespace
        --set image.tag=$CI_COMMIT_SHA
        --set environment=staging
  only:
    - develop

deploy-production:
  stage: deploy-production
  script:
    - helm upgrade --install optimal-platform ./helm-charts/optimal-platform
        --namespace optimal-platform
        --set image.tag=$CI_COMMIT_SHA
        --set environment=production
  only:
    - main
  when: manual
EOF
    
    # Create Helm charts directory structure
    mkdir -p helm-charts/optimal-platform/templates
    mkdir -p helm-charts/optimal-platform/charts
    
    # Create Helm Chart.yaml
    cat > helm-charts/optimal-platform/Chart.yaml << EOF
apiVersion: v2
name: optimal-platform
description: Optimal Platform - Application Security Platform
type: application
version: 0.1.0
appVersion: "1.0.0"
dependencies:
  - name: postgresql
    version: 12.1.2
    repository: https://charts.bitnami.com/bitnami
  - name: redis
    version: 17.3.7
    repository: https://charts.bitnami.com/bitnami
EOF
    
    # Create values.yaml
    cat > helm-charts/optimal-platform/values.yaml << EOF
# Default values for optimal-platform
replicaCount: 3

image:
  repository: optimal-platform
  pullPolicy: IfNotPresent
  tag: "latest"

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: optimal-platform.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: optimal-platform-tls
      hosts:
        - optimal-platform.example.com

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80

postgresql:
  enabled: true
  auth:
    postgresPassword: "secure_password"
    database: "optimal_platform"
  primary:
    persistence:
      enabled: true
      size: 20Gi

redis:
  enabled: true
  auth:
    enabled: false
  master:
    persistence:
      enabled: true
      size: 10Gi
EOF
    
    print_success "CI/CD pipeline configuration created"
}

# Function to set up backup and disaster recovery
setup_backup() {
    print_status "Setting up backup and disaster recovery..."
    
    # Create backup cronjob
    cat > k8s/backup-cronjob.yaml << EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: optimal-platform-backup
  namespace: optimal-platform
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15
            command:
            - /bin/bash
            - -c
            - |
              pg_dump -h postgresql -U optimal optimal_platform > /backup/backup-$(date +%Y%m%d-%H%M%S).sql
              # Upload to S3 or other cloud storage
              # aws s3 cp /backup/ s3://optimal-platform-backups/ --recursive
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
EOF
    
    # Create backup PVC
    cat > k8s/backup-pvc.yaml << EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: backup-pvc
  namespace: optimal-platform
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
EOF
    
    kubectl apply -f k8s/backup-pvc.yaml
    kubectl apply -f k8s/backup-cronjob.yaml
    
    print_success "Backup and disaster recovery setup completed"
}

# Function to create operational dashboards
setup_dashboards() {
    print_status "Creating operational dashboards..."
    
    # Create Grafana dashboard for Optimal Platform
    cat > monitoring/optimal-platform-dashboard.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "Optimal Platform - Operations Dashboard",
    "tags": ["optimal-platform", "operations"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "System Overview",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"optimal-platform\"}",
            "legendFormat": "Services Up"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF
    
    print_success "Operational dashboards created"
}

# Function to create runbooks
create_runbooks() {
    print_status "Creating operational runbooks..."
    
    # Create runbooks directory
    mkdir -p runbooks
    
    # Incident Response Runbook
    cat > runbooks/incident-response.md << EOF
# Incident Response Runbook

## Severity Levels

### P1 - Critical (15 min response)
- Service completely down
- Security breach detected
- Data loss or corruption
- Complete system failure

**Response:**
1. Immediately page on-call engineer
2. Create incident channel in Slack
3. Start incident timer
4. Begin triage and mitigation
5. Escalate to management if not resolved in 30 minutes

### P2 - High (1 hour response)
- Significant performance degradation
- Major feature broken
- Partial service outage
- Security vulnerability discovered

**Response:**
1. Acknowledge within 1 hour
2. Create incident ticket
3. Begin investigation
4. Escalate if not resolved in 4 hours

### P3 - Medium (4 hour response)
- Minor bugs or issues
- Performance issues
- Feature requests
- Documentation updates

**Response:**
1. Acknowledge within 4 hours
2. Create ticket
3. Schedule for next sprint

### P4 - Low (24 hour response)
- Cosmetic issues
- Enhancement requests
- General questions

**Response:**
1. Acknowledge within 24 hours
2. Create ticket
3. Prioritize with product team

## Communication Templates

### Initial Acknowledgment
\`\`\`
🚨 INCIDENT: [Title]
Severity: P[1-4]
Status: Investigating
Impact: [Description]
ETA: [Time]
\`\`\`

### Status Update
\`\`\`
📊 UPDATE: [Title]
Status: [Investigating/Mitigating/Resolved]
Progress: [Description]
Next Steps: [Action items]
ETA: [Updated time]
\`\`\`

### Resolution
\`\`\`
✅ RESOLVED: [Title]
Root Cause: [Description]
Resolution: [What was done]
Prevention: [How to prevent in future]
\`\`\`
EOF
    
    # Database Maintenance Runbook
    cat > runbooks/database-maintenance.md << EOF
# Database Maintenance Runbook

## Daily Tasks
- [ ] Check database health metrics
- [ ] Review slow query log
- [ ] Verify backup completion
- [ ] Check disk space usage

## Weekly Tasks
- [ ] Analyze query performance
- [ ] Review connection pool usage
- [ ] Check for deadlocks
- [ ] Verify replication status

## Monthly Tasks
- [ ] Update database statistics
- [ ] Review and optimize indexes
- [ ] Check for table bloat
- [ ] Plan capacity upgrades

## Emergency Procedures

### Database Down
1. Check if it's a network issue
2. Verify Kubernetes pod status
3. Check resource usage (CPU, memory, disk)
4. Review logs for errors
5. Restart database pod if needed
6. Restore from backup if corrupted

### Performance Issues
1. Check active connections
2. Review slow queries
3. Check for locks and deadlocks
4. Analyze resource usage
5. Consider scaling up resources
6. Optimize problematic queries

### Data Corruption
1. Stop all writes immediately
2. Assess extent of corruption
3. Restore from most recent backup
4. Replay transaction logs if available
5. Verify data integrity
6. Resume normal operations
EOF
    
    print_success "Operational runbooks created"
}

# Main execution
main() {
    echo "🚀 Starting Optimal Platform operationalization..."
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Create infrastructure
    create_infrastructure
    
    # Set up monitoring
    setup_monitoring
    
    # Set up security
    setup_security
    
    # Set up CI/CD
    setup_cicd
    
    # Set up backup
    setup_backup
    
    # Create dashboards
    setup_dashboards
    
    # Create runbooks
    create_runbooks
    
    echo ""
    echo "🎉 Optimal Platform operationalization completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Review and customize the generated configurations"
    echo "2. Deploy to your Kubernetes cluster"
    echo "3. Configure monitoring and alerting"
    echo "4. Set up CI/CD pipeline in GitLab"
    echo "5. Train your team on operational procedures"
    echo ""
    echo "📚 Documentation:"
    echo "- Operational Plan: OPERATIONALIZATION_PLAN.md"
    echo "- Runbooks: runbooks/"
    echo "- Helm Charts: helm-charts/"
    echo "- Monitoring: monitoring/"
    echo ""
    echo "🔧 Management Commands:"
    echo "- View pods: kubectl get pods -n optimal-platform"
    echo "- View logs: kubectl logs -f deployment/optimal-platform -n optimal-platform"
    echo "- Access Grafana: kubectl port-forward svc/prometheus-grafana 3000:80 -n optimal-platform-monitoring"
    echo "- Access Prometheus: kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n optimal-platform-monitoring"
    echo ""
}

# Run main function
main "$@"
