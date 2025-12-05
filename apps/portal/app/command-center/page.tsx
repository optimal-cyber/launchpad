'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, AlertTriangle, CheckCircle, Clock, Activity, 
  TrendingUp, TrendingDown, Eye, Search, Filter,
  ChevronRight, ExternalLink, RefreshCw, Zap,
  Server, Container, GitBranch, Lock
} from 'lucide-react';

interface VulnMetrics {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface RecentEvent {
  id: string;
  type: 'scan' | 'alert' | 'deployment' | 'remediation';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  target: string;
  timestamp: string;
}

export default function CommandCenterPage() {
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulated real-time data
  const vulnMetrics: VulnMetrics = {
    critical: 7,
    high: 23,
    medium: 89,
    low: 156,
    total: 275
  };

  const recentEvents: RecentEvent[] = [
    { id: '1', type: 'alert', severity: 'critical', message: 'New CVE-2024-3094 detected', target: 'api-gateway:v2.3.1', timestamp: '2s ago' },
    { id: '2', type: 'scan', severity: 'info', message: 'Container scan completed', target: 'frontend-web:latest', timestamp: '15s ago' },
    { id: '3', type: 'remediation', severity: 'high', message: 'Patch available for CVE-2024-21626', target: 'runc', timestamp: '32s ago' },
    { id: '4', type: 'deployment', severity: 'info', message: 'Security agent deployed', target: 'prod-cluster-east', timestamp: '1m ago' },
    { id: '5', type: 'alert', severity: 'high', message: 'Unusual network activity detected', target: 'worker-node-3', timestamp: '2m ago' },
    { id: '6', type: 'scan', severity: 'medium', message: 'SBOM updated', target: 'payment-service', timestamp: '3m ago' },
  ];

  // Simulate live updates
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

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
              <button className="enterprise-btn enterprise-btn-secondary">
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
              <div className="p-2">
                <button className="enterprise-nav-item w-full">
                  <Zap className="w-4 h-4" />
                  <span>Run Full Scan</span>
                </button>
                <button className="enterprise-nav-item w-full">
                  <GitBranch className="w-4 h-4" />
                  <span>Sync GitLab</span>
                </button>
                <button className="enterprise-nav-item w-full">
                  <Lock className="w-4 h-4" />
                  <span>Generate SBOM</span>
                </button>
                <button className="enterprise-nav-item w-full">
                  <Eye className="w-4 h-4" />
                  <span>Export Report</span>
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
    </div>
  );
}

