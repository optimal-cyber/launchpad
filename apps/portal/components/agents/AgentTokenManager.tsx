'use client';

import { useState } from 'react';
import {
  Key,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Shield,
  Clock,
} from 'lucide-react';

interface AgentCredentials {
  client_id: string;
  client_secret?: string;
  created_at?: string;
  last_used?: string;
}

interface AgentTokenManagerProps {
  agentId: string;
  agentName?: string;
  credentials?: AgentCredentials;
  onRegenerateSecret?: () => Promise<AgentCredentials>;
  onClose?: () => void;
}

export default function AgentTokenManager({
  agentId,
  agentName,
  credentials,
  onRegenerateSecret,
  onClose,
}: AgentTokenManagerProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newCredentials, setNewCredentials] = useState<AgentCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayCredentials = newCredentials || credentials;

  const copyToClipboard = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRegenerateSecret = async () => {
    if (!onRegenerateSecret) return;

    const confirmed = window.confirm(
      'Are you sure you want to regenerate the client secret? The current secret will be invalidated immediately.'
    );

    if (!confirmed) return;

    setIsRegenerating(true);
    setError(null);

    try {
      const newCreds = await onRegenerateSecret();
      setNewCredentials(newCreds);
      setShowSecret(true); // Show the new secret
    } catch (err) {
      setError('Failed to regenerate secret. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const maskSecret = (secret: string) => {
    if (secret.length <= 8) return '•'.repeat(secret.length);
    return secret.substring(0, 4) + '•'.repeat(secret.length - 8) + secret.substring(secret.length - 4);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Key className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">OAuth Credentials</h3>
          <p className="text-sm text-muted-foreground">
            {agentName || agentId}
          </p>
        </div>
      </div>

      {/* New Secret Warning */}
      {newCredentials && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-300">New Secret Generated</p>
              <p className="text-sm text-yellow-400/80">
                Make sure to copy the client secret now. You won&apos;t be able to see it again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Credentials Display */}
      {displayCredentials ? (
        <div className="space-y-4">
          {/* Client ID */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-muted-foreground">Client ID</label>
              <button
                onClick={() => copyToClipboard(displayCredentials.client_id, 'client_id')}
                className="flex items-center space-x-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                {copiedField === 'client_id' ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <code className="block w-full p-3 bg-background rounded text-sm font-mono text-foreground break-all">
              {displayCredentials.client_id}
            </code>
          </div>

          {/* Client Secret */}
          {displayCredentials.client_secret && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-muted-foreground">Client Secret</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showSecret ? (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(displayCredentials.client_secret!, 'client_secret')}
                    className="flex items-center space-x-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    {copiedField === 'client_secret' ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <code className="block w-full p-3 bg-background rounded text-sm font-mono text-foreground break-all">
                {showSecret
                  ? displayCredentials.client_secret
                  : maskSecret(displayCredentials.client_secret)}
              </code>
            </div>
          )}

          {/* Token Info */}
          <div className="grid grid-cols-2 gap-4">
            {displayCredentials.created_at && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Created</span>
                </div>
                <p className="text-sm text-foreground">
                  {new Date(displayCredentials.created_at).toLocaleString()}
                </p>
              </div>
            )}
            {displayCredentials.last_used && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Last Used</span>
                </div>
                <p className="text-sm text-foreground">
                  {new Date(displayCredentials.last_used).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Regenerate Button */}
          {onRegenerateSecret && (
            <div className="pt-4 border-t border-border">
              <button
                onClick={handleRegenerateSecret}
                disabled={isRegenerating}
                className="flex items-center space-x-2 px-4 py-2 bg-red-900/20 text-red-400 border border-red-700 rounded-lg hover:bg-red-900/40 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Secret'}</span>
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                This will invalidate the current secret immediately. The agent will need to be updated with the new credentials.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* No Credentials */
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <Key className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h4 className="text-lg font-medium text-foreground mb-2">No Credentials</h4>
          <p className="text-sm text-muted-foreground mb-4">
            This agent doesn&apos;t have OAuth credentials configured yet.
          </p>
          {onRegenerateSecret && (
            <button
              onClick={handleRegenerateSecret}
              disabled={isRegenerating}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Key className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Generating...' : 'Generate Credentials'}
            </button>
          )}
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-300 mb-2">How to Use</h4>
        <ol className="text-sm text-blue-400/80 space-y-1 list-decimal list-inside">
          <li>Set the <code className="bg-blue-900/40 px-1 rounded">OPTIMAL_CLIENT_ID</code> environment variable</li>
          <li>Set the <code className="bg-blue-900/40 px-1 rounded">OPTIMAL_CLIENT_SECRET</code> environment variable</li>
          <li>The agent will automatically authenticate using OAuth 2.0 client credentials flow</li>
        </ol>
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="flex justify-end pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
