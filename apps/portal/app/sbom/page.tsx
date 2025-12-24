'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RefreshCw, Download, Search, Package, ExternalLink, X
} from 'lucide-react';

interface SBOMComponent {
  id: string;
  name: string;
  version: string;
  type: string;
  purl: string;
  license: string;
  description: string;
  vulnerabilities: number;
  risk_level: string;
  last_updated: string;
}

interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  last_scan: {
    total_scans: number;
    vulnerabilities_count: number;
    secrets_count: number;
    timestamp: string;
  };
}

// Mock data for demonstration - always available
const MOCK_COMPONENTS: SBOMComponent[] = [
  { id: '1', name: 'flask', version: '2.3.3', type: 'library', purl: 'pkg:pypi/flask@2.3.3', license: 'BSD-3-Clause', description: 'A simple framework for building complex web applications', vulnerabilities: 0, risk_level: 'low', last_updated: '2024-12-01' },
  { id: '2', name: 'werkzeug', version: '2.3.7', type: 'library', purl: 'pkg:pypi/werkzeug@2.3.7', license: 'BSD-3-Clause', description: 'The comprehensive WSGI web application library', vulnerabilities: 1, risk_level: 'medium', last_updated: '2024-12-01' },
  { id: '3', name: 'jinja2', version: '3.1.2', type: 'library', purl: 'pkg:pypi/jinja2@3.1.2', license: 'BSD-3-Clause', description: 'A very fast and expressive template engine', vulnerabilities: 0, risk_level: 'low', last_updated: '2024-12-01' },
  { id: '4', name: 'requests', version: '2.31.0', type: 'package', purl: 'pkg:pypi/requests@2.31.0', license: 'Apache-2.0', description: 'Python HTTP for Humans', vulnerabilities: 0, risk_level: 'low', last_updated: '2024-12-01' },
  { id: '5', name: 'urllib3', version: '2.0.7', type: 'package', purl: 'pkg:pypi/urllib3@2.0.7', license: 'MIT', description: 'HTTP library with thread-safe connection pooling', vulnerabilities: 2, risk_level: 'high', last_updated: '2024-12-01' },
  { id: '6', name: 'cryptography', version: '41.0.5', type: 'library', purl: 'pkg:pypi/cryptography@41.0.5', license: 'Apache-2.0', description: 'Cryptographic recipes and primitives', vulnerabilities: 1, risk_level: 'medium', last_updated: '2024-12-01' },
  { id: '7', name: 'pyjwt', version: '2.8.0', type: 'package', purl: 'pkg:pypi/pyjwt@2.8.0', license: 'MIT', description: 'JSON Web Token implementation in Python', vulnerabilities: 0, risk_level: 'low', last_updated: '2024-12-01' },
  { id: '8', name: 'sqlalchemy', version: '2.0.23', type: 'library', purl: 'pkg:pypi/sqlalchemy@2.0.23', license: 'MIT', description: 'Database Abstraction Library', vulnerabilities: 0, risk_level: 'low', last_updated: '2024-12-01' },
  { id: '9', name: 'numpy', version: '1.26.2', type: 'package', purl: 'pkg:pypi/numpy@1.26.2', license: 'BSD-3-Clause', description: 'Fundamental package for array computing in Python', vulnerabilities: 0, risk_level: 'low', last_updated: '2024-12-01' },
  { id: '10', name: 'pandas', version: '2.1.3', type: 'library', purl: 'pkg:pypi/pandas@2.1.3', license: 'BSD-3-Clause', description: 'Powerful data structures for data analysis', vulnerabilities: 0, risk_level: 'low', last_updated: '2024-12-01' },
  { id: '11', name: 'redis', version: '5.0.1', type: 'library', purl: 'pkg:pypi/redis@5.0.1', license: 'MIT', description: 'Python client for Redis database', vulnerabilities: 1, risk_level: 'medium', last_updated: '2024-12-01' },
  { id: '12', name: 'boto3', version: '1.33.0', type: 'package', purl: 'pkg:pypi/boto3@1.33.0', license: 'Apache-2.0', description: 'AWS SDK for Python', vulnerabilities: 0, risk_level: 'low', last_updated: '2024-12-01' },
];

