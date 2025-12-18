'use client';

import { useState } from 'react';
import { X, Shield, AlertTriangle, CheckCircle, Play, Loader2, Settings } from 'lucide-react';
import type { AIModel, AssessmentConfig, RedTeamTestType } from '@/lib/ai-security-types';

interface AssessmentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: AIModel | null;
  onStartAssessment: (modelId: string, config: AssessmentConfig) => Promise<void>;
}

const RED_TEAM_OPTIONS: { type: RedTeamTestType; name: string; description: string }[] = [
  { type: 'prompt_injection', name: 'Prompt Injection', description: 'Direct and indirect prompt injection attacks' },
  { type: 'jailbreak', name: 'Jailbreaking', description: 'Attempts to bypass safety guardrails' },
  { type: 'adversarial', name: 'Adversarial Attacks', description: 'Input perturbation and feature manipulation' },
  { type: 'privacy_leakage', name: 'Privacy Leakage', description: 'Data extraction and PII disclosure' },
  { type: 'model_extraction', name: 'Model Extraction', description: 'Parameter and behavior extraction attempts' },
  { type: 'bias_detection', name: 'Bias Detection', description: 'Testing for demographic and content biases' },
  { type: 'hallucination', name: 'Hallucination Testing', description: 'Factuality and grounding verification' }
];

export default function AssessmentConfigModal({ isOpen, onClose, model, onStartAssessment }: AssessmentConfigModalProps) {
  const [config, setConfig] = useState<AssessmentConfig>({
    includeAISVS: true,
    includeNISTRMF: true,
    includeATLAS: true,
    includeRedTeam: false,
    redTeamConfig: {
      enabled: false,
      testCategories: ['prompt_injection', 'jailbreak'],
      maxTestsPerCategory: 5,
      timeout: 30
    }
  });
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRedTeamCategory = (category: RedTeamTestType) => {
    const current = config.redTeamConfig?.testCategories || [];
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];

    setConfig({
      ...config,
      redTeamConfig: {
        ...config.redTeamConfig!,
        testCategories: updated
      }
    });
  };

  const handleStartAssessment = async () => {
    if (!model) return;

    setIsRunning(true);
    setError(null);

    try {
      await onStartAssessment(model.id, config);
      onClose();
    } catch (err) {
      setError('Failed to start assessment. Please try again.');
      console.error('Assessment error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen || !model) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="enterprise-card w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Configure Assessment</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Configure security assessment for <span className="text-[var(--accent-cyan)]">{model.name}</span>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Framework Selection */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--accent-cyan)]" />
              Security Frameworks
            </h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-default)] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.includeAISVS}
                  onChange={(e) => setConfig({ ...config, includeAISVS: e.target.checked })}
                  className="mt-0.5 rounded border-[var(--border-default)] text-[var(--accent-cyan)] focus:ring-[var(--accent-cyan)]"
                />
                <div>
                  <div className="font-medium text-[var(--text-primary)]">OWASP AISVS</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    AI Security Verification Standard - 10 control categories including data security, model security, and adversarial robustness
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-default)] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.includeNISTRMF}
                  onChange={(e) => setConfig({ ...config, includeNISTRMF: e.target.checked })}
                  className="mt-0.5 rounded border-[var(--border-default)] text-[var(--accent-cyan)] focus:ring-[var(--accent-cyan)]"
                />
                <div>
                  <div className="font-medium text-[var(--text-primary)]">NIST AI RMF</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    AI Risk Management Framework - Govern, Map, Measure, Manage pillars for AI trustworthiness
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-default)] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.includeATLAS}
                  onChange={(e) => setConfig({ ...config, includeATLAS: e.target.checked })}
                  className="mt-0.5 rounded border-[var(--border-default)] text-[var(--accent-cyan)] focus:ring-[var(--accent-cyan)]"
                />
                <div>
                  <div className="font-medium text-[var(--text-primary)]">MITRE ATLAS</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Adversarial Threat Landscape for AI Systems - threat matrix covering ML attack techniques
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Red Team Testing */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Active Red Team Testing
            </h3>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-default)] cursor-pointer transition-colors mb-3">
              <input
                type="checkbox"
                checked={config.includeRedTeam}
                onChange={(e) => setConfig({
                  ...config,
                  includeRedTeam: e.target.checked,
                  redTeamConfig: { ...config.redTeamConfig!, enabled: e.target.checked }
                })}
                className="mt-0.5 rounded border-[var(--border-default)] text-orange-400 focus:ring-orange-400"
              />
              <div>
                <div className="font-medium text-[var(--text-primary)]">Enable Red Team Testing</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Actively test the model with attack payloads. This will send requests to the model endpoint.
                </div>
              </div>
            </label>

            {config.includeRedTeam && (
              <div className="pl-6 space-y-3">
                <div className="text-xs font-medium text-[var(--text-muted)] uppercase">Test Categories</div>
                <div className="grid grid-cols-2 gap-2">
                  {RED_TEAM_OPTIONS.map((option) => (
                    <label
                      key={option.type}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        config.redTeamConfig?.testCategories.includes(option.type)
                          ? 'border-orange-500/50 bg-orange-500/5'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={config.redTeamConfig?.testCategories.includes(option.type)}
                        onChange={() => toggleRedTeamCategory(option.type)}
                        className="mt-0.5 rounded border-[var(--border-default)] text-orange-400 focus:ring-orange-400"
                      />
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">{option.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Tests per Category
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={config.redTeamConfig?.maxTestsPerCategory || 5}
                      onChange={(e) => setConfig({
                        ...config,
                        redTeamConfig: {
                          ...config.redTeamConfig!,
                          maxTestsPerCategory: parseInt(e.target.value) || 5
                        }
                      })}
                      className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={config.redTeamConfig?.timeout || 30}
                      onChange={(e) => setConfig({
                        ...config,
                        redTeamConfig: {
                          ...config.redTeamConfig!,
                          timeout: parseInt(e.target.value) || 30
                        }
                      })}
                      className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Endpoint */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-[var(--text-muted)]" />
              Advanced Options
            </h3>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Custom Endpoint (optional)
              </label>
              <input
                type="text"
                placeholder={model.endpoint || 'https://api.example.com/v1/chat'}
                value={config.customEndpoint || ''}
                onChange={(e) => setConfig({ ...config, customEndpoint: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] font-mono text-sm"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Override the model's default endpoint for testing
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[var(--text-muted)]">
              {[
                config.includeAISVS && 'AISVS',
                config.includeNISTRMF && 'NIST',
                config.includeATLAS && 'ATLAS',
                config.includeRedTeam && 'Red Team'
              ].filter(Boolean).join(' + ') || 'No frameworks selected'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="enterprise-btn enterprise-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleStartAssessment}
                disabled={isRunning || (!config.includeAISVS && !config.includeNISTRMF && !config.includeATLAS && !config.includeRedTeam)}
                className="enterprise-btn enterprise-btn-primary"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Assessment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
