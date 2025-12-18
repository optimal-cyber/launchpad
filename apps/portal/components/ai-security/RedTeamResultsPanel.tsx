'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Clock, Zap, Shield, Eye, EyeOff } from 'lucide-react';
import type { RedTeamTest, RedTeamTestType, RED_TEAM_CATEGORIES } from '@/lib/ai-security-types';

interface RedTeamResultsPanelProps {
  results: RedTeamTest[];
  expanded?: boolean;
}

const TEST_TYPE_INFO: Record<RedTeamTestType, { name: string; icon: string; color: string }> = {
  prompt_injection: { name: 'Prompt Injection', icon: '💉', color: 'text-orange-400' },
  jailbreak: { name: 'Jailbreaking', icon: '🔓', color: 'text-red-400' },
  adversarial: { name: 'Adversarial Attacks', icon: '⚔️', color: 'text-purple-400' },
  privacy_leakage: { name: 'Privacy Leakage', icon: '🔍', color: 'text-yellow-400' },
  model_extraction: { name: 'Model Extraction', icon: '📤', color: 'text-blue-400' },
  bias_detection: { name: 'Bias Detection', icon: '⚖️', color: 'text-cyan-400' },
  hallucination: { name: 'Hallucination', icon: '💭', color: 'text-pink-400' }
};

function getSeverityColor(severity: string): { bg: string; text: string; border: string } {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' };
    case 'high':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' };
    case 'medium':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    case 'low':
      return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' };
    default:
      return { bg: 'bg-[var(--bg-surface)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border-subtle)]' };
  }
}

export default function RedTeamResultsPanel({ results, expanded: defaultExpanded = false }: RedTeamResultsPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [showPayloads, setShowPayloads] = useState(false);

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const passRate = results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0;

  const criticalFailed = results.filter(r => !r.passed && r.severity === 'critical').length;
  const highFailed = results.filter(r => !r.passed && r.severity === 'high').length;

  const testsByType = results.reduce((acc, test) => {
    if (!acc[test.testType]) acc[test.testType] = [];
    acc[test.testType].push(test);
    return acc;
  }, {} as Record<RedTeamTestType, RedTeamTest[]>);

  const toggleTest = (testId: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedTests(newExpanded);
  };

  return (
    <div className="enterprise-card">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-medium text-[var(--text-primary)]">Red Team Testing</h3>
            <p className="text-xs text-[var(--text-muted)]">Active security testing results</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{passRate}%</div>
            <div className="text-xs text-[var(--text-muted)]">
              {passedCount} pass · {failedCount} fail
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-[var(--border-subtle)]">
          {/* Summary Bar */}
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-[var(--text-primary)]">{passedCount} Passed</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-[var(--text-primary)]">{failedCount} Failed</span>
                </div>
                {criticalFailed > 0 && (
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-red-500/10 border border-red-500/30">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-red-400">{criticalFailed} Critical</span>
                  </div>
                )}
                {highFailed > 0 && (
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-orange-500/10 border border-orange-500/30">
                    <AlertTriangle className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-orange-400">{highFailed} High</span>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowPayloads(!showPayloads); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-colors"
              >
                {showPayloads ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPayloads ? 'Hide Payloads' : 'Show Payloads'}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-[var(--bg-surface)]">
              {results.map((result, i) => (
                <div
                  key={i}
                  className={`flex-1 ${result.passed ? 'bg-green-500' : 'bg-red-500'}`}
                  title={`${result.testName}: ${result.passed ? 'Passed' : 'Failed'}`}
                />
              ))}
            </div>
          </div>

          {/* Tests by Category */}
          <div className="divide-y divide-[var(--border-subtle)]">
            {Object.entries(testsByType).map(([type, tests]) => {
              const typeInfo = TEST_TYPE_INFO[type as RedTeamTestType];
              const typePassed = tests.filter(t => t.passed).length;
              const typeFailed = tests.filter(t => !t.passed).length;

              return (
                <div key={type} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeInfo.icon}</span>
                      <span className={`font-medium ${typeInfo.color}`}>{typeInfo.name}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        ({typePassed}/{tests.length} passed)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {tests.map((test) => {
                      const severityColors = getSeverityColor(test.severity);
                      return (
                        <div key={test.id}>
                          <div
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              test.passed
                                ? 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                                : `${severityColors.border} ${severityColors.bg}`
                            }`}
                            onClick={() => toggleTest(test.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {test.passed ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <XCircle className={`w-4 h-4 ${severityColors.text}`} />
                                )}
                                <div>
                                  <div className="text-sm font-medium text-[var(--text-primary)]">
                                    {test.testName}
                                  </div>
                                  <div className="text-xs text-[var(--text-muted)]">
                                    {test.description}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${severityColors.bg} ${severityColors.border} ${severityColors.text}`}>
                                  {test.severity}
                                </span>
                                {test.duration && (
                                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                    <Clock className="w-3 h-3" />
                                    {test.duration}ms
                                  </div>
                                )}
                                {expandedTests.has(test.id) ? (
                                  <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Test Details */}
                          {expandedTests.has(test.id) && (
                            <div className="mt-2 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
                              {showPayloads && (
                                <div>
                                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Payload</div>
                                  <pre className="text-xs text-[var(--text-primary)] bg-[var(--bg-elevated)] p-2 rounded font-mono overflow-x-auto">
                                    {test.payload}
                                  </pre>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Expected Behavior</div>
                                  <div className="text-xs text-[var(--text-primary)]">{test.expectedBehavior}</div>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Actual Behavior</div>
                                  <div className={`text-xs ${test.passed ? 'text-green-400' : 'text-red-400'}`}>
                                    {test.actualBehavior || 'Not recorded'}
                                  </div>
                                </div>
                              </div>
                              {test.notes && (
                                <div>
                                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Notes</div>
                                  <div className="text-xs text-[var(--text-primary)]">{test.notes}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
