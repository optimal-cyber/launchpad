# ⚡ Quick Start - Operationalization Guide

## 🎯 Immediate Actions (Next 7 Days)

### **Day 1: Infrastructure Setup**
```bash
# 1. Run the operationalization script
./operationalize.sh

# 2. Set up cloud infrastructure
# Choose your cloud provider and follow the setup guide
# AWS: https://docs.aws.amazon.com/eks/
# GCP: https://cloud.google.com/kubernetes-engine
# Azure: https://docs.microsoft.com/en-us/azure/aks/

# 3. Deploy to Kubernetes
kubectl apply -f k8s/
helm install optimal-platform ./helm-charts/optimal-platform
```

### **Day 2: Security & Monitoring**
```bash
# 1. Set up Keycloak for SSO
kubectl apply -f k8s/keycloak/

# 2. Configure monitoring
helm install prometheus prometheus-community/kube-prometheus-stack
helm install grafana grafana/grafana

# 3. Set up security scanning
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/trivy-operator/main/deploy/static/trivy-operator.yaml
```

### **Day 3: CI/CD Pipeline**
```bash
# 1. Configure GitLab CI/CD
# Copy .gitlab-ci.yml to your GitLab repository
# Set up GitLab Runner in Kubernetes

# 2. Set up container registry
# AWS ECR, GCP GCR, or Azure ACR

# 3. Configure secrets
kubectl create secret generic gitlab-registry --from-literal=username=your-username --from-literal=password=your-token
```

### **Day 4: Database & Storage**
```bash
# 1. Set up PostgreSQL
helm install postgresql bitnami/postgresql

# 2. Set up Redis
helm install redis bitnami/redis

# 3. Configure backups
kubectl apply -f k8s/backup-cronjob.yaml
```

### **Day 5: Service Integration**
```bash
# 1. Configure GitLab integration
# Set GITLAB_TOKEN in your environment
kubectl create secret generic gitlab-token --from-literal=token=your-gitlab-token

# 2. Set up external services
# Configure Jira, Confluence, Vault, etc.

# 3. Test integrations
curl -X GET http://localhost:8000/api/gitlab/projects
```

### **Day 6: Testing & Validation**
```bash
# 1. Run security scans
trivy image optimal-platform:latest

# 2. Run performance tests
k6 run performance-tests.js

# 3. Test all integrations
pytest tests/integration/
```

### **Day 7: Go-Live Preparation**
```bash
# 1. Set up monitoring dashboards
# Access Grafana at http://localhost:3000
# Username: admin, Password: admin

# 2. Configure alerting
# Set up PagerDuty, Slack, or email alerts

# 3. Create runbooks
# Review and customize runbooks/ directory
```

## 🚀 Production Deployment Checklist

### **Pre-Deployment**
- [ ] **Infrastructure**: Kubernetes cluster running
- [ ] **Security**: Keycloak SSO configured
- [ ] **Monitoring**: Prometheus, Grafana, Jaeger deployed
- [ ] **Database**: PostgreSQL and Redis running
- [ ] **Storage**: Object storage configured
- [ ] **CI/CD**: GitLab pipeline working
- [ ] **Testing**: All tests passing
- [ ] **Documentation**: Runbooks and guides ready

### **Deployment**
- [ ] **Blue-Green**: Deploy to production
- [ ] **DNS**: Configure production domain
- [ ] **SSL**: Set up production certificates
- [ ] **Monitoring**: Enable production monitoring
- [ ] **Alerting**: Configure production alerts
- [ ] **Backup**: Verify backup procedures
- [ ] **Security**: Run security scans
- [ ] **Performance**: Validate performance metrics

### **Post-Deployment**
- [ ] **Health Checks**: Verify all services running
- [ ] **Integration Tests**: Test all external integrations
- [ ] **User Testing**: Validate user workflows
- [ ] **Performance**: Monitor response times
- [ ] **Security**: Monitor security events
- [ ] **Backup**: Test backup and restore
- [ ] **Documentation**: Update operational docs
- [ ] **Training**: Train support team

