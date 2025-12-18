'use client';

import { Shield, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { AISVSScore, AISVS_CATEGORIES } from '@/lib/ai-security-types';

interface AISVSScoreCardProps {
  scores: AISVSScore[];
  expanded?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  data_security: '🔐',
  model_security: '🛡️',
  input_validation: '📥',
  output_security: '📤',
  access_control: '🔑',
  model_explainability: '🔍',
  privacy_protection: '👁️',
  adversarial_robustness: '⚔️',
  monitoring_logging: '📊',
  compliance_governance: '📋'
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'pass': return 'text-green-400';
    case 'partial': return 'text-yellow-400';
    case 'fail': return 'text-red-400';
    default: return 'text-[var(--text-muted)]';
  }
}

function getStatusBgColor(status: string): string {
  switch (status) {
    case 'pass': return 'bg-green-500/10 border-green-500/30';
    case 'partial': return 'bg-yellow-500/10 border-yellow-500/30';
    case 'fail': return 'bg-red-500/10 border-red-500/30';
    default: return 'bg-[var(--bg-surface)] border-[var(--border-subtle)]';
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pass':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'partial':
      return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    case 'fail':
      return <XCircle className="w-4 h-4 text-red-400" />;
    default:
      return null;
  }
}

export default function AISVSScoreCard({ scores, expanded: defaultExpanded = false }: AISVSScoreCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const overallScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length)
    : 0;

  const passCount = scores.filter(s => s.status === 'pass').length;
  const partialCount = scores.filter(s => s.status === 'partial').length;
  const failCount = scores.filter(s => s.status === 'fail').length;

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="enterprise-card">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-cyan)]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[var(--accent-cyan)]" />
          </div>
          <div>
            <h3 className="font-medium text-[var(--text-primary)]">OWASP AISVS</h3>
            <p className="text-xs text-[var(--text-muted)]">AI Security Verification Standard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{overallScore}%</div>
            <div className="text-xs text-[var(--text-muted)]">
              {passCount} pass · {partialCount} partial · {failCount} fail
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
          {/* Score Bar */}
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-[var(--bg-surface)]">
              {scores.map((score, i) => (
                <div
                  key={i}
                  className={`flex-1 ${
                    score.status === 'pass' ? 'bg-green-500' :
                    score.status === 'partial' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  title={`${score.categoryName}: ${score.percentage}%`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
              <span>10 Control Categories</span>
              <span>{overallScore}% Overall Compliance</span>
            </div>
          </div>

          {/* Categories */}
          <div className="divide-y divide-[var(--border-subtle)]">
            {scores.map((score) => (
              <div key={score.category}>
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                  onClick={() => toggleCategory(score.category)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{CATEGORY_ICONS[score.category] || '📋'}</span>
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">{score.categoryName}</div>
                      <div className="text-xs text-[var(--text-muted)]">{score.details}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBgColor(score.status)} ${getStatusColor(score.status)}`}>
                      {score.score}/{score.maxScore}
                    </div>
                    <StatusIcon status={score.status} />
                    {expandedCategories.has(score.category) ? (
                      <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </div>
                </div>

                {/* Category Details */}
                {expandedCategories.has(score.category) && (
                  <div className="px-4 pb-4 pl-12 space-y-3">
                    {score.controlsMet.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-green-400 mb-1">Controls Met</div>
                        <ul className="space-y-1">
                          {score.controlsMet.map((control, i) => (
                            <li key={i} className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              {control}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {score.controlsFailed.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-red-400 mb-1">Controls Failed</div>
                        <ul className="space-y-1">
                          {score.controlsFailed.map((control, i) => (
                            <li key={i} className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                              <XCircle className="w-3 h-3 text-red-400" />
                              {control}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {score.recommendations.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-[var(--accent-cyan)] mb-1">Recommendations</div>
                        <ul className="space-y-1">
                          {score.recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                              <span className="text-[var(--accent-cyan)]">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
