# Optimal Scanner Agent

Lightweight vulnerability scanner that integrates with the Optimal Platform. Scan container images, running containers, and filesystems for security vulnerabilities.

## Quick Install

### Docker (Recommended)

```bash
docker run -d --name optimal-scanner \
  -v /var/run/docker.sock:/var/run/docker.sock \
  optimal/scanner:latest \
  --api-url https://api.gooptimal.io \
  --token YOUR_API_TOKEN \
  --daemon --interval 300
```

### One-Line Install

```bash
curl -sSL https://get.gooptimal.io/scanner | bash -s -- YOUR_API_TOKEN
```

### Kubernetes (Helm)

```bash
helm install optimal-scanner optimal/scanner \
  --set apiUrl=https://api.gooptimal.io \
  --set apiToken=YOUR_API_TOKEN \
  --namespace optimal-system \
  --create-namespace
```

## Usage

### Scan a Container Image

```bash
optimal-scan --image nginx:latest
```

### Scan All Running Containers

```bash
optimal-scan --all-containers
```

### Scan a Directory

```bash
optimal-scan --path /app
```

### Run in Daemon Mode

Continuously scan every 5 minutes:

```bash
optimal-scan --daemon --interval 300
```

## Getting Your API Token

1. Go to [Optimal Platform](https://portal.gooptimal.io/onboarding)
2. Sign up or log in
3. Generate an API token
4. Copy the token and use it with the scanner

## How It Works

1. **Agent Registration** - The scanner registers with the Optimal Platform API
2. **Scanning** - Uses Grype or Trivy to scan for vulnerabilities
3. **Reporting** - Sends findings to the platform in real-time
4. **Monitoring** - View results in the Optimal Hub dashboard

## Supported Scanners

- **Grype** (default) - Fast, accurate container scanning
- **Trivy** - Comprehensive vulnerability database
- **Demo mode** - Built-in demo data for testing

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPTIMAL_API_URL` | Platform API URL | https://api.gooptimal.io |
| `OPTIMAL_API_TOKEN` | Your API token | (required) |
| `OPTIMAL_ORG_ID` | Organization ID | default |
| `SCANNER_TYPE` | Scanner to use | grype |
| `SCAN_INTERVAL` | Daemon scan interval (seconds) | 300 |

### Command Line Options

```
Usage: optimal-scan [OPTIONS]

Options:
  --api-url TEXT       Optimal Platform API URL [required]
  --token TEXT         API token for authentication [required]
  --image TEXT         Container image to scan
  --container TEXT     Running container ID to scan
  --all-containers     Scan all running containers
  --path TEXT          Filesystem path to scan
  --org-id TEXT        Organization ID
  --scanner TEXT       Scanner to use (grype, trivy, demo)
  --daemon             Run in daemon mode
  --interval INTEGER   Scan interval in seconds (daemon mode)
  --output TEXT        Output results to file
  --quiet              Suppress output
  --help               Show this message and exit
```

## CI/CD Integration

### GitLab CI

```yaml
scan-vulnerabilities:
  image: optimal/scanner:latest
  script:
    - optimal-scan --image $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  variables:
    OPTIMAL_API_TOKEN: $OPTIMAL_TOKEN
```

### GitHub Actions

```yaml
- name: Vulnerability Scan
  uses: optimal-platform/scanner-action@v1
  with:
    image: ${{ github.repository }}:${{ github.sha }}
    api-token: ${{ secrets.OPTIMAL_TOKEN }}
```

### Jenkins

```groovy
stage('Security Scan') {
    docker.image('optimal/scanner:latest').inside {
        sh 'optimal-scan --image ${IMAGE_NAME}:${BUILD_NUMBER}'
    }
}
```

## Security

- API tokens are never logged or stored locally
- All communication uses HTTPS
- Agent runs as non-root user in Docker
- Minimal permissions required

## Troubleshooting

### Scanner not found

If Grype or Trivy aren't installed, the scanner falls back to demo mode:

```bash
# Install Grype
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

# Install Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
```

### Docker socket access

Make sure Docker is running and the socket is accessible:

```bash
# Check Docker access
docker ps

# If permission denied, add your user to the docker group
sudo usermod -aG docker $USER
```

### Connection issues

Verify network connectivity:

```bash
curl -I https://api.gooptimal.io/health
```

## Support

- Documentation: https://docs.gooptimal.io
- Issues: https://github.com/optimal-platform/optimal-platform/issues
- Email: support@gooptimal.io

## License

Apache 2.0 - see [LICENSE](../../LICENSE)

