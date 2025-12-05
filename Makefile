# =============================================================================
# Optimal Platform - Developer-Friendly Makefile
# Enterprise DevSecOps Platform
# =============================================================================
#
# Usage:
#   make help                    Show available commands
#   make dev                     Start local development environment
#   make deploy-aws ENV=staging  Deploy to AWS (staging)
#   make deploy-gcp ENV=prod     Deploy to GCP (production)
#
# =============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
PROJECT_NAME := optimal-platform
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIME := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

# Environment (development, staging, production)
ENV ?= development

# Cloud provider (aws, gcp)
CLOUD ?= aws

# AWS Configuration
AWS_REGION ?= us-east-1
AWS_ACCOUNT_ID ?= $(shell aws sts get-caller-identity --query Account --output text 2>/dev/null)

# GCP Configuration
GCP_PROJECT ?= $(shell gcloud config get-value project 2>/dev/null)
GCP_REGION ?= us-central1

# Kubernetes Configuration
KUBECONFIG ?= ~/.kube/config
NAMESPACE ?= optimal-system

# Helm Configuration
HELM_RELEASE := optimal-platform
HELM_CHART := ./k8s/helm-charts/optimal-platform

# Docker Configuration
DOCKER_REGISTRY_AWS := $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com
DOCKER_REGISTRY_GCP := $(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT)/optimal

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

# -----------------------------------------------------------------------------
# Help
# -----------------------------------------------------------------------------
.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "$(CYAN)╔══════════════════════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║              Optimal Platform - Enterprise DevSecOps Platform               ║$(NC)"
	@echo "$(CYAN)╚══════════════════════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Usage:$(NC)"
	@echo "  make $(YELLOW)<target>$(NC) [OPTIONS]"
	@echo ""
	@echo "$(GREEN)Options:$(NC)"
	@echo "  $(YELLOW)ENV$(NC)=development|staging|production  Environment to deploy (default: development)"
	@echo "  $(YELLOW)CLOUD$(NC)=aws|gcp                        Cloud provider (default: aws)"
	@echo ""
	@echo "$(GREEN)Available Commands:$(NC)"
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) }' $(MAKEFILE_LIST)
	@echo ""

##@ Development

.PHONY: dev
dev: ## Start local development environment with Docker Compose
	@echo "$(GREEN)Starting local development environment...$(NC)"
	docker compose -f docker-compose.dev.yml up -d --build
	@echo ""
	@echo "$(GREEN)✅ Development environment started!$(NC)"
	@echo ""
	@echo "$(CYAN)Services:$(NC)"
	@echo "  • Portal:      http://localhost:3000"
	@echo "  • API Gateway: http://localhost:8000"
	@echo "  • API Docs:    http://localhost:8000/docs"
	@echo "  • Grafana:     http://localhost:3001"
	@echo ""

.PHONY: dev-stop
dev-stop: ## Stop local development environment
	@echo "$(YELLOW)Stopping development environment...$(NC)"
	docker compose -f docker-compose.dev.yml down
	@echo "$(GREEN)✅ Development environment stopped$(NC)"

.PHONY: dev-logs
dev-logs: ## View development environment logs
	docker compose -f docker-compose.dev.yml logs -f

.PHONY: dev-reset
dev-reset: ## Reset development environment (removes all data)
	@echo "$(RED)WARNING: This will remove all local data!$(NC)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ]
	docker compose -f docker-compose.dev.yml down -v --remove-orphans
	@echo "$(GREEN)✅ Development environment reset$(NC)"

##@ Building

.PHONY: build
build: ## Build all Docker images
	@echo "$(GREEN)Building Docker images...$(NC)"
	docker compose build
	@echo "$(GREEN)✅ All images built$(NC)"

.PHONY: build-portal
build-portal: ## Build portal image only
	docker build -t $(PROJECT_NAME)/portal:$(VERSION) ./apps/portal

.PHONY: build-api
build-api: ## Build API gateway image only
	docker build -t $(PROJECT_NAME)/api-gateway:$(VERSION) ./apps/api-gateway

.PHONY: push
push: ## Push images to container registry
ifeq ($(CLOUD),aws)
	@$(MAKE) push-aws
else
	@$(MAKE) push-gcp
endif

