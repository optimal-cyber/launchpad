'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Package, GitBranch, Search, Filter, RefreshCw, ExternalLink, Eye, FileText, BarChart3, Activity, Layers, Target } from 'lucide-react';
import { usePlatformMetrics, clearMetricsCache } from '@/lib/usePlatformMetrics';

interface Environment {
  id: string;
  name: string;
  project: string;
  status: 'healthy' | 'warning' | 'critical';
  version: string;
  lastDeployed: string;
  vulnCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  sbomStatus: 'complete' | 'pending' | 'outdated';
  complianceScore: number;
}

export default function HubPage() {
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'environments' | 'vulnerabilities' | 'sbom' | 'compliance'>('environments');
  const [searchQuery, setSearchQuery] = useState('');

  // Use shared platform metrics hook
  const { metrics, loading, refresh } = usePlatformMetrics();
  const vulnMetrics = metrics.vulnerabilities;

  const environments: Environment[] = [
    {
      id: 'env-1',
      name: 'Production',
      project: 'flask-container-test',
      status: 'warning',
      version: 'v2.3.1',
      lastDeployed: '2024-12-01 14:32',
      vulnCount: { critical: 2, high: 8, medium: 24, low: 42 },
      sbomStatus: 'complete',
      complianceScore: 87
    },
    {
      id: 'env-2',
      name: 'Staging',
      project: 'api-gateway-service',
      status: 'healthy',
      version: 'v1.8.0',
      lastDeployed: '2024-12-02 09:15',
      vulnCount: { critical: 0, high: 3, medium: 12, low: 28 },
      sbomStatus: 'complete',
      complianceScore: 94
    },
    {
      id: 'env-3',
      name: 'Development',
      project: 'auth-service',
      status: 'critical',
      version: 'v3.0.0-beta',
      lastDeployed: '2024-12-02 11:45',
      vulnCount: { critical: 5, high: 15, medium: 32, low: 18 },
      sbomStatus: 'pending',
      complianceScore: 62
    },
    {
      id: 'env-4',
      name: 'Production',
      project: 'user-management',
      status: 'healthy',
      version: 'v4.1.2',
      lastDeployed: '2024-11-28 16:20',
      vulnCount: { critical: 0, high: 1, medium: 8, low: 35 },
      sbomStatus: 'complete',
      complianceScore: 96
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-[var(--text-muted)] bg-[var(--bg-surface)]/50 border-[var(--border-primary)]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Use shared vulnerability metrics instead of calculating from environments
  const totalVulns = vulnMetrics;

  const filteredEnvironments = environments.filter(env =>
    env.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
    env.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <div className="border-b border-[var(--border-primary)] bg-[var(--bg-base)]/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--accent-cyan)]/10 rounded-lg border border-[var(--accent-cyan)]/30">
                  <Layers className="h-6 w-6 text-[var(--accent-cyan)]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">Optimal Hub</h1>
                  <p className="text-sm text-[var(--text-muted)]">Centralized security and deployment management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                className="enterprise-btn-secondary flex items-center space-x-2"
                onClick={() => {
                  clearMetricsCache();
                  refresh();
                }}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="border-b border-[var(--border-primary)] bg-[var(--bg-surface)]/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="metric-card group">
              <div className="text-[var(--accent-blue)] text-xs font-medium uppercase tracking-wide mb-1">Environments</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{environments.length}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Active</div>
            </div>
            <div className="metric-card group border-red-500/30 hover:border-red-500/50">
              <div className="text-red-400 text-xs font-medium uppercase tracking-wide mb-1">Critical</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{totalVulns.critical}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Vulnerabilities</div>
            </div>
            <div className="metric-card group border-orange-500/30 hover:border-orange-500/50">
              <div className="text-orange-400 text-xs font-medium uppercase tracking-wide mb-1">High</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{totalVulns.high}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Vulnerabilities</div>
            </div>
            <div className="metric-card group border-yellow-500/30 hover:border-yellow-500/50">
              <div className="text-yellow-400 text-xs font-medium uppercase tracking-wide mb-1">Medium</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{totalVulns.medium}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Vulnerabilities</div>
            </div>
            <div className="metric-card group border-green-500/30 hover:border-green-500/50">
              <div className="text-green-400 text-xs font-medium uppercase tracking-wide mb-1">Low</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{totalVulns.low}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Vulnerabilities</div>
            </div>
            <div className="metric-card group border-purple-500/30 hover:border-purple-500/50">
              <div className="text-purple-400 text-xs font-medium uppercase tracking-wide mb-1">SBOM</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{environments.filter(e => e.sbomStatus === 'complete').length}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Complete</div>
            </div>
            <div className="metric-card group border-[var(--accent-cyan)]/30 hover:border-[var(--accent-cyan)]/50">
              <div className="text-[var(--accent-cyan)] text-xs font-medium uppercase tracking-wide mb-1">Compliance</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{Math.round(environments.reduce((a, e) => a + e.complianceScore, 0) / environments.length)}%</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Average</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--border-primary)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {[
              { id: 'environments', label: 'Environments', icon: Package },
              { id: 'vulnerabilities', label: 'Vulnerabilities', icon: Shield },
              { id: 'sbom', label: 'SBOM', icon: FileText },
              { id: 'compliance', label: 'Compliance', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="border-b border-[var(--border-primary)] bg-[var(--bg-surface)]/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search environments, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)]/30 transition-all"
              />
            </div>
            <button className="enterprise-btn-secondary flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'environments' && (
          <div className="space-y-4">
            {filteredEnvironments.length === 0 ? (
              <div className="enterprise-card p-12 text-center">
                <Package className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No environments found</h3>
                <p className="text-[var(--text-muted)]">Try adjusting your search query</p>
              </div>
            ) : (
              filteredEnvironments.map((env) => (
                <div
                  key={env.id}
                  className="enterprise-card hover:border-[var(--border-secondary)] transition-all duration-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2.5 rounded-lg border ${getStatusColor(env.status)}`}>
                          {getStatusIcon(env.status)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{env.project}</h3>
                            <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(env.status)}`}>
                              {env.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1.5 text-sm text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {env.name}
                            </span>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <GitBranch className="h-3 w-3" />
                              <span>{env.version}</span>
                            </span>
                            <span>•</span>
                            <span>Deployed {env.lastDeployed}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <a href={`/hub/${env.id}`} className="enterprise-btn flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </a>
                      </div>
                    </div>

                    {/* Vulnerability Summary */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      <div className="bg-[var(--bg-base)] rounded-lg p-3 border border-[var(--border-primary)]">
                        <div className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">Critical</div>
                        <div className={`text-xl font-bold ${env.vulnCount.critical > 0 ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                          {env.vulnCount.critical}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-base)] rounded-lg p-3 border border-[var(--border-primary)]">
                        <div className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">High</div>
                        <div className={`text-xl font-bold ${env.vulnCount.high > 0 ? 'text-orange-400' : 'text-[var(--text-muted)]'}`}>
                          {env.vulnCount.high}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-base)] rounded-lg p-3 border border-[var(--border-primary)]">
                        <div className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">Medium</div>
                        <div className={`text-xl font-bold ${env.vulnCount.medium > 0 ? 'text-yellow-400' : 'text-[var(--text-muted)]'}`}>
                          {env.vulnCount.medium}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-base)] rounded-lg p-3 border border-[var(--border-primary)]">
                        <div className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">Low</div>
                        <div className="text-xl font-bold text-green-400">{env.vulnCount.low}</div>
                      </div>
                      <div className="bg-[var(--bg-base)] rounded-lg p-3 border border-[var(--border-primary)]">
                        <div className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">SBOM</div>
                        <div className={`text-sm font-semibold ${
                          env.sbomStatus === 'complete' ? 'text-green-400' :
                          env.sbomStatus === 'pending' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {env.sbomStatus.toUpperCase()}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-base)] rounded-lg p-3 border border-[var(--border-primary)]">
                        <div className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">Compliance</div>
                        <div className={`text-xl font-bold ${
                          env.complianceScore >= 90 ? 'text-green-400' :
                          env.complianceScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {env.complianceScore}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'vulnerabilities' && (
          <div className="enterprise-card p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                <Shield className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Vulnerability Management</h3>
                <p className="text-[var(--text-muted)]">View and manage all CVEs across your environments</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[var(--bg-base)] rounded-lg p-4 border border-[var(--border-primary)]">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{totalVulns.critical + totalVulns.high}</div>
                <div className="text-sm text-[var(--text-muted)]">High Priority Issues</div>
              </div>
              <div className="bg-[var(--bg-base)] rounded-lg p-4 border border-[var(--border-primary)]">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{totalVulns.critical + totalVulns.high + totalVulns.medium + totalVulns.low}</div>
                <div className="text-sm text-[var(--text-muted)]">Total Vulnerabilities</div>
              </div>
              <div className="bg-[var(--bg-base)] rounded-lg p-4 border border-[var(--border-primary)]">
                <div className="text-2xl font-bold text-green-400">0</div>
                <div className="text-sm text-[var(--text-muted)]">Remediated This Week</div>
              </div>
            </div>
            <a href="/vulnerabilities" className="enterprise-btn inline-flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Open Vulnerability Management</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        {activeTab === 'sbom' && (
          <div className="enterprise-card p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <FileText className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">SBOM Management</h3>
                <p className="text-[var(--text-muted)]">Software Bill of Materials for all projects</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[var(--bg-base)] rounded-lg p-4 border border-[var(--border-primary)]">
                <div className="text-2xl font-bold text-green-400">{environments.filter(e => e.sbomStatus === 'complete').length}</div>
                <div className="text-sm text-[var(--text-muted)]">Complete SBOMs</div>
              </div>
              <div className="bg-[var(--bg-base)] rounded-lg p-4 border border-[var(--border-primary)]">
                <div className="text-2xl font-bold text-yellow-400">{environments.filter(e => e.sbomStatus === 'pending').length}</div>
                <div className="text-sm text-[var(--text-muted)]">Pending</div>
              </div>
              <div className="bg-[var(--bg-base)] rounded-lg p-4 border border-[var(--border-primary)]">
                <div className="text-2xl font-bold text-red-400">{environments.filter(e => e.sbomStatus === 'outdated').length}</div>
                <div className="text-sm text-[var(--text-muted)]">Outdated</div>
              </div>
            </div>
            <a href="/sbom" className="enterprise-btn inline-flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Open SBOM Management</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="enterprise-card p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-[var(--accent-cyan)]/10 rounded-lg border border-[var(--accent-cyan)]/30">
                <BarChart3 className="h-6 w-6 text-[var(--accent-cyan)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Compliance Dashboard</h3>
                <p className="text-[var(--text-muted)]">OSCAL SSP, POA&M, and authorization status</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[var(--bg-base)] rounded-lg p-4 border border-[var(--border-primary)]">
                <div className="text-2xl font-bold text-[var(--accent-cyan)]">{Math.round(environments.reduce((a, e) => a + e.complianceScore, 0) / environments.length)}%</div>
                <div className="text-sm text-[var(--text-muted)]">Average Compliance Score</div>
              </div>
              <div className="bg-[var(--bg-base)] rounded-lg p-4 border border-[var(--border-primary)]">
                <div className="text-2xl font-bold text-green-400">{environments.filter(e => e.complianceScore >= 90).length}</div>
                <div className="text-sm text-[var(--text-muted)]">Fully Compliant</div>
              </div>
              <div className="bg-[var(--bg-base)] rounded-lg p-4 border border-[var(--border-primary)]">
                <div className="text-2xl font-bold text-yellow-400">{environments.filter(e => e.complianceScore < 90 && e.complianceScore >= 70).length}</div>
                <div className="text-sm text-[var(--text-muted)]">Needs Attention</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/oscal" className="enterprise-btn-secondary inline-flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>OSCAL SSP</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <a href="/poam" className="enterprise-btn-secondary inline-flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>POA&M</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <a href="/authorization" className="enterprise-btn inline-flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Authorization</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
