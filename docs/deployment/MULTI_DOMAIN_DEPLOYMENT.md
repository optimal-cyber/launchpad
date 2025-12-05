# Multi-Domain Deployment Guide for Optimal Platform

## Overview
Deploy Optimal Platform with multiple subdomains for free public access, allowing users to explore different services independently.

## Domain Architecture

### Primary Domains
```
portal.gooptimal.io          → Main Launchpad Platform (Portal/Dashboard)
hub.gooptimal.io             → Central Hub & Product Catalog
observability.gooptimal.io   → Grafana Monitoring
gitlab.gooptimal.io          → GitLab (Source Control & CI/CD)
harbor.gooptimal.io          → Harbor (Container Registry)
vault.gooptimal.io           → Vault (Secrets Management)
confluence.gooptimal.io      → Confluence (Documentation)
rocketchat.gooptimal.io      → Rocket.Chat (Team Communication)
```

### Optional Service Domains
```
api.gooptimal.io             → API Gateway
keycloak.gooptimal.io        → Keycloak (Authentication/SSO)
prometheus.gooptimal.io      → Prometheus (Metrics)
kibana.gooptimal.io          → Kibana (Log Analysis)
```

## DNS Configuration

### Cloudflare/DNS Provider Setup
For each subdomain, create an A record pointing to your server IP:

```
Type: A
Name: portal
Content: YOUR_SERVER_IP
Proxy: Enabled (for Cloudflare)
TTL: Auto
```

Repeat for all subdomains: `hub`, `observability`, `gitlab`, `harbor`, etc.

## Nginx Reverse Proxy Configuration

### Install Nginx
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Main Nginx Configuration
Create `/etc/nginx/conf.d/optimal-platform.conf`:

```nginx
# Portal (Main Platform)
server {
    listen 80;
    server_name portal.gooptimal.io;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Hub (Product Catalog)
server {
    listen 80;
    server_name hub.gooptimal.io;

    location / {
        proxy_pass http://localhost:3000/products;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Grafana (Observability)
server {
    listen 80;
    server_name observability.gooptimal.io;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# GitLab
server {
    listen 80;
    server_name gitlab.gooptimal.io;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Harbor (Container Registry)
server {
    listen 80;
    server_name harbor.gooptimal.io;

    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Keycloak (Authentication)
server {
    listen 80;
    server_name keycloak.gooptimal.io;

    location / {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Gateway
server {
    listen 80;
    server_name api.gooptimal.io;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Test Nginx Configuration
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificates (Let's Encrypt)

### Generate Certificates for All Domains
```bash
sudo certbot --nginx -d portal.gooptimal.io \
  -d hub.gooptimal.io \
  -d observability.gooptimal.io \
  -d gitlab.gooptimal.io \
  -d harbor.gooptimal.io \
  -d vault.gooptimal.io \
  -d keycloak.gooptimal.io \
  -d api.gooptimal.io
```

### Auto-Renewal
Certbot automatically sets up renewal. Test it:
```bash
sudo certbot renew --dry-run
```

## Docker Compose Production Configuration

Update `docker-compose.yml` for production:

```yaml
version: '3.8'

services:
  portal:
    build: ./apps/portal
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.gooptimal.io
      - NEXT_PUBLIC_KEYCLOAK_URL=https://keycloak.gooptimal.io
    restart: unless-stopped
    networks:
      - optimal-network

  api-gateway:
    build: ./apps/api-gateway
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
    restart: unless-stopped
    networks:
      - optimal-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SERVER_ROOT_URL=https://observability.gooptimal.io
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
    restart: unless-stopped
    networks:
      - optimal-network

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./infra/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    restart: unless-stopped
    networks:
      - optimal-network

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=optimal
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_MULTIPLE_DATABASES=optimal,keycloak
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/init-multiple-databases.sh:/docker-entrypoint-initdb.d/init-multiple-databases.sh
    restart: unless-stopped
    networks:
      - optimal-network

  keycloak:
    image: quay.io/keycloak/keycloak:latest
    ports:
      - "8082:8080"
    environment:
      - KC_DB=postgres
      - KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak
      - KC_DB_USERNAME=optimal
      - KC_DB_PASSWORD=${POSTGRES_PASSWORD}
      - KC_HOSTNAME=keycloak.gooptimal.io
      - KC_PROXY=edge
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD}
    command: start --optimized
    depends_on:
      - postgres
    restart: unless-stopped
    networks:
      - optimal-network

