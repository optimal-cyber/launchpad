'use client';

import { useState } from 'react';
import {
  Search, Filter, Download, RefreshCw, ChevronDown,
  AlertTriangle, CheckCircle, Clock, ExternalLink,
  ArrowUpRight, ArrowDownRight, Eye, MoreHorizontal,
  FileText, Loader2, CheckCircle2, XCircle
} from 'lucide-react';

interface Vulnerability {
  id: string;
  cve: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  package: string;
  version: string;
  fixedVersion: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'suppressed';
  epss: number;
  cvss: number;
  asset: string;
  environment: string;
  firstSeen: string;
  lastSeen: string;
}

const mockVulnerabilities: Vulnerability[] = [
  {
    id: '1',
    cve: 'CVE-2024-3094',
    severity: 'critical',
    package: 'xz-utils',
    version: '5.6.0',
    fixedVersion: '5.6.2',
    status: 'open',
    epss: 0.92,
    cvss: 10.0,
    asset: 'api-gateway:v2.3.1',
    environment: 'production',
    firstSeen: '2024-03-29',
    lastSeen: '2024-03-30'
  },
  {
    id: '2',
    cve: 'CVE-2024-21626',
    severity: 'critical',
    package: 'runc',
    version: '1.1.4',
    fixedVersion: '1.1.12',
    status: 'in_progress',
    epss: 0.85,
    cvss: 9.8,
    asset: 'worker-service:latest',
    environment: 'production',
    firstSeen: '2024-01-31',
    lastSeen: '2024-03-30'
  },
  {
    id: '3',
    cve: 'CVE-2023-44487',
    severity: 'high',
    package: 'golang.org/x/net',
    version: '0.15.0',
    fixedVersion: '0.17.0',
    status: 'open',
    epss: 0.78,
    cvss: 7.5,
    asset: 'payment-service:v4.1.2',
    environment: 'staging',
    firstSeen: '2023-10-10',
    lastSeen: '2024-03-30'
  },
  {
    id: '4',
    cve: 'CVE-2023-4863',
    severity: 'high',
    package: 'libwebp',
    version: '1.2.4',
    fixedVersion: '1.3.2',
    status: 'open',
    epss: 0.72,
    cvss: 8.8,
    asset: 'frontend-web:v2.3.1',
    environment: 'production',
    firstSeen: '2023-09-25',
    lastSeen: '2024-03-30'
  },
  {
    id: '5',
    cve: 'CVE-2023-38545',
    severity: 'high',
    package: 'curl',
    version: '8.3.0',
    fixedVersion: '8.4.0',
    status: 'resolved',
    epss: 0.65,
    cvss: 9.8,
    asset: 'api-gateway:v2.3.1',
    environment: 'production',
    firstSeen: '2023-10-11',
    lastSeen: '2024-03-28'
  },
  {
    id: '6',
    cve: 'CVE-2023-36665',
    severity: 'medium',
    package: 'protobufjs',
    version: '6.11.3',
    fixedVersion: '7.2.5',
    status: 'open',
    epss: 0.32,
    cvss: 6.5,
    asset: 'notification-service:v1.2.0',
    environment: 'development',
    firstSeen: '2023-07-05',
    lastSeen: '2024-03-30'
  },
  {
    id: '7',
    cve: 'CVE-2023-2650',
    severity: 'medium',
    package: 'openssl',
    version: '3.0.8',
    fixedVersion: '3.0.9',
    status: 'in_progress',
    epss: 0.18,
    cvss: 5.3,
    asset: 'auth-service:v3.0.0-beta',
    environment: 'staging',
    firstSeen: '2023-05-30',
    lastSeen: '2024-03-30'
  },
  {
    id: '8',
    cve: 'CVE-2022-40897',
    severity: 'low',
    package: 'setuptools',
    version: '65.3.0',
    fixedVersion: '65.5.1',
    status: 'suppressed',
    epss: 0.05,
    cvss: 3.7,
    asset: 'worker-service:latest',
    environment: 'development',
    firstSeen: '2022-12-23',
    lastSeen: '2024-03-30'
  }
];

interface AgentRun {
  run_id: string;
  task_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  progress_percent: number;
}

