'use client';

import { useState } from 'react';
import { X, Search, Cloud, Server, Plus, Loader2, ExternalLink, CheckCircle } from 'lucide-react';
import type { AIModel, AIModelSource } from '@/lib/ai-security-types';

interface ModelDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportModels: (models: AIModel[]) => void;
}

type DiscoverySource = 'huggingface' | 'local' | 'both';

export default function ModelDiscoveryModal({ isOpen, onClose, onImportModels }: ModelDiscoveryModalProps) {
  const [source, setSource] = useState<DiscoverySource>('huggingface');
  const [searchQuery, setSearchQuery] = useState('');
  const [localEndpoints, setLocalEndpoints] = useState('http://localhost:11434');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState<AIModel[]>([]);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleDiscover = async () => {
    setIsDiscovering(true);
    setError(null);
    setDiscoveredModels([]);
    setSelectedModels(new Set());

    try {
      const response = await fetch('/api/ai-security/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          query: searchQuery || undefined,
          localEndpoints: source === 'local' || source === 'both'
            ? localEndpoints.split(',').map(e => e.trim())
            : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to discover models');
      }

      const data = await response.json();
      setDiscoveredModels(data.models);
    } catch (err) {
      setError('Failed to discover models. Please check your configuration and try again.');
      console.error('Discovery error:', err);
    } finally {
      setIsDiscovering(false);
    }
  };

  const toggleModelSelection = (modelId: string) => {
    const newSelected = new Set(selectedModels);
    if (newSelected.has(modelId)) {
      newSelected.delete(modelId);
    } else {
      newSelected.add(modelId);
    }
    setSelectedModels(newSelected);
  };

  const selectAll = () => {
    if (selectedModels.size === discoveredModels.length) {
      setSelectedModels(new Set());
    } else {
      setSelectedModels(new Set(discoveredModels.map(m => m.id)));
    }
  };

  const handleImport = async () => {
    const modelsToImport = discoveredModels.filter(m => selectedModels.has(m.id));

    // Add models to the platform
    for (const model of modelsToImport) {
      try {
        await fetch('/api/ai-security/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(model)
        });
      } catch (err) {
        console.error('Failed to import model:', model.name, err);
      }
    }

    onImportModels(modelsToImport);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="enterprise-card w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Discover AI Models</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Search and import models from HuggingFace or discover local endpoints
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Source Selection */}
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSource('huggingface')}
              className={`p-4 rounded-lg border transition-all ${
                source === 'huggingface'
                  ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
              }`}
            >
              <Cloud className={`w-6 h-6 mb-2 ${source === 'huggingface' ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)]'}`} />
              <div className={`font-medium ${source === 'huggingface' ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-primary)]'}`}>
                HuggingFace
              </div>
              <div className="text-xs text-[var(--text-muted)]">Search public models</div>
            </button>

            <button
              onClick={() => setSource('local')}
              className={`p-4 rounded-lg border transition-all ${
                source === 'local'
                  ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
              }`}
            >
              <Server className={`w-6 h-6 mb-2 ${source === 'local' ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)]'}`} />
              <div className={`font-medium ${source === 'local' ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-primary)]'}`}>
                Local Endpoints
              </div>
              <div className="text-xs text-[var(--text-muted)]">Ollama, vLLM, etc.</div>
            </button>

            <button
              onClick={() => setSource('both')}
              className={`p-4 rounded-lg border transition-all ${
                source === 'both'
                  ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
              }`}
            >
              <Plus className={`w-6 h-6 mb-2 ${source === 'both' ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)]'}`} />
              <div className={`font-medium ${source === 'both' ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-primary)]'}`}>
                Both
              </div>
              <div className="text-xs text-[var(--text-muted)]">Search all sources</div>
            </button>
          </div>

          {/* Search Input */}
          <div className="mt-4 space-y-3">
            {(source === 'huggingface' || source === 'both') && (
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase">
                  Search HuggingFace
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search models (e.g., llama, mistral, bert)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)]"
                  />
                </div>
              </div>
            )}

            {(source === 'local' || source === 'both') && (
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase">
                  Local Endpoints (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:11434, http://localhost:8000"
                  value={localEndpoints}
                  onChange={(e) => setLocalEndpoints(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] font-mono text-sm"
                />
              </div>
            )}

            <button
              onClick={handleDiscover}
              disabled={isDiscovering}
              className="enterprise-btn enterprise-btn-primary w-full"
            >
              {isDiscovering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Discover Models
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 mb-4">
              {error}
            </div>
          )}

          {discoveredModels.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[var(--text-muted)]">
                  Found {discoveredModels.length} models
                </span>
                <button
                  onClick={selectAll}
                  className="text-sm text-[var(--accent-cyan)] hover:underline"
                >
                  {selectedModels.size === discoveredModels.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2">
                {discoveredModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => toggleModelSelection(model.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedModels.has(model.id)
                        ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5'
                        : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${
                          selectedModels.has(model.id)
                            ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]'
                            : 'border-[var(--border-default)]'
                        }`}>
                          {selectedModels.has(model.id) && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">{model.name}</div>
                          {model.huggingfaceId && (
                            <div className="text-xs text-[var(--text-muted)] font-mono mt-1">
                              {model.huggingfaceId}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)]">
                              {model.modelType}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)]">
                              {model.framework}
                            </span>
                            {model.license && (
                              <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)]">
                                {model.license}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {model.downloads && (
                        <div className="text-xs text-[var(--text-muted)]">
                          {(model.downloads / 1000000).toFixed(1)}M downloads
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!isDiscovering && discoveredModels.length === 0 && !error && (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <Cloud className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Click "Discover Models" to search for AI models</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedModels.size > 0 && (
          <div className="p-6 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">
                {selectedModels.size} model{selectedModels.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="enterprise-btn enterprise-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="enterprise-btn enterprise-btn-primary"
                >
                  Import Selected
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