networks:
  optimal-network:
    driver: bridge

volumes:
  grafana-data:
  prometheus-data:
  postgres-data:
```

## Environment Variables

Create `.env.production`:

```bash
# Database
POSTGRES_PASSWORD=your-secure-password-here

# Keycloak
KEYCLOAK_ADMIN_PASSWORD=your-admin-password-here

# Grafana
GRAFANA_ADMIN_PASSWORD=your-grafana-password-here

# API Keys
API_SECRET_KEY=your-secret-key-here

# Domain Configuration
DOMAIN=gooptimal.io
PORTAL_URL=https://portal.gooptimal.io
API_URL=https://api.gooptimal.io
```

## Deployment Steps

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 2. Clone Repository
```bash
git clone https://github.com/your-org/optimal-platform.git
cd optimal-platform
```

### 3. Configure Environment
```bash
cp .env.example .env.production
nano .env.production  # Edit with your values
```

### 4. Deploy Services
```bash
# Start all services
docker-compose -f docker-compose.yml --env-file .env.production up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f portal
```

### 5. Configure Nginx & SSL
```bash
# Copy nginx config
sudo cp docs/deployment/nginx/optimal-platform.conf /etc/nginx/conf.d/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Generate SSL certificates
sudo certbot --nginx -d portal.gooptimal.io -d hub.gooptimal.io ...
```

## Free Tier Considerations

### Resource Limits
For free public access, implement:

1. **Rate Limiting** (Nginx):
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    location / {
        limit_req zone=api burst=20;
        ...
    }
}
```

2. **User Quotas**:
- Max 3 projects per free user
- Max 100 vulnerability scans per month
- Max 10 SBOM analyses per month

3. **Demo Mode**:
- Read-only access to sample data
- Full write access after authentication
- Auto-cleanup of demo projects after 7 days

### Cost Optimization
- **Server**: Digital Ocean Droplet ($20-40/month) or AWS EC2 t3.medium
- **Storage**: 100GB SSD should be sufficient for free tier
- **Bandwidth**: Cloudflare free tier for CDN/DDoS protection

## Monitoring & Maintenance

### Health Checks
```bash
# Check all services
curl https://portal.gooptimal.io/api/health
curl https://api.gooptimal.io/health
```

### Automated Backups
```bash
# Daily backup script
0 2 * * * docker exec optimal-platform-postgres-1 pg_dump -U optimal optimal > /backup/optimal-$(date +\%Y\%m\%d).sql
```

### Log Rotation
```bash
# Configure Docker logging
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## Marketing Landing Page

Update landing page to showcase all accessible domains:

```typescript
const services = [
  {
    name: "Portal",
    url: "https://portal.gooptimal.io",
    description: "Main platform dashboard"
  },
  {
    name: "Products Hub",
    url: "https://hub.gooptimal.io",
    description: "Explore all integrated tools"
  },
  {
    name: "Observability",
    url: "https://observability.gooptimal.io",
    description: "Live Grafana monitoring"
  }
];
```

## Next Steps

1. Set up DNS records for all subdomains
2. Configure Nginx reverse proxy
3. Deploy services with Docker Compose
4. Generate SSL certificates
5. Test all domains and services
6. Set up monitoring and alerts
7. Create user documentation
8. Launch marketing site with domain links

## Support

For issues or questions:
- GitHub: https://github.com/your-org/optimal-platform
- Docs: https://docs.gooptimal.io
- Email: support@gooptimal.io

