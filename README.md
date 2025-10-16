# 🚀 Optimal Platform - Application Security Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-blue.svg)](https://kubernetes.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-green.svg)](https://www.python.org/)

> **Next-generation Application Security (AppSec) platform that unifies development, security, and operations teams through AI-powered security testing, real-time monitoring, and seamless integrations.**

## 🌟 Features

### 🔐 **AI-Powered Security Testing**
- **Automated Vulnerability Scanning** - SAST, DAST, and container scanning
- **AI Red Teaming** - Automated security testing with AI models
- **Threat Modeling** - Intelligent threat assessment and risk analysis
- **Compliance Automation** - SOC 2, ISO 27001, FedRAMP compliance

### 🔗 **Unified Platform Integration**
- **GitLab Integration** - Real-time project monitoring and CI/CD security
- **Keycloak SSO** - Single sign-on across all platform services
- **Service Catalog** - Jira, Confluence, Harbor, Vault, Grafana, and more
- **API Gateway** - Centralized API management and security

### 📊 **Real-Time Monitoring & Analytics**
- **Live Dashboard** - Real-time security posture and metrics
- **Runtime Security** - Container and application runtime monitoring
- **Performance Analytics** - Application performance and security insights
- **Custom Dashboards** - Grafana integration for advanced visualization

### 🛡️ **Enterprise Security**
- **Zero-Trust Architecture** - Network policies and access controls
- **Secrets Management** - HashiCorp Vault integration
- **Audit Logging** - Comprehensive security event logging
- **Incident Response** - Automated alerting and response procedures

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI    │    │   API Gateway   │    │   Keycloak SSO  │
│   (Frontend)    │◄──►│   (FastAPI)     │◄──►│   (Auth)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────▼────────┐              │
         │              │   Microservices │              │
         │              │   • SBOM Service│              │
         │              │   • Vuln Service│              │
         │              │   • Worker      │              │
         │              └────────┬────────┘              │
         │                       │                       │
         │              ┌────────▼────────┐              │
         │              │   Data Layer    │              │
         │              │   • PostgreSQL  │              │
         │              │   • Redis       │              │
         │              │   • Prometheus  │              │
         │              └─────────────────┘              │
         │                                               │
         └───────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### 1. Clone the Repository
```bash
git clone https://github.com/optimal-cyber/optimal-platform.git
cd optimal-platform
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

### 3. Start the Platform
```bash
# Development environment
./scripts/setup/dev-setup.sh

# Or using Docker Compose directly
docker-compose -f docker-compose.dev.yml up -d
```

### 4. Access the Platform
- **Main Dashboard**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

## 📁 Project Structure

```
optimal-platform/
├── 📁 apps/                          # Application components
│   ├── 📁 api-gateway/               # FastAPI backend
│   └── 📁 portal/                    # Next.js frontend
├── 📁 services/                      # Microservices
│   ├── 📁 sbom-service/              # SBOM management
│   ├── 📁 vuln-service/              # Vulnerability management
│   └── 📁 worker/                    # Background processing
├── 📁 agents/                        # Security agents
│   └── 📁 runtime-security-agent/    # Runtime monitoring
├── 📁 integrations/                  # External integrations
│   └── 📁 gitlab-listener/           # GitLab webhook listener
├── 📁 docs/                          # Documentation
│   ├── 📁 business/                  # Business documentation
│   ├── 📁 technical/                 # Technical guides
│   └── 📁 operations/                # Operational procedures
├── 📁 scripts/                       # Automation scripts
│   ├── 📁 setup/                     # Setup scripts
│   ├── 📁 deployment/                # Deployment scripts
│   └── 📁 maintenance/               # Maintenance scripts
├── 📁 examples/                      # Examples and samples
│   ├── 📁 configs/                   # Configuration examples
│   └── 📁 samples/                   # Code samples
├── 📁 k8s/                          # Kubernetes manifests
└── 📁 infra/                        # Infrastructure configs
```

## 🔧 Development

### Local Development Setup
```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Run tests
npm test
pytest tests/
```

### Building for Production
```bash
# Build all services
docker-compose build

# Deploy to production
./scripts/deployment/deploy-production.sh
```

## 📚 Documentation

- **[Business Model](docs/business/BUSINESS_MODEL.md)** - Business strategy and pricing
- **[Implementation Roadmap](docs/business/IMPLEMENTATION_ROADMAP.md)** - Development timeline
- **[Production Setup](docs/technical/PRODUCTION_SETUP_GUIDE.md)** - Production deployment
- **[Keycloak Setup](docs/technical/KEYCLOAK_SETUP_GUIDE.md)** - SSO configuration
- **[Quick Start](docs/business/QUICK_START_OPERATIONALIZATION.md)** - 7-day setup guide

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **FastAPI** - Python API framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **Celery** - Background tasks

### Infrastructure
- **Docker** - Containerization
- **Kubernetes** - Orchestration
- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **Keycloak** - Identity management

### Security
- **Trivy** - Vulnerability scanning
- **Syft** - SBOM generation
- **Falco** - Runtime security
- **OPA Gatekeeper** - Policy enforcement

## 🔒 Security

- **Vulnerability Scanning** - Automated security testing
- **Secrets Management** - Secure credential handling
- **Network Policies** - Zero-trust networking
- **Audit Logging** - Comprehensive event tracking
- **Compliance** - SOC 2, ISO 27001, FedRAMP ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/optimal-cyber/optimal-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/optimal-cyber/optimal-platform/discussions)

## 🚀 Roadmap

- [ ] **Q1 2024**: Core platform features
- [ ] **Q2 2024**: AI security enhancements
- [ ] **Q3 2024**: Enterprise integrations
- [ ] **Q4 2024**: Compliance automation

---

**Built with ❤️ by the Optimal Cyber team**

[Website](https://optimal-cyber.com) • [Documentation](docs/) • [Support](https://github.com/optimal-cyber/optimal-platform/issues)