.PHONY: push-aws
push-aws: ## Push images to AWS ECR
	@echo "$(GREEN)Pushing images to AWS ECR...$(NC)"
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(DOCKER_REGISTRY_AWS)
	@for service in portal api-gateway sbom-service vuln-service gitlab-listener worker; do \
		echo "Pushing $$service..."; \
		docker tag $(PROJECT_NAME)/$$service:$(VERSION) $(DOCKER_REGISTRY_AWS)/optimal-platform/$$service:$(VERSION); \
		docker push $(DOCKER_REGISTRY_AWS)/optimal-platform/$$service:$(VERSION); \
	done
	@echo "$(GREEN)✅ All images pushed to ECR$(NC)"

.PHONY: push-gcp
push-gcp: ## Push images to GCP Artifact Registry
	@echo "$(GREEN)Pushing images to GCP Artifact Registry...$(NC)"
	gcloud auth configure-docker $(GCP_REGION)-docker.pkg.dev --quiet
	@for service in portal api-gateway sbom-service vuln-service gitlab-listener worker; do \
		echo "Pushing $$service..."; \
		docker tag $(PROJECT_NAME)/$$service:$(VERSION) $(DOCKER_REGISTRY_GCP)-$$service:$(VERSION); \
		docker push $(DOCKER_REGISTRY_GCP)-$$service:$(VERSION); \
	done
	@echo "$(GREEN)✅ All images pushed to Artifact Registry$(NC)"

##@ Infrastructure

.PHONY: infra-init
infra-init: ## Initialize Terraform for selected cloud provider
	@echo "$(GREEN)Initializing Terraform for $(CLOUD)...$(NC)"
	cd infra/terraform/$(CLOUD) && terraform init
	@echo "$(GREEN)✅ Terraform initialized$(NC)"

.PHONY: infra-plan
infra-plan: ## Plan infrastructure changes
	@echo "$(GREEN)Planning infrastructure for $(ENV) on $(CLOUD)...$(NC)"
	cd infra/terraform/$(CLOUD) && terraform plan -var-file=environments/$(ENV).tfvars -out=tfplan
	@echo "$(GREEN)✅ Plan complete - review above changes$(NC)"

.PHONY: infra-apply
infra-apply: ## Apply infrastructure changes
	@echo "$(YELLOW)Applying infrastructure for $(ENV) on $(CLOUD)...$(NC)"
	cd infra/terraform/$(CLOUD) && terraform apply tfplan
	@echo "$(GREEN)✅ Infrastructure deployed$(NC)"

.PHONY: infra-destroy
infra-destroy: ## Destroy infrastructure (DANGEROUS!)
	@echo "$(RED)WARNING: This will destroy ALL infrastructure in $(ENV)!$(NC)"
	@read -p "Type 'destroy $(ENV)' to confirm: " confirm && [ "$$confirm" = "destroy $(ENV)" ]
	cd infra/terraform/$(CLOUD) && terraform destroy -var-file=environments/$(ENV).tfvars

.PHONY: infra-output
infra-output: ## Show infrastructure outputs
	cd infra/terraform/$(CLOUD) && terraform output

##@ Kubernetes / Helm Deployment

.PHONY: kubeconfig
kubeconfig: ## Configure kubectl for the cluster
ifeq ($(CLOUD),aws)
	@echo "$(GREEN)Configuring kubectl for AWS EKS...$(NC)"
	aws eks update-kubeconfig --region $(AWS_REGION) --name optimal-$(ENV)
else
	@echo "$(GREEN)Configuring kubectl for GCP GKE...$(NC)"
	gcloud container clusters get-credentials optimal-$(ENV) --region $(GCP_REGION) --project $(GCP_PROJECT)
endif
	@echo "$(GREEN)✅ kubectl configured$(NC)"

.PHONY: deploy
deploy: ## Deploy to Kubernetes (use CLOUD=aws|gcp and ENV=development|staging|production)
	@echo "$(GREEN)Deploying Optimal Platform to $(ENV) on $(CLOUD)...$(NC)"
	@$(MAKE) kubeconfig
	@$(MAKE) helm-upgrade
	@echo "$(GREEN)✅ Deployment complete!$(NC)"

.PHONY: deploy-aws
deploy-aws: ## Deploy to AWS EKS
	CLOUD=aws $(MAKE) deploy

.PHONY: deploy-gcp
deploy-gcp: ## Deploy to GCP GKE
	CLOUD=gcp $(MAKE) deploy