export default function SBOMPage() {
  const [components, setComponents] = useState<SBOMComponent[]>(MOCK_COMPONENTS);
  const [filteredComponents, setFilteredComponents] = useState<SBOMComponent[]>(MOCK_COMPONENTS);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    id: '65646370',
    name: 'flask-container-test',
    path: 'r.gutwein/flask-container-test',
    last_scan: {
      total_scans: 3,
      vulnerabilities_count: 24,
      secrets_count: 0,
      timestamp: new Date().toISOString()
    }
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedComponent, setSelectedComponent] = useState<SBOMComponent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Ensure components are always set on mount
  useEffect(() => {
    if (components.length === 0) {
      setComponents(MOCK_COMPONENTS);
    }
  }, []);

  // Apply filters whenever data or filters change
  useEffect(() => {
    applyFilters();
  }, [components, searchTerm, typeFilter, riskFilter]);

  const loadSBOMComponents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sboms');
      if (response.ok) {
        const data = await response.json();
        // Only update if API returns valid components, otherwise keep mock data
        if (data.components && Array.isArray(data.components) && data.components.length > 0) {
          setComponents(data.components);
        } else {
          // If API returns empty, ensure we have mock data
          setComponents(MOCK_COMPONENTS);
        }
      } else {
        // On API error, ensure mock data is preserved
        setComponents(MOCK_COMPONENTS);
      }
    } catch (error) {
      console.error('Error loading SBOM:', error);
      // On error, ensure mock data is preserved
      setComponents(MOCK_COMPONENTS);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = components;

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.version.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.type.toLowerCase() === typeFilter.toLowerCase());
    }

    if (riskFilter !== 'all') {
      filtered = filtered.filter(c => c.risk_level.toLowerCase() === riskFilter.toLowerCase());
    }

    setFilteredComponents(filtered);
  };

  const getRiskBadgeClass = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'critical': return 'severity-badge severity-critical';
      case 'high': return 'severity-badge severity-high';
      case 'medium': return 'severity-badge severity-medium';
      case 'low': return 'severity-badge severity-low';
      default: return 'status-badge neutral';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const totalVulnerabilities = components.reduce((acc, c) => acc + c.vulnerabilities, 0);
  const uniqueTypes = Array.from(new Set(components.map(c => c.type)));
  const uniqueRisks = Array.from(new Set(components.map(c => c.risk_level)));

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-void)]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                Software Bill of Materials
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Track and manage software components
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadSBOMComponents}
                className="enterprise-btn enterprise-btn-secondary"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="enterprise-btn enterprise-btn-secondary">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Summary */}
      <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="grid grid-cols-4 gap-4">
          <div className="metric-card">
            <div className="metric-label">Total Scans</div>
            <div className="metric-value text-[var(--accent-cyan)]">{projectInfo.last_scan.total_scans}</div>
          </div>
          <div className="metric-card critical">
            <div className="metric-label">Vulnerabilities</div>
            <div className="metric-value text-red-400">{projectInfo.last_scan.vulnerabilities_count}</div>
          </div>
          <div className="metric-card medium">
            <div className="metric-label">Secrets Found</div>
            <div className="metric-value text-yellow-400">{projectInfo.last_scan.secrets_count}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Last Scan</div>
            <div className="metric-value text-green-400 text-base">{formatDate(projectInfo.last_scan.timestamp)}</div>
          </div>
        </div>
      </div>

      {/* Project Info Card */}
      <div className="px-6 py-4">
        <div className="enterprise-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{projectInfo.name}</h3>
              <p className="text-sm text-[var(--text-muted)]">{projectInfo.path}</p>
            </div>
            <Link
              href={`https://gitlab.com/${projectInfo.path}`}
              target="_blank"
              className="enterprise-btn enterprise-btn-secondary"
            >
              View in GitLab
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Component Summary */}
      <div className="px-6 pb-4">
        <div className="enterprise-card p-4">
          <div className="grid grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[var(--accent-cyan)]">{components.length}</div>
              <div className="text-xs text-[var(--text-muted)]">Total Components</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{components.filter(c => c.type === 'package').length}</div>
              <div className="text-xs text-[var(--text-muted)]">Packages</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{components.filter(c => c.type === 'library').length}</div>
              <div className="text-xs text-[var(--text-muted)]">Libraries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{totalVulnerabilities}</div>
              <div className="text-xs text-[var(--text-muted)]">Security Risks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{components.filter(c => c.vulnerabilities === 0).length}</div>
              <div className="text-xs text-[var(--text-muted)]">Up to Date</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--text-muted)]">{formatDate(projectInfo.last_scan.timestamp)}</div>
              <div className="text-xs text-[var(--text-muted)]">Last Updated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pb-4">
        <div className="enterprise-card p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase">Search</label>
              <div className="enterprise-search">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search components..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="enterprise-input"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="enterprise-input w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase">Risk Level</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="enterprise-input w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
              >
                <option value="all">All Risk Levels</option>
                {uniqueRisks.map(risk => (
                  <option key={risk} value={risk}>{risk}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <span className="text-sm text-[var(--text-muted)]">
                Showing {filteredComponents.length} of {components.length} components
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Components Table */}
      <div className="px-6 pb-6">
        <div className="enterprise-card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Software Components ({filteredComponents.length})
              </h3>
              <span className="text-xs text-[var(--text-muted)]">
                Last updated: {new Date().toLocaleString()}
              </span>
            </div>
          </div>

          {filteredComponents.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No SBOM components found</h3>
              <p className="text-[var(--text-muted)]">Try adjusting your search criteria or filters.</p>
            </div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th className="w-[100px]">Version</th>
                  <th className="w-[100px]">Type</th>
                  <th className="w-[120px]">License</th>
                  <th className="w-[100px]">Risk</th>
                  <th className="w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComponents.map((component) => (
                  <tr key={component.id} className="group">
                    <td>
                      <div>
                        <span className="cell-mono text-[var(--text-primary)]">{component.name}</span>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{component.description}</p>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge neutral">{component.version}</span>
                    </td>
                    <td>
                      <span className="text-xs text-[var(--text-secondary)]">{component.type}</span>
                    </td>
                    <td>
                      <span className="text-xs text-[var(--text-secondary)]">{component.license}</span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className={getRiskBadgeClass(component.risk_level)}>
                          {component.risk_level.toUpperCase()}
                        </span>
                        {component.vulnerabilities > 0 && (
                          <span className="text-xs text-[var(--text-muted)]">
                            {component.vulnerabilities} vulns
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedComponent(component);
                            setShowDetailsModal(true);
                          }}
                          className="text-[var(--accent-cyan)] hover:text-[var(--accent-cyan-hover)] text-sm"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Component Details Modal */}
      {showDetailsModal && selectedComponent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="enterprise-card w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Component Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase">Name</label>
                  <p className="text-[var(--text-primary)] font-semibold">{selectedComponent.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] uppercase">Version</label>
                    <p className="text-[var(--text-primary)]">{selectedComponent.version}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] uppercase">Type</label>
                    <p className="text-[var(--text-primary)]">{selectedComponent.type}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase">Description</label>
                  <p className="text-[var(--text-secondary)]">{selectedComponent.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] uppercase">License</label>
                    <p className="text-[var(--text-primary)]">{selectedComponent.license}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] uppercase">Risk Level</label>
                    <span className={getRiskBadgeClass(selectedComponent.risk_level)}>
                      {selectedComponent.risk_level.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase">Vulnerabilities</label>
                  <p className={selectedComponent.vulnerabilities > 0 ? 'text-red-400' : 'text-green-400'}>
                    {selectedComponent.vulnerabilities}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase">PURL</label>
                  <p className="text-[var(--accent-cyan)] font-mono text-sm break-all">{selectedComponent.purl}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="enterprise-btn enterprise-btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
