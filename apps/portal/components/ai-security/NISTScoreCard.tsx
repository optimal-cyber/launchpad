'use client';

import { FileText, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { NISTAIRMFScore, NISTSubcategory } from '@/lib/ai-security-types';

interface NISTScoreCardProps {
  scores: NISTAIRMFScore[];
  expanded?: boolean;
}

const PILLAR_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  govern: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  map: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  measure: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  manage: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' }
};

const PILLAR_ICONS: Record<string, string> = {
  govern: '⚖️',
  map: '🗺️',
  measure: '📏',
  manage: '🎯'
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'pass': return 'text-green-400';
    case 'partial': return 'text-yellow-400';
    case 'fail': return 'text-red-400';
    default: return 'text-[var(--text-muted)]';
  }
}

function getSubcategoryStatusColor(status: string): string {
  switch (status) {
    case 'implemented': return 'text-green-400';
    case 'partial': return 'text-yellow-400';
    case 'planned': return 'text-blue-400';
    case 'not_implemented': return 'text-red-400';
    default: return 'text-[var(--text-muted)]';
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pass':
    case 'implemented':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'partial':
      return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    case 'fail':
    case 'not_implemented':
      return <XCircle className="w-4 h-4 text-red-400" />;
    default:
      return null;
  }
}

export default function NISTScoreCard({ scores, expanded: defaultExpanded = false }: NISTScoreCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set());

  const overallScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
    : 0;

  const passCount = scores.filter(s => s.status === 'pass').length;
  const partialCount = scores.filter(s => s.status === 'partial').length;
  const failCount = scores.filter(s => s.status === 'fail').length;

  const togglePillar = (pillar: string) => {
    const newExpanded = new Set(expandedPillars);
    if (newExpanded.has(pillar)) {
      newExpanded.delete(pillar);
    } else {
      newExpanded.add(pillar);
    }
    setExpandedPillars(newExpanded);
  };

  return (
    <div className="enterprise-card">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium text-[var(--text-primary)]">NIST AI RMF</h3>
            <p className="text-xs text-[var(--text-muted)]">AI Risk Management Framework</p>
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
          {/* Pillar Overview */}
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="grid grid-cols-4 gap-3">
              {scores.map((score) => {
                const colors = PILLAR_COLORS[score.pillar] || PILLAR_COLORS.govern;
                return (
                  <div
                    key={score.pillar}
                    className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{PILLAR_ICONS[score.pillar]}</span>
                      <span className={`text-sm font-medium ${colors.text}`}>{score.pillarName}</span>
                    </div>
                    <div className={`text-2xl font-bold ${colors.text}`}>{score.score}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pillars Detail */}
          <div className="divide-y divide-[var(--border-subtle)]">
            {scores.map((score) => (
              <div key={score.pillar}>
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                  onClick={() => togglePillar(score.pillar)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{PILLAR_ICONS[score.pillar]}</span>
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">{score.pillarName}</div>
                      <div className="text-xs text-[var(--text-muted)]">{score.details}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      score.score >= 85 ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
                      score.score >= 70 ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400' :
                      'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                      {score.score}%
                    </div>
                    <StatusIcon status={score.status} />
                    {expandedPillars.has(score.pillar) ? (
                      <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </div>
                </div>

                {/* Pillar Subcategories */}
                {expandedPillars.has(score.pillar) && (
                  <div className="px-4 pb-4 pl-12 space-y-3">
                    {score.subcategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                      >
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">{sub.name}</div>
                          <div className="text-xs text-[var(--text-muted)]">{sub.description}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-medium ${getSubcategoryStatusColor(sub.status)}`}>
                            {sub.status.replace('_', ' ')}
                          </span>
                          <div className="w-16 h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                            <div
                              className={`h-full ${
                                sub.score >= 85 ? 'bg-green-500' :
                                sub.score >= 70 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${sub.score}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--text-muted)] w-8">{sub.score}%</span>
                        </div>
                      </div>
                    ))}

                    {score.recommendations.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-[var(--accent-cyan)] mb-2">Recommendations</div>
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
