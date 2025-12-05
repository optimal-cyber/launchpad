'use client';

import { useState } from 'react';
import {
  Search, Filter, Download, RefreshCw, ChevronDown,
  AlertTriangle, CheckCircle, Clock, ExternalLink,
  ArrowUpRight, ArrowDownRight, Eye, MoreHorizontal
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

export default function VulnerabilitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<string[]>([]);

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
                      <button className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
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
    </div>
  );
}
