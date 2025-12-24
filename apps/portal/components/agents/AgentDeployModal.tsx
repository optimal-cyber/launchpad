'use client';

import { useState } from 'react';
import {
  XCircle,
  Terminal,
  Copy,
  Check,
  Info,
  Download,
  Key,
  RefreshCw,
  Server,
  Box,
} from 'lucide-react';

type DeploymentMethod = 'kubernetes' | 'docker';

interface AgentCredentials {
  client_id: string;
  client_secret: string;
}

interface AgentDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformUrl?: string;
  onGenerateCredentials?: () => Promise<AgentCredentials>;
}

export default function AgentDeployModal({
  isOpen,
  onClose,
  platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://api.gooptimal.io',
  onGenerateCredentials,
}: AgentDeployModalProps) {
  const [deploymentMethod, setDeploymentMethod] = useState<DeploymentMethod>('kubernetes');
  const [credentials, setCredentials] = useState<AgentCredentials | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleGenerateCredentials = async () => {
    if (!onGenerateCredentials) {
      // Demo mode - generate fake credentials
      setCredentials({
        client_id: `agent_${Math.random().toString(36).substring(2, 18)}`,
        client_secret: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
      });
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const newCreds = await onGenerateCredentials();
      setCredentials(newCreds);
    } catch (err) {
      setError('Failed to generate credentials. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getKubernetesCommand = () => {
    if (!credentials) {
      return `# First, generate credentials using the button above
helm repo add optimal https://charts.optimal-platform.io
helm repo update`;
    }

    return `# Add the Helm repository
helm repo add optimal https://charts.optimal-platform.io
helm repo update

# Create namespace and secret
kubectl create namespace optimal-system

kubectl create secret generic optimal-agent-credentials \\
  --namespace optimal-system \\
  --from-literal=client-id='${credentials.client_id}' \\
  --from-literal=client-secret='${credentials.client_secret}'

# Install the agent
helm install optimal-agent optimal/security-agent \\
  --namespace optimal-system \\
  --set apiUrl='${platformUrl}' \\
  --set auth.existingSecret=optimal-agent-credentials \\
  --set clusterName=my-cluster`;
  };

  const getDockerCommand = () => {
    if (!credentials) {
      return `# First, generate credentials using the button above
curl -sSL https://install.gooptimal.io | bash -s -- --help`;
    }

    return `# One-liner installation
curl -sSL https://install.gooptimal.io | sudo bash -s -- \\
  --platform-url '${platformUrl}' \\
  --client-id '${credentials.client_id}' \\
  --client-secret '${credentials.client_secret}'

# Or using Docker Compose
docker run -d \\
  --name optimal-agent \\
  --restart unless-stopped \\
  -e OPTIMAL_API_URL='${platformUrl}' \\
  -e OPTIMAL_CLIENT_ID='${credentials.client_id}' \\
  -e OPTIMAL_CLIENT_SECRET='${credentials.client_secret}' \\
  -v /var/run/docker.sock:/var/run/docker.sock:ro \\
  -v optimal-data:/var/lib/optimal \\
  ghcr.io/optimal-platform/optimal-agent:latest`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Deploy Security Agent</h3>
              <p className="text-sm text-muted-foreground">
                Install the Optimal security agent in your environment
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Generate Credentials */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <h4 className="text-lg font-medium text-foreground">Generate OAuth Credentials</h4>
            </div>

            {!credentials ? (
              <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Generate OAuth credentials for your agent to authenticate with the platform.
                </p>
                <button
                  onClick={handleGenerateCredentials}
                  disabled={isGenerating}
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Generate Credentials
                    </>
                  )}
                </button>
                {error && (
                  <p className="text-sm text-red-400 mt-2">{error}</p>
                )}
              </div>
            ) : (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-4">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-300">Credentials Generated</p>
                    <p className="text-sm text-green-400/80">
                      Save these credentials securely. The secret will not be shown again.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-background rounded p-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Client ID</span>
                      <code className="block text-sm font-mono text-foreground">{credentials.client_id}</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(credentials.client_id, 'client_id')}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedField === 'client_id' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-background rounded p-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Client Secret</span>
                      <code className="block text-sm font-mono text-foreground">{credentials.client_secret}</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(credentials.client_secret, 'client_secret')}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedField === 'client_secret' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Choose Deployment Method */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </div>
              <h4 className="text-lg font-medium text-foreground">Choose Deployment Method</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDeploymentMethod('kubernetes')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  deploymentMethod === 'kubernetes'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <Server className={`h-8 w-8 mx-auto mb-2 ${
                  deploymentMethod === 'kubernetes' ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <h5 className="font-medium text-foreground">Kubernetes</h5>
                <p className="text-xs text-muted-foreground">Deploy as DaemonSet</p>
              </button>
              <button
                onClick={() => setDeploymentMethod('docker')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  deploymentMethod === 'docker'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <Box className={`h-8 w-8 mx-auto mb-2 ${
                  deploymentMethod === 'docker' ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <h5 className="font-medium text-foreground">Docker / VM</h5>
                <p className="text-xs text-muted-foreground">Standalone container</p>
              </button>
            </div>
          </div>

          {/* Step 3: Installation Commands */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <h4 className="text-lg font-medium text-foreground">Run Installation Commands</h4>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {deploymentMethod === 'kubernetes' ? 'Kubernetes / Helm' : 'Docker / Bash'}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(
                    deploymentMethod === 'kubernetes' ? getKubernetesCommand() : getDockerCommand(),
                    'commands'
                  )}
                  className="flex items-center space-x-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {copiedField === 'commands' ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
                {deploymentMethod === 'kubernetes' ? getKubernetesCommand() : getDockerCommand()}
              </pre>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">What happens next?</p>
                <ul className="text-sm text-blue-400/80 mt-1 space-y-1 list-disc list-inside">
                  <li>The agent will authenticate using OAuth 2.0 client credentials</li>
                  <li>It will register with the platform and start sending heartbeats</li>
                  <li>Vulnerability scans will run automatically based on your configuration</li>
                  <li>Results will appear in this dashboard within a few minutes</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              Close
            </button>
            <div className="flex items-center space-x-3">
              <button
                className="flex items-center px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download YAML
              </button>
              {credentials && (
                <button
                  onClick={() => copyToClipboard(
                    deploymentMethod === 'kubernetes' ? getKubernetesCommand() : getDockerCommand(),
                    'commands'
                  )}
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  Copy Commands
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
