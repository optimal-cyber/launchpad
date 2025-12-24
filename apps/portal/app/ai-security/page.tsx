'use client';

import { useState, useEffect } from 'react';
import { Shield, Brain, CheckCircle2, AlertTriangle, TrendingUp, FileText, Download, ExternalLink, Award, Target, Lock, Zap, Plus, Search, RefreshCw, Loader2, Play, Cloud, Server } from 'lucide-react';
import type { AIModel, AIAssessmentResult, AISVSScore, NISTAIRMFScore, ATLASThreat, AssessmentConfig } from '@/lib/ai-security-types';
import ModelDiscoveryModal from '@/components/ai-security/ModelDiscoveryModal';
import AssessmentConfigModal from '@/components/ai-security/AssessmentConfigModal';
import AISVSScoreCard from '@/components/ai-security/AISVSScoreCard';
import NISTScoreCard from '@/components/ai-security/NISTScoreCard';
import RedTeamResultsPanel from '@/components/ai-security/RedTeamResultsPanel';

export default function AISecurityPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<AIAssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAssessment, setIsRunningAssessment] = useState(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch models on mount
  useEffect(() => {
    fetchModels();
  }, []);

  // Fetch assessment when model changes
  useEffect(() => {
    if (selectedModel) {
      fetchLatestAssessment(selectedModel.id);
    }
  }, [selectedModel]);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-security/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      setModels(data.models);
      if (data.models.length > 0 && !selectedModel) {
        setSelectedModel(data.models[0]);
      }
    } catch (err) {
      setError('Failed to load AI models');
      console.error('Fetch models error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLatestAssessment = async (modelId: string) => {
    try {
      const response = await fetch(`/api/ai-security/assessments?modelId=${modelId}`);
      if (!response.ok) throw new Error('Failed to fetch assessments');
      const data = await response.json();
      if (data.assessments && data.assessments.length > 0) {
        setLatestAssessment(data.assessments[0]);
      } else {
        setLatestAssessment(null);
      }
    } catch (err) {
      console.error('Fetch assessment error:', err);
      setLatestAssessment(null);
    }
  };

  const handleStartAssessment = async (modelId: string, config: AssessmentConfig) => {
    setIsRunningAssessment(true);
    try {
      const model = models.find(m => m.id === modelId);
      const response = await fetch('/api/ai-security/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          modelName: model?.name,
          modelSource: model?.source,
          config
        })
      });

      if (!response.ok) throw new Error('Failed to start assessment');
      const result = await response.json();
      setLatestAssessment(result);

      // Update model score
      setModels(prev => prev.map(m =>
        m.id === modelId
          ? { ...m, overallScore: result.overallScore, riskLevel: result.riskLevel, lastAssessed: result.timestamp }
          : m
      ));
    } catch (err) {
      setError('Failed to run assessment');
      console.error('Assessment error:', err);
    } finally {
      setIsRunningAssessment(false);
    }
  };

  const handleImportModels = (importedModels: AIModel[]) => {
    setModels(prev => [...prev, ...importedModels]);
    if (importedModels.length > 0 && !selectedModel) {
      setSelectedModel(importedModels[0]);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-[var(--text-muted)] bg-[var(--bg-surface)] border-[var(--border-subtle)]';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'huggingface':
        return <Cloud className="w-4 h-4" />;
      case 'ollama':
      case 'local':
        return <Server className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const overallAISVSScore = latestAssessment?.aisvsScores
    ? Math.round(latestAssessment.aisvsScores.reduce((sum, s) => sum + s.percentage, 0) / latestAssessment.aisvsScores.length)
    : 0;

  const overallNISTScore = latestAssessment?.nistScores
    ? Math.round(latestAssessment.nistScores.reduce((sum, s) => sum + s.score, 0) / latestAssessment.nistScores.length)
    : 0;

  const mitigatedThreats = latestAssessment?.atlasThreats
    ? latestAssessment.atlasThreats.filter(t => t.mitigated).length
    : 0;

  const totalThreats = latestAssessment?.atlasThreats?.length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)] mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading AI Security Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="enterprise-header px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">AI Security & Benchmarks</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Assess AI models against OWASP AISVS, NIST AI RMF, and MITRE ATLAS frameworks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDiscoveryModal(true)}
              className="enterprise-btn enterprise-btn-secondary"
            >
              <Plus className="w-4 h-4" />
              Discover Models
            </button>
            <button
              onClick={fetchModels}
              className="enterprise-btn enterprise-btn-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="enterprise-btn enterprise-btn-primary">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
            <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
          </div>
        )}

        {/* Model Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Registered AI Models</h2>
            <span className="text-sm text-[var(--text-muted)]">{models.length} models</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedModel?.id === model.id
                    ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-default)]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-muted)]">{getSourceIcon(model.source)}</span>
                    <span className="text-xs text-[var(--text-muted)] uppercase">{model.source}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRiskColor(model.riskLevel)}`}>
                    {model.riskLevel === 'unknown' ? 'NOT ASSESSED' : model.riskLevel.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-medium text-[var(--text-primary)] truncate">{model.name}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">{model.framework} • {model.version}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-2xl font-bold ${model.overallScore > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {model.overallScore > 0 ? model.overallScore : '—'}
                  </span>
                  {model.lastAssessed && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(model.lastAssessed).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Assessment Actions */}
        {selectedModel && (
          <div className="mb-6 p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">
                  Selected: {selectedModel.name}
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {selectedModel.endpoint || selectedModel.huggingfaceId || 'No endpoint configured'}
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(true)}
                disabled={isRunningAssessment}
                className="enterprise-btn enterprise-btn-primary"
              >
                {isRunningAssessment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running Assessment...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Assessment
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Overall Scores */}
        {latestAssessment && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="enterprise-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">Overall Score</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{latestAssessment.overallScore}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getRiskColor(latestAssessment.riskLevel)}`}>
                    <Award className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="enterprise-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">AISVS Score</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{overallAISVSScore}%</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-[var(--accent-cyan)]/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-[var(--accent-cyan)]" />
                  </div>
                </div>
              </div>

              <div className="enterprise-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">NIST AI RMF</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{overallNISTScore}%</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="enterprise-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">Threats Mitigated</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{mitigatedThreats}/{totalThreats}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Framework Results */}
            <div className="space-y-6">
              {/* AISVS Card */}
              {latestAssessment.aisvsScores.length > 0 && (
                <AISVSScoreCard scores={latestAssessment.aisvsScores} expanded={true} />
              )}

              {/* NIST Card */}
              {latestAssessment.nistScores.length > 0 && (
                <NISTScoreCard scores={latestAssessment.nistScores} expanded={true} />
              )}

              {/* ATLAS Threats */}
              {latestAssessment.atlasThreats.length > 0 && (
                <div className="enterprise-card">
                  <div className="p-4 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-[var(--text-primary)]">MITRE ATLAS Threats</h3>
                        <p className="text-xs text-[var(--text-muted)]">Adversarial Threat Landscape for AI Systems</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {latestAssessment.atlasThreats.map((threat, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            threat.mitigated
                              ? 'border-green-500/30 bg-green-500/5'
                              : 'border-red-500/30 bg-red-500/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {threat.mitigated ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                            )}
                            <div>
                              <div className="font-medium text-[var(--text-primary)]">{threat.threatName}</div>
                              <div className="text-xs text-[var(--text-muted)]">
                                {threat.threatId} • {threat.mitigated ? 'Mitigated' : 'Requires attention'}
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(threat.severity)}`}>
                            {threat.severity.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Red Team Results */}
              {latestAssessment.redTeamResults && latestAssessment.redTeamResults.length > 0 && (
                <RedTeamResultsPanel results={latestAssessment.redTeamResults} expanded={true} />
              )}

              {/* Findings */}
              {latestAssessment.findings.length > 0 && (
                <div className="enterprise-card">
                  <div className="p-4 border-b border-[var(--border-subtle)]">
                    <h3 className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[var(--accent-cyan)]" />
                      Assessment Findings ({latestAssessment.findings.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {latestAssessment.findings.slice(0, 5).map((finding) => (
                      <div key={finding.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRiskColor(finding.severity)}`}>
                                {finding.severity.toUpperCase()}
                              </span>
                              <span className="text-xs text-[var(--text-muted)]">{finding.framework}</span>
                            </div>
                            <h4 className="font-medium text-[var(--text-primary)]">{finding.title}</h4>
                            <p className="text-sm text-[var(--text-muted)] mt-1">{finding.description}</p>
                            {finding.remediation && (
                              <p className="text-sm text-[var(--accent-cyan)] mt-2">
                                Remediation: {finding.remediation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {latestAssessment.findings.length > 5 && (
                    <div className="p-4 border-t border-[var(--border-subtle)] text-center">
                      <button className="text-sm text-[var(--accent-cyan)] hover:underline">
                        View all {latestAssessment.findings.length} findings
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {latestAssessment.recommendations.length > 0 && (
                <div className="enterprise-card">
                  <div className="p-4 border-b border-[var(--border-subtle)]">
                    <h3 className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      Recommended Actions
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {latestAssessment.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5"
                        >
                          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-[var(--text-primary)]">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* No Assessment State */}
        {selectedModel && !latestAssessment && !isRunningAssessment && (
          <div className="enterprise-card p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Assessment Results</h3>
            <p className="text-[var(--text-muted)] mb-6">
              This model hasn't been assessed yet. Run an assessment to evaluate it against OWASP AISVS, NIST AI RMF, and MITRE ATLAS frameworks.
            </p>
            <button
              onClick={() => setShowConfigModal(true)}
              className="enterprise-btn enterprise-btn-primary"
            >
              <Play className="w-4 h-4" />
              Run First Assessment
            </button>
          </div>
        )}

        {/* No Models State */}
        {models.length === 0 && (
          <div className="enterprise-card p-12 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No AI Models Registered</h3>
            <p className="text-[var(--text-muted)] mb-6">
              Get started by discovering and importing AI models from HuggingFace or your local environment.
            </p>
            <button
              onClick={() => setShowDiscoveryModal(true)}
              className="enterprise-btn enterprise-btn-primary"
            >
              <Plus className="w-4 h-4" />
              Discover Models
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ModelDiscoveryModal
        isOpen={showDiscoveryModal}
        onClose={() => setShowDiscoveryModal(false)}
        onImportModels={handleImportModels}
      />

      <AssessmentConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        model={selectedModel}
        onStartAssessment={handleStartAssessment}
      />
    </div>
  );
}