.PHONY: helm-deps
helm-deps: ## Update Helm chart dependencies
	@echo "$(GREEN)Updating Helm dependencies...$(NC)"
	helm dependency update $(HELM_CHART)
	@echo "$(GREEN)✅ Dependencies updated$(NC)"

.PHONY: helm-template
helm-template: ## Template Helm chart (dry-run)
	helm template $(HELM_RELEASE) $(HELM_CHART) \
		--namespace $(NAMESPACE) \
		-f $(HELM_CHART)/values.yaml \
		-f $(HELM_CHART)/values-$(ENV).yaml

.PHONY: helm-upgrade
helm-upgrade: helm-deps ## Deploy/upgrade using Helm
	@echo "$(GREEN)Deploying with Helm...$(NC)"
	kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	helm upgrade --install $(HELM_RELEASE) $(HELM_CHART) \
		--namespace $(NAMESPACE) \
		--create-namespace \
		-f $(HELM_CHART)/values.yaml \
		-f $(HELM_CHART)/values-$(ENV).yaml \
		--set global.environment=$(ENV) \
		--set global.imageTag=$(VERSION) \
		--wait --timeout 10m
	@echo "$(GREEN)✅ Helm deployment complete$(NC)"

.PHONY: helm-rollback
helm-rollback: ## Rollback to previous Helm release
	@echo "$(YELLOW)Rolling back to previous release...$(NC)"
	helm rollback $(HELM_RELEASE) --namespace $(NAMESPACE)
	@echo "$(GREEN)✅ Rollback complete$(NC)"

.PHONY: helm-status
helm-status: ## Show Helm release status
	helm status $(HELM_RELEASE) --namespace $(NAMESPACE)

.PHONY: helm-history
helm-history: ## Show Helm release history
	helm history $(HELM_RELEASE) --namespace $(NAMESPACE)

##@ Quick Deploy Commands

.PHONY: deploy-dev-aws
deploy-dev-aws: ## Deploy development to AWS
	ENV=development CLOUD=aws $(MAKE) deploy

.PHONY: deploy-staging-aws
deploy-staging-aws: ## Deploy staging to AWS
	ENV=staging CLOUD=aws $(MAKE) deploy

.PHONY: deploy-prod-aws
deploy-prod-aws: ## Deploy production to AWS (requires confirmation)
	@echo "$(RED)WARNING: Deploying to PRODUCTION on AWS!$(NC)"
	@read -p "Type 'deploy production' to confirm: " confirm && [ "$$confirm" = "deploy production" ]
	ENV=production CLOUD=aws $(MAKE) deploy

.PHONY: deploy-dev-gcp
deploy-dev-gcp: ## Deploy development to GCP
	ENV=development CLOUD=gcp $(MAKE) deploy

.PHONY: deploy-staging-gcp
deploy-staging-gcp: ## Deploy staging to GCP
	ENV=staging CLOUD=gcp $(MAKE) deploy

.PHONY: deploy-prod-gcp
deploy-prod-gcp: ## Deploy production to GCP (requires confirmation)
	@echo "$(RED)WARNING: Deploying to PRODUCTION on GCP!$(NC)"
	@read -p "Type 'deploy production' to confirm: " confirm && [ "$$confirm" = "deploy production" ]
	ENV=production CLOUD=gcp $(MAKE) deploy

##@ Monitoring & Debugging

.PHONY: status
status: ## Show deployment status
	@echo "$(GREEN)Deployment Status:$(NC)"
	kubectl get pods -n $(NAMESPACE)
	@echo ""
	kubectl get svc -n $(NAMESPACE)
	@echo ""
	kubectl get ingress -n $(NAMESPACE)

.PHONY: logs
logs: ## View logs for a service (SERVICE=portal|api-gateway|etc)
ifndef SERVICE
	@echo "$(RED)Please specify SERVICE=<service-name>$(NC)"
	@echo "Example: make logs SERVICE=portal"
else
	kubectl logs -f -l app.kubernetes.io/component=$(SERVICE) -n $(NAMESPACE)
endif

.PHONY: shell
shell: ## Open shell in a pod (SERVICE=portal|api-gateway|etc)
ifndef SERVICE
	@echo "$(RED)Please specify SERVICE=<service-name>$(NC)"
	@echo "Example: make shell SERVICE=portal"
else
	kubectl exec -it $$(kubectl get pod -l app.kubernetes.io/component=$(SERVICE) -n $(NAMESPACE) -o jsonpath='{.items[0].metadata.name}') -n $(NAMESPACE) -- /bin/sh