export default function VulnerabilitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<string[]>([]);
  
  // Agent modal state
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentRun, setAgentRun] = useState<AgentRun | null>(null);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);

  const filteredVulns = mockVulnerabilities.filter(vuln => {
    if (searchQuery && !vuln.cve.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !vuln.package.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedSeverity.length && !selectedSeverity.includes(vuln.severity)) return false;
    if (selectedStatus.length && !selectedStatus.includes(vuln.status)) return false;
    if (selectedEnv.length && !selectedEnv.includes(vuln.environment)) return false;
    return true;
  });

  const getSeverityClass = (severity: string) => {
    const map: Record<string, string> = {
      critical: 'severity-critical',
      high: 'severity-high',
      medium: 'severity-medium',
      low: 'severity-low'
    };
    return map[severity] || '';
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      open: { class: 'status-badge error', label: 'OPEN' },
      in_progress: { class: 'status-badge warning', label: 'IN PROGRESS' },
      resolved: { class: 'status-badge healthy', label: 'RESOLVED' },
      suppressed: { class: 'status-badge neutral', label: 'SUPPRESSED' }
    };
    return map[status] || { class: 'status-badge neutral', label: status };
  };

  const severityCounts = {
    critical: mockVulnerabilities.filter(v => v.severity === 'critical').length,
    high: mockVulnerabilities.filter(v => v.severity === 'high').length,
    medium: mockVulnerabilities.filter(v => v.severity === 'medium').length,
    low: mockVulnerabilities.filter(v => v.severity === 'low').length,
  };

  // Generate POA&M using AI Agent
  const handleGeneratePOAM = async (vuln: Vulnerability) => {
    setSelectedVuln(vuln);
    setShowAgentModal(true);

    try {
      // Call agent API to generate POA&M
      const response = await fetch('/api/v1/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'generate_poam',
          parameters: {
            vulnerability_id: vuln.id,
            cve_id: vuln.cve,
            severity: vuln.severity,
            package: vuln.package,
            version: vuln.version,
            asset: vuln.asset,
          },
          environment_id: vuln.environment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create agent run');
      }

      const runData: AgentRun = await response.json();
      setAgentRun(runData);

      // Poll for status
      pollAgentStatus(runData.run_id);
    } catch (error) {
      console.error('Error generating POA&M:', error);
      setAgentRun({
        run_id: 'error',
        task_type: 'generate_poam',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        progress_percent: 0,
      });
    }
  };

  // Poll agent run status
  const pollAgentStatus = async (runId: string) => {
    const maxAttempts = 20;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/v1/agents/runs/${runId}`);
        if (!response.ok) throw new Error('Failed to fetch run status');

        const runData: AgentRun = await response.json();
        setAgentRun(runData);

        if (runData.status === 'completed' || runData.status === 'failed') {
          return; // Done
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Poll every second
        }
      } catch (error) {
        console.error('Error polling agent status:', error);
      }
    };

    poll();
  };

  const closeAgentModal = () => {
    setShowAgentModal(false);
    setAgentRun(null);
    setSelectedVuln(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-void)]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                Vulnerabilities
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {mockVulnerabilities.length} total findings across all environments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="enterprise-btn enterprise-btn-secondary">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="enterprise-btn enterprise-btn-primary">
                <RefreshCw className="w-4 h-4" />
                Scan Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Severity Summary */}
      <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex gap-4">
          <button 
            className={`metric-card critical flex-1 cursor-pointer ${selectedSeverity.includes('critical') ? 'ring-2 ring-[var(--severity-critical)]' : ''}`}
            onClick={() => setSelectedSeverity(prev => 
              prev.includes('critical') ? prev.filter(s => s !== 'critical') : [...prev, 'critical']
            )}
          >
            <div className="metric-label">Critical</div>
            <div className="metric-value text-red-400">{severityCounts.critical}</div>
          </button>
          <button 
            className={`metric-card high flex-1 cursor-pointer ${selectedSeverity.includes('high') ? 'ring-2 ring-[var(--severity-high)]' : ''}`}
            onClick={() => setSelectedSeverity(prev => 
              prev.includes('high') ? prev.filter(s => s !== 'high') : [...prev, 'high']
            )}
          >
            <div className="metric-label">High</div>
            <div className="metric-value text-orange-400">{severityCounts.high}</div>
          </button>
          <button 
            className={`metric-card medium flex-1 cursor-pointer ${selectedSeverity.includes('medium') ? 'ring-2 ring-[var(--severity-medium)]' : ''}`}
            onClick={() => setSelectedSeverity(prev => 
              prev.includes('medium') ? prev.filter(s => s !== 'medium') : [...prev, 'medium']
            )}
          >
            <div className="metric-label">Medium</div>
            <div className="metric-value text-yellow-400">{severityCounts.medium}</div>
          </button>
          <button 
            className={`metric-card low flex-1 cursor-pointer ${selectedSeverity.includes('low') ? 'ring-2 ring-[var(--severity-low)]' : ''}`}
            onClick={() => setSelectedSeverity(prev => 
              prev.includes('low') ? prev.filter(s => s !== 'low') : [...prev, 'low']
            )}
          >
            <div className="metric-label">Low</div>
            <div className="metric-value text-green-400">{severityCounts.low}</div>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-4">
          <div className="enterprise-search flex-1 max-w-md">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search CVE ID, package name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="enterprise-input"
            />
          </div>
          
          <button className="enterprise-btn enterprise-btn-secondary">
            <Filter className="w-4 h-4" />
            Status
            <ChevronDown className="w-3 h-3" />
          </button>
          
          <button className="enterprise-btn enterprise-btn-secondary">
            <Filter className="w-4 h-4" />
            Environment
            <ChevronDown className="w-3 h-3" />
          </button>

          {(selectedSeverity.length > 0 || selectedStatus.length > 0 || selectedEnv.length > 0) && (
            <button 
              className="text-xs text-[var(--accent-cyan)] hover:underline"
              onClick={() => {
                setSelectedSeverity([]);
                setSelectedStatus([]);
                setSelectedEnv([]);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        <div className="enterprise-card overflow-hidden">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th className="w-[140px]">CVE ID</th>
                <th className="w-[100px]">Severity</th>
                <th>Package</th>
                <th className="w-[100px]">Status</th>
                <th className="w-[80px]">EPSS</th>
                <th className="w-[80px]">CVSS</th>
                <th>Asset</th>
                <th className="w-[100px]">Environment</th>
                <th className="w-[100px]">First Seen</th>
                <th className="w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {filteredVulns.map((vuln) => {
                const statusBadge = getStatusBadge(vuln.status);
                return (
                  <tr key={vuln.id} className="cursor-pointer group">
                    <td>
                      <div className="flex items-center gap-2">
                        <a 
                          href={`https://nvd.nist.gov/vuln/detail/${vuln.cve}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cell-mono cell-primary hover:text-[var(--accent-cyan)] flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {vuln.cve}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </a>
                      </div>
                    </td>
                    <td>
                      <span className={`severity-badge ${getSeverityClass(vuln.severity)}`}>
                        {vuln.severity.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span className="cell-mono text-[var(--text-primary)]">{vuln.package}</span>
                        <span className="text-[var(--text-muted)]">@{vuln.version}</span>
                      </div>
                      {vuln.fixedVersion && (
                        <div className="text-xs text-[var(--status-success)]">
                          Fix: {vuln.fixedVersion}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={statusBadge.class}>{statusBadge.label}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className={`cell-mono ${vuln.epss >= 0.7 ? 'text-red-400' : vuln.epss >= 0.4 ? 'text-orange-400' : 'text-[var(--text-secondary)]'}`}>
                          {vuln.epss.toFixed(2)}
                        </span>
                        {vuln.epss >= 0.7 && <ArrowUpRight className="w-3 h-3 text-red-400" />}
                      </div>
                    </td>
                    <td>
                      <span className={`cell-mono ${vuln.cvss >= 9 ? 'text-red-400' : vuln.cvss >= 7 ? 'text-orange-400' : 'text-[var(--text-secondary)]'}`}>
                        {vuln.cvss.toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <span className="cell-mono text-[var(--accent-cyan)]">{vuln.asset}</span>
                    </td>
                    <td>
                      <span className={`text-xs ${
                        vuln.environment === 'production' ? 'text-red-400' :
                        vuln.environment === 'staging' ? 'text-yellow-400' : 'text-[var(--text-muted)]'
                      }`}>
                        {vuln.environment}
                      </span>
                    </td>
                    <td className="cell-mono text-xs">{vuln.firstSeen}</td>
                    <td>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                        <button 
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                          onClick={() => handleGeneratePOAM(vuln)}
                          title="Generate POA&M with AI"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredVulns.length === 0 && (
            <div className="py-12 text-center text-[var(--text-muted)]">
              <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No vulnerabilities match your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="enterprise-card w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    {agentRun?.status === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    ) : agentRun?.status === 'failed' ? (
                      <XCircle className="w-6 h-6 text-red-400" />
                    ) : (
                      <Loader2 className="w-6 h-6 text-[var(--accent-cyan)] animate-spin" />
                    )}
                    AI Agent: Generate POA&M
                  </h2>
                  {selectedVuln && (
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Processing {selectedVuln.cve} ({selectedVuln.package})
                    </p>
                  )}
                </div>
                <button
                  onClick={closeAgentModal}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Status */}
              {agentRun && (
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-[var(--text-secondary)]">
                        Status: <span className="capitalize text-[var(--text-primary)]">{agentRun.status}</span>
                      </span>
                      <span className="text-[var(--text-muted)]">{agentRun.progress_percent}%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent-cyan)] transition-all duration-300"
                        style={{ width: `${agentRun.progress_percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Result */}
                  {agentRun.status === 'completed' && agentRun.result && (
                    <div className="bg-[var(--bg-surface)] rounded-lg p-4 border border-[var(--border-subtle)]">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                        POA&M Draft Generated
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-[var(--text-muted)] uppercase">Weakness Name</label>
                          <p className="text-[var(--text-primary)] mt-1">{agentRun.result.weakness_name}</p>
                        </div>
                        
                        {agentRun.result.poam_id && (
                          <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase">POA&M ID</label>
                            <p className="text-[var(--accent-cyan)] font-mono mt-1">{agentRun.result.poam_id}</p>
                          </div>
                        )}
                        
                        {agentRun.result.scheduled_completion && (
                          <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase">Scheduled Completion</label>
                            <p className="text-[var(--text-primary)] mt-1">
                              {new Date(agentRun.result.scheduled_completion).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        
                        {agentRun.result.items_generated && (
                          <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase">Items Generated</label>
                            <p className="text-[var(--text-primary)] mt-1">{agentRun.result.items_generated}</p>
                          </div>
                        )}

                        {agentRun.result.recommendations && (
                          <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase">Recommendations</label>
                            <ul className="list-disc list-inside text-[var(--text-primary)] mt-1 space-y-1">
                              {agentRun.result.recommendations.map((rec: string, idx: number) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-3 mt-6">
                        <a
                          href="/poam"
                          className="enterprise-btn enterprise-btn-primary flex-1"
                        >
                          <FileText className="w-4 h-4" />
                          View in POA&M Dashboard
                        </a>
                        <button
                          onClick={closeAgentModal}
                          className="enterprise-btn enterprise-btn-secondary"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {agentRun.status === 'failed' && (
                    <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
                      <h3 className="text-red-400 font-semibold mb-2">Error</h3>
                      <p className="text-[var(--text-secondary)]">{agentRun.error || 'Unknown error occurred'}</p>
                      <button
                        onClick={closeAgentModal}
                        className="enterprise-btn enterprise-btn-secondary mt-4"
                      >
                        Close
                      </button>
                    </div>
                  )}

                  {/* Pending/Running */}
                  {(agentRun.status === 'pending' || agentRun.status === 'running') && (
                    <div className="text-center py-8">
                      <Loader2 className="w-12 h-12 text-[var(--accent-cyan)] animate-spin mx-auto mb-4" />
                      <p className="text-[var(--text-secondary)]">
                        AI Agent is analyzing the vulnerability and generating a POA&M draft...
                      </p>
                      <p className="text-sm text-[var(--text-muted)] mt-2">
                        This typically takes 5-10 seconds
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
