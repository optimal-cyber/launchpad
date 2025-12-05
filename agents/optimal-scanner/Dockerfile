# Optimal Scanner Agent
# Lightweight vulnerability scanner for containers and filesystems

FROM python:3.11-slim

LABEL maintainer="support@gooptimal.io"
LABEL description="Optimal Scanner Agent - Lightweight vulnerability scanner"
LABEL version="1.0.0"

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Grype scanner
RUN curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

# Install Trivy scanner (optional)
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy scanner code
COPY scanner.py .

# Create non-root user
RUN useradd -m -u 1000 scanner
USER scanner

# Set entrypoint
ENTRYPOINT ["python", "scanner.py"]

# Default command shows help
CMD ["--help"]

