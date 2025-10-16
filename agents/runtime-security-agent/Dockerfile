FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    procps \
    net-tools \
    wget \
    lsb-release \
    gnupg \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Trivy for vulnerability scanning
RUN wget -qO- https://github.com/aquasecurity/trivy/releases/latest/download/trivy_$(wget -qO- https://api.github.com/repos/aquasecurity/trivy/releases/latest | grep -o '"tag_name": "[^"]*' | grep -o '[^"]*$' | sed 's/v//')_Linux-64bit.tar.gz | tar -xz -C /tmp \
    && mv /tmp/trivy /usr/local/bin/trivy \
    && chmod +x /usr/local/bin/trivy

# Install Syft for SBOM generation
RUN curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 agent && chown -R agent:agent /app
USER agent

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8080/health')"

# Expose health check port
EXPOSE 8080

# Run the agent
CMD ["python", "main.py"]
