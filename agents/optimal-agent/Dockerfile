# Optimal Security Agent
# Runs as a DaemonSet on Kubernetes nodes for security monitoring

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install Trivy for vulnerability scanning
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin v0.48.0

# Install Syft for SBOM generation
RUN curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin v0.100.0

# Create non-root user (will run as root in DaemonSet for container access)
RUN useradd -m -u 1000 agent

# Set working directory
WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
COPY agent.py .
COPY config.py .

# Create directories for temporary files
RUN mkdir -p /app/tmp /app/cache && \
    chown -R agent:agent /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Environment defaults
ENV OPTIMAL_API_URL=http://api-gateway:8000 \
    OPTIMAL_HEARTBEAT_INTERVAL=30 \
    OPTIMAL_SCAN_INTERVAL=300 \
    OPTIMAL_LOG_LEVEL=INFO \
    OPTIMAL_VULN_SCANNING=true \
    OPTIMAL_RUNTIME_SECURITY=true \
    OPTIMAL_SBOM_GENERATION=true \
    PYTHONUNBUFFERED=1

# Expose metrics port
EXPOSE 8080

# Run agent
CMD ["python", "agent.py"]