endif

.PHONY: port-forward
port-forward: ## Port forward services locally
	@echo "$(GREEN)Starting port forwards...$(NC)"
	@echo "Portal:      http://localhost:3000"
	@echo "API Gateway: http://localhost:8000"
	@echo "Grafana:     http://localhost:3001"
	@echo ""
	kubectl port-forward svc/$(HELM_RELEASE)-portal 3000:3000 -n $(NAMESPACE) &
	kubectl port-forward svc/$(HELM_RELEASE)-api-gateway 8000:8000 -n $(NAMESPACE) &
	kubectl port-forward svc/$(HELM_RELEASE)-grafana 3001:80 -n $(NAMESPACE) &
	@echo "$(GREEN)Press Ctrl+C to stop$(NC)"
	@wait

##@ Testing

.PHONY: test
test: ## Run all tests
	@echo "$(GREEN)Running tests...$(NC)"
	cd apps/portal && npm test
	cd apps/api-gateway && python -m pytest
	@echo "$(GREEN)✅ All tests passed$(NC)"

.PHONY: lint
lint: ## Run linters
	@echo "$(GREEN)Running linters...$(NC)"
	cd apps/portal && npm run lint
	cd apps/api-gateway && python -m flake8
	@echo "$(GREEN)✅ Linting complete$(NC)"

.PHONY: security-scan
security-scan: ## Run security scans on images
	@echo "$(GREEN)Running security scans...$(NC)"
	@for service in portal api-gateway; do \
		echo "Scanning $$service..."; \
		docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image $(PROJECT_NAME)/$$service:$(VERSION); \
	done
	@echo "$(GREEN)✅ Security scan complete$(NC)"

##@ Utilities

.PHONY: clean
clean: ## Clean build artifacts
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	rm -rf infra/terraform/*/.terraform
	rm -rf infra/terraform/*/tfplan
	docker system prune -f
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

.PHONY: version
version: ## Show version information
	@echo "$(CYAN)Optimal Platform$(NC)"
	@echo "  Version: $(VERSION)"
	@echo "  Commit:  $(COMMIT)"
	@echo "  Built:   $(BUILD_TIME)"

.PHONY: doctor
doctor: ## Check system requirements
	@echo "$(GREEN)Checking system requirements...$(NC)"
	@echo ""
	@echo "$(CYAN)Required tools:$(NC)"
	@command -v docker >/dev/null 2>&1 && echo "  ✅ Docker" || echo "  ❌ Docker (required)"
	@command -v kubectl >/dev/null 2>&1 && echo "  ✅ kubectl" || echo "  ❌ kubectl (required)"
	@command -v helm >/dev/null 2>&1 && echo "  ✅ Helm" || echo "  ❌ Helm (required)"
	@command -v terraform >/dev/null 2>&1 && echo "  ✅ Terraform" || echo "  ❌ Terraform (required)"
	@echo ""
	@echo "$(CYAN)AWS tools:$(NC)"
	@command -v aws >/dev/null 2>&1 && echo "  ✅ AWS CLI" || echo "  ❌ AWS CLI (for AWS deployments)"
	@echo ""
	@echo "$(CYAN)GCP tools:$(NC)"
	@command -v gcloud >/dev/null 2>&1 && echo "  ✅ gcloud CLI" || echo "  ❌ gcloud CLI (for GCP deployments)"
	@echo ""

.PHONY: setup
setup: ## Initial setup for development
	@echo "$(GREEN)Setting up development environment...$(NC)"
	@echo "Copying environment files..."
	cp -n .env.example .env 2>/dev/null || true
	cp -n infra/terraform/aws/terraform.tfvars.example infra/terraform/aws/terraform.tfvars 2>/dev/null || true
	cp -n infra/terraform/gcp/terraform.tfvars.example infra/terraform/gcp/terraform.tfvars 2>/dev/null || true
	@echo "Installing dependencies..."
	cd apps/portal && npm install
	@echo "$(GREEN)✅ Setup complete!$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Edit .env with your configuration"
	@echo "  2. Edit infra/terraform/aws/terraform.tfvars or infra/terraform/gcp/terraform.tfvars"
	@echo "  3. Run 'make dev' to start local development"
	@echo "  4. Run 'make deploy-dev-aws' or 'make deploy-dev-gcp' for cloud deployment"

