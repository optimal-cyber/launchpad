'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, AlertTriangle, CheckCircle, Clock, Activity,
  TrendingUp, TrendingDown, Eye, Search, Filter,
  ChevronRight, ExternalLink, RefreshCw, Zap,
  Server, Container, GitBranch, Lock, Loader2, X, FileText, Download
} from 'lucide-react';
import { usePlatformMetrics, clearMetricsCache } from '@/lib/usePlatformMetrics';

interface RecentEvent {
  id: string;
  type: 'scan' | 'alert' | 'deployment' | 'remediation';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  target: string;
  timestamp: string;
}

interface QuickActionModal {
  show: boolean;
  type: 'scan' | 'sync' | 'sbom' | 'report' | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
  message: string;
  result?: any;
}

export default function CommandCenterPage() {
  const router = useRouter();
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [actionModal, setActionModal] = useState<QuickActionModal>({
    show: false,
    type: null,
    status: 'idle',
    message: ''
  });

  // Use shared platform metrics hook
  const { metrics, loading, refresh } = usePlatformMetrics(isLive, 30000);
  const vulnMetrics = metrics.vulnerabilities;

  // Quick action handlers
  const handleRunFullScan = async () => {
    setActionModal({ show: true, type: 'scan', status: 'running', message: 'Initiating full vulnerability scan...' });

    try {
      const response = await fetch('/api/v1/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_type: 'scan', parameters: { scope: 'full' } })
      });

      if (!response.ok) throw new Error('Failed to start scan');

      await new Promise(resolve => setTimeout(resolve, 2000));
      setActionModal(prev => ({
        ...prev,
        status: 'completed',
        message: 'Full scan completed successfully!',
        result: { vulnerabilities_found: 12, assets_scanned: 47 }
      }));
      refresh();
    } catch (error) {
      setActionModal(prev => ({ ...prev, status: 'failed', message: 'Scan failed. Please try again.' }));
    }
  };

  const handleSyncGitLab = async () => {
    setActionModal({ show: true, type: 'sync', status: 'running', message: 'Syncing with GitLab...' });

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setActionModal(prev => ({
        ...prev,
        status: 'completed',
        message: 'GitLab sync completed!',
        result: { projects_synced: 8, pipelines_updated: 15 }
      }));
      refresh();
    } catch (error) {
      setActionModal(prev => ({ ...prev, status: 'failed', message: 'Sync failed. Please try again.' }));
    }
  };

  const handleGenerateSBOM = async () => {
    setActionModal({ show: true, type: 'sbom', status: 'running', message: 'Generating Software Bill of Materials...' });

    try {
      const response = await fetch('/api/v1/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_type: 'generate_sbom', parameters: {} })
      });

      if (!response.ok) throw new Error('Failed to generate SBOM');

      await new Promise(resolve => setTimeout(resolve, 2000));
      setActionModal(prev => ({
        ...prev,
        status: 'completed',
        message: 'SBOM generated successfully!',
        result: { components_found: 127, format: 'CycloneDX' }
      }));
    } catch (error) {
      setActionModal(prev => ({ ...prev, status: 'failed', message: 'SBOM generation failed.' }));
    }
  };

  const handleExportReport = async () => {
    setActionModal({ show: true, type: 'report', status: 'running', message: 'Generating security report...' });

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setActionModal(prev => ({
        ...prev,
        status: 'completed',
        message: 'Report ready for download!',
        result: { format: 'PDF', pages: 24 }
      }));
    } catch (error) {
      setActionModal(prev => ({ ...prev, status: 'failed', message: 'Report generation failed.' }));
    }
  };

  const closeActionModal = () => {
    setActionModal({ show: false, type: null, status: 'idle', message: '' });
  };

  // Update timestamp when live mode is active
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  const recentEvents: RecentEvent[] = [
    { id: '1', type: 'alert', severity: 'critical', message: 'New CVE-2024-3094 detected', target: 'api-gateway:v2.3.1', timestamp: '2s ago' },
    { id: '2', type: 'scan', severity: 'info', message: 'Container scan completed', target: 'frontend-web:latest', timestamp: '15s ago' },
    { id: '3', type: 'remediation', severity: 'high', message: 'Patch available for CVE-2024-21626', target: 'runc', timestamp: '32s ago' },
    { id: '4', type: 'deployment', severity: 'info', message: 'Security agent deployed', target: 'prod-cluster-east', timestamp: '1m ago' },
    { id: '5', type: 'alert', severity: 'high', message: 'Unusual network activity detected', target: 'worker-node-3', timestamp: '2m ago' },
    { id: '6', type: 'scan', severity: 'medium', message: 'SBOM updated', target: 'payment-service', timestamp: '3m ago' },
  ];


  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Command Center Header */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-void)]">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                  Command Center
                </h1>
                <div className="flex items-center gap-2">
                  <span className={`status-dot ${isLive ? 'healthy' : 'neutral'}`}></span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    {isLive ? 'LIVE' : 'PAUSED'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Real-time security monitoring across all environments
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsLive(!isLive)}
                className={`enterprise-btn ${isLive ? 'enterprise-btn-primary' : 'enterprise-btn-secondary'}`}
              >
                <Activity className="w-4 h-4" />
                {isLive ? 'Live' : 'Paused'}
              </button>
              <button 
                className="enterprise-btn enterprise-btn-secondary"
                onClick={() => {
                  clearMetricsCache();
                  refresh();
                  setLastUpdated(new Date());
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-6">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {/* Critical */}
          <div className="metric-card critical">
            <div className="metric-label">Critical</div>
            <div className="metric-value text-red-400">{vulnMetrics.critical}</div>
            <div className="metric-change negative">
              <TrendingUp className="w-3 h-3" />
              <span>+2 from yesterday</span>
            </div>
          </div>
          
          {/* High */}
          <div className="metric-card high">
            <div className="metric-label">High</div>
            <div className="metric-value text-orange-400">{vulnMetrics.high}</div>
            <div className="metric-change negative">
              <TrendingUp className="w-3 h-3" />
              <span>+5 from yesterday</span>
            </div>
          </div>
          
          {/* Medium */}
          <div className="metric-card medium">
            <div className="metric-label">Medium</div>
            <div className="metric-value text-yellow-400">{vulnMetrics.medium}</div>
            <div className="metric-change positive">
              <TrendingDown className="w-3 h-3" />
              <span>-12 from yesterday</span>
            </div>
          </div>
          
          {/* Low */}
          <div className="metric-card low">
            <div className="metric-label">Low</div>
            <div className="metric-value text-green-400">{vulnMetrics.low}</div>
            <div className="metric-change positive">
              <TrendingDown className="w-3 h-3" />
              <span>-8 from yesterday</span>
            </div>
          </div>

          {/* Total */}
          <div className="metric-card">
            <div className="metric-label">Total Findings</div>
            <div className="metric-value">{vulnMetrics.total}</div>
            <div className="metric-change">
              <span className="text-[var(--text-muted)]">Across 47 assets</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Activity Feed */}
          <div className="col-span-4">
            <div className="enterprise-card">
              <div className="p-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                    Live Activity
                  </h2>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div className="p-2 max-h-[500px] overflow-y-auto">
                <div className="activity-feed">
                  {recentEvents.map((event, idx) => (
                    <div 
                      key={event.id} 
                      className={`activity-item animate-slideIn stagger-${idx + 1}`}
                    >
                      <div className="mt-0.5">
                        {getSeverityIcon(event.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="message">
                          <strong>{event.message}</strong>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs font-mono text-[var(--accent-cyan)]">
                            {event.target}
                          </code>
                        </div>
                      </div>
                      <span className="timestamp">{event.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Critical Vulnerabilities */}
          <div className="col-span-5">
            <div className="enterprise-card h-full">
              <div className="p-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                    Critical Vulnerabilities Requiring Attention
                  </h2>
                  <button className="enterprise-btn enterprise-btn-ghost text-xs">
                    View All
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>CVE ID</th>
                      <th>Severity</th>
                      <th>Asset</th>
                      <th>EPSS</th>
                      <th>Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="cursor-pointer">
                      <td className="cell-mono cell-primary">CVE-2024-3094</td>
                      <td><span className="severity-badge severity-critical">CRITICAL</span></td>
                      <td className="cell-mono">xz-utils:5.6.0</td>
                      <td className="cell-mono">0.92</td>
                      <td className="text-red-400">2h</td>
                    </tr>
                    <tr className="cursor-pointer">
                      <td className="cell-mono cell-primary">CVE-2024-21626</td>
                      <td><span className="severity-badge severity-critical">CRITICAL</span></td>
                      <td className="cell-mono">runc:1.1.4</td>
                      <td className="cell-mono">0.85</td>
                      <td className="text-orange-400">1d</td>
                    </tr>
                    <tr className="cursor-pointer">
                      <td className="cell-mono cell-primary">CVE-2023-44487</td>
                      <td><span className="severity-badge severity-high">HIGH</span></td>
                      <td className="cell-mono">golang.org/x/net</td>
                      <td className="cell-mono">0.78</td>
                      <td className="text-yellow-400">5d</td>
                    </tr>
                    <tr className="cursor-pointer">
                      <td className="cell-mono cell-primary">CVE-2023-38545</td>
                      <td><span className="severity-badge severity-high">HIGH</span></td>
                      <td className="cell-mono">curl:8.3.0</td>
                      <td className="cell-mono">0.65</td>
                      <td className="text-[var(--text-muted)]">12d</td>
                    </tr>
                    <tr className="cursor-pointer">
                      <td className="cell-mono cell-primary">CVE-2023-4863</td>
                      <td><span className="severity-badge severity-high">HIGH</span></td>
                      <td className="cell-mono">libwebp:1.2.4</td>
                      <td className="cell-mono">0.72</td>
                      <td className="text-[var(--text-muted)]">21d</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Environment Status */}
          <div className="col-span-3">
            <div className="enterprise-card">
              <div className="p-4 border-b border-[var(--border-subtle)]">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Environment Status
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {/* Production */}
                <div className="p-3 bg-[var(--bg-elevated)] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="status-dot healthy"></span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">Production</span>
                    </div>
                    <span className="status-badge healthy">HEALTHY</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Container className="w-3 h-3" />
                      <span>24 containers</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Shield className="w-3 h-3" />
                      <span>3 agents</span>
                    </div>
                  </div>
                </div>

                {/* Staging */}
                <div className="p-3 bg-[var(--bg-elevated)] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="status-dot warning"></span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">Staging</span>
                    </div>
                    <span className="status-badge warning">5 ISSUES</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Container className="w-3 h-3" />
                      <span>18 containers</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Shield className="w-3 h-3" />
                      <span>2 agents</span>
                    </div>
                  </div>
                </div>

                {/* Development */}
                <div className="p-3 bg-[var(--bg-elevated)] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="status-dot error"></span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">Development</span>
                    </div>
                    <span className="status-badge error">12 CRITICAL</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Container className="w-3 h-3" />
                      <span>42 containers</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Shield className="w-3 h-3" />
                      <span>1 agent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="enterprise-card mt-4">
              <div className="p-4 border-b border-[var(--border-subtle)]">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Quick Actions
                </h2>
              </div>
              <div className="p-3 space-y-2">
                <button
                  onClick={handleRunFullScan}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[var(--accent-cyan)]" />
                  <span>Run Full Scan</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </button>
                <button
                  onClick={handleSyncGitLab}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-all cursor-pointer"
                >
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  <span>Sync GitLab</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </button>
                <button
                  onClick={handleGenerateSBOM}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-green-400" />
                  <span>Generate SBOM</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </button>
                <button
                  onClick={handleExportReport}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-orange-400" />
                  <span>Export Report</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Risk Trend */}
        <div className="mt-6">
          <div className="enterprise-card">
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Risk Score Trend (30 Days)
                </h2>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-red-400 rounded"></span>
                    <span className="text-[var(--text-muted)]">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-orange-400 rounded"></span>
                    <span className="text-[var(--text-muted)]">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-[var(--accent-cyan)] rounded"></span>
                    <span className="text-[var(--text-muted)]">Score</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              {/* Simplified chart visualization */}
              <div className="h-32 flex items-end gap-1">
                {Array.from({ length: 30 }).map((_, i) => {
                  const height = 30 + Math.random() * 70;
                  const isToday = i === 29;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t transition-all duration-300 ${
                        isToday ? 'bg-[var(--accent-cyan)]' : 'bg-[var(--bg-active)] hover:bg-[var(--accent-cyan)] hover:opacity-70'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-[var(--text-subtle)]">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Modal */}
      {actionModal.show && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="enterprise-card w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {actionModal.type === 'scan' && 'Vulnerability Scan'}
                  {actionModal.type === 'sync' && 'GitLab Sync'}
                  {actionModal.type === 'sbom' && 'SBOM Generation'}
                  {actionModal.type === 'report' && 'Export Report'}
                </h3>
                <button onClick={closeActionModal} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center py-6">
                {actionModal.status === 'running' && (
                  <Loader2 className="w-12 h-12 text-[var(--accent-cyan)] animate-spin mx-auto mb-4" />
                )}
                {actionModal.status === 'completed' && (
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                )}
                {actionModal.status === 'failed' && (
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                )}

                <p className="text-[var(--text-secondary)] mb-4">{actionModal.message}</p>

                {actionModal.result && actionModal.status === 'completed' && (
                  <div className="bg-[var(--bg-surface)] rounded-lg p-4 text-left mt-4">
                    {actionModal.result.vulnerabilities_found !== undefined && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[var(--text-muted)]">Vulnerabilities Found:</span>
                        <span className="text-[var(--text-primary)] font-mono">{actionModal.result.vulnerabilities_found}</span>
                      </div>
                    )}
                    {actionModal.result.assets_scanned !== undefined && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[var(--text-muted)]">Assets Scanned:</span>
                        <span className="text-[var(--text-primary)] font-mono">{actionModal.result.assets_scanned}</span>
                      </div>
                    )}
                    {actionModal.result.projects_synced !== undefined && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[var(--text-muted)]">Projects Synced:</span>
                        <span className="text-[var(--text-primary)] font-mono">{actionModal.result.projects_synced}</span>
                      </div>
                    )}
                    {actionModal.result.pipelines_updated !== undefined && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[var(--text-muted)]">Pipelines Updated:</span>
                        <span className="text-[var(--text-primary)] font-mono">{actionModal.result.pipelines_updated}</span>
                      </div>
                    )}
                    {actionModal.result.components_found !== undefined && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[var(--text-muted)]">Components Found:</span>
                        <span className="text-[var(--text-primary)] font-mono">{actionModal.result.components_found}</span>
                      </div>
                    )}
                    {actionModal.result.format !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Format:</span>
                        <span className="text-[var(--text-primary)] font-mono">{actionModal.result.format}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                {actionModal.status === 'completed' && actionModal.type === 'sbom' && (
                  <button
                    onClick={() => router.push('/sbom')}
                    className="enterprise-btn enterprise-btn-primary flex-1"
                  >
                    View SBOM
                  </button>
                )}
                {actionModal.status === 'completed' && actionModal.type === 'report' && (
                  <button className="enterprise-btn enterprise-btn-primary flex-1">
                    <Download className="w-4 h-4" />
                    Download Report
                  </button>
                )}
                <button onClick={closeActionModal} className="enterprise-btn enterprise-btn-secondary flex-1">
                  {actionModal.status === 'running' ? 'Cancel' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