## 📊 Key Commands

### **Kubernetes Management**
```bash
# View all resources
kubectl get all -n optimal-platform

# View logs
kubectl logs -f deployment/optimal-platform -n optimal-platform

# Scale deployment
kubectl scale deployment optimal-platform --replicas=3 -n optimal-platform

# Port forward for local access
kubectl port-forward svc/optimal-platform 3000:80 -n optimal-platform
```

### **Monitoring & Debugging**
```bash
# Access Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n optimal-platform-monitoring

# Access Prometheus
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n optimal-platform-monitoring

# View Jaeger
kubectl port-forward svc/jaeger 16686:16686 -n optimal-platform-monitoring

# Check pod status
kubectl get pods -n optimal-platform
kubectl describe pod <pod-name> -n optimal-platform
```

### **Database Management**
```bash
# Connect to PostgreSQL
kubectl exec -it postgresql-0 -n optimal-platform -- psql -U optimal

# Connect to Redis
kubectl exec -it redis-master-0 -n optimal-platform -- redis-cli

# Backup database
kubectl exec -it postgresql-0 -n optimal-platform -- pg_dump -U optimal optimal_platform > backup.sql
```

### **Security & Compliance**
```bash
# Run security scans
trivy image optimal-platform:latest
trivy k8s cluster

# Check RBAC
kubectl auth can-i get pods --as=system:serviceaccount:optimal-platform:optimal-platform

# View security policies
kubectl get networkpolicies -n optimal-platform
kubectl get podsecuritypolicies
```

## 🔧 Troubleshooting

### **Common Issues**

#### **Pod Not Starting**
```bash
# Check pod status
kubectl get pods -n optimal-platform
kubectl describe pod <pod-name> -n optimal-platform

# Check logs
kubectl logs <pod-name> -n optimal-platform

# Check events
kubectl get events -n optimal-platform
```

#### **Database Connection Issues**
```bash
# Check database status
kubectl get pods -n optimal-platform | grep postgres

# Check database logs
kubectl logs postgresql-0 -n optimal-platform

# Test connection
kubectl exec -it postgresql-0 -n optimal-platform -- psql -U optimal -c "SELECT 1;"
```

#### **Service Integration Issues**
```bash
# Check service endpoints
kubectl get svc -n optimal-platform

# Test API endpoints
curl -X GET http://localhost:8000/health

# Check external service connectivity
kubectl exec -it optimal-platform-0 -n optimal-platform -- curl -X GET https://gitlab.com/api/v4/projects
```

#### **Performance Issues**
```bash
# Check resource usage
kubectl top pods -n optimal-platform
kubectl top nodes

# Check metrics
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n optimal-platform-monitoring
# Open http://localhost:9090 in browser

# Check logs for errors
kubectl logs -f deployment/optimal-platform -n optimal-platform | grep ERROR
```

## 📞 Support & Resources

### **Documentation**
- **Operational Plan**: `OPERATIONALIZATION_PLAN.md`
- **Implementation Roadmap**: `IMPLEMENTATION_ROADMAP.md`
- **Business Model**: `BUSINESS_MODEL.md`
- **Runbooks**: `runbooks/` directory

### **Monitoring Dashboards**
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686

### **Key Files**
- **Docker Compose**: `docker-compose.keycloak.yml`
- **Kubernetes**: `k8s/` directory
- **Helm Charts**: `helm-charts/` directory
- **CI/CD**: `.gitlab-ci.yml`

### **Emergency Contacts**
- **On-Call Engineer**: [Your contact info]
- **Security Team**: [Security contact]
- **Database Admin**: [DBA contact]
- **Cloud Provider**: [Cloud support]

---

**Status**: 🟢 Ready for immediate execution
**Time to Production**: 7 days with this guide
**Next Action**: Start with Day 1 infrastructure setup
