'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Package, GitBranch, ChevronRight, Search, Filter, RefreshCw, ExternalLink, Eye, FileText, BarChart3 } from 'lucide-react';

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
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
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

  const totalVulns = environments.reduce((acc, env) => ({
    critical: acc.critical + env.vulnCount.critical,
    high: acc.high + env.vulnCount.high,
    medium: acc.medium + env.vulnCount.medium,
    low: acc.low + env.vulnCount.low
  }), { critical: 0, high: 0, medium: 0, low: 0 });

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Optimal Hub</h1>
              <p className="text-sm text-slate-400">Centralized security and deployment management</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="border-b border-slate-700 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="text-blue-400 text-xs font-medium mb-1">Total Environments</div>
              <div className="text-2xl font-bold text-white">{environments.length}</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="text-red-400 text-xs font-medium mb-1">Critical</div>
              <div className="text-2xl font-bold text-white">{totalVulns.critical}</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="text-orange-400 text-xs font-medium mb-1">High</div>
              <div className="text-2xl font-bold text-white">{totalVulns.high}</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-yellow-400 text-xs font-medium mb-1">Medium</div>
              <div className="text-2xl font-bold text-white">{totalVulns.medium}</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="text-green-400 text-xs font-medium mb-1">Low</div>
              <div className="text-2xl font-bold text-white">{totalVulns.low}</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="text-purple-400 text-xs font-medium mb-1">SBOM Complete</div>
              <div className="text-2xl font-bold text-white">{environments.filter(e => e.sbomStatus === 'complete').length}</div>
            </div>
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
              <div className="text-teal-400 text-xs font-medium mb-1">Avg Compliance</div>
              <div className="text-2xl font-bold text-white">{Math.round(environments.reduce((a, e) => a + e.complianceScore, 0) / environments.length)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
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
                  className={`flex items-center space-x-2 px-4 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-teal-400 text-teal-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="border-b border-slate-700 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search environments, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">
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
            {environments.map((env) => (
              <div
                key={env.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg border ${getStatusColor(env.status)}`}>
                        {getStatusIcon(env.status)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-white">{env.project}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(env.status)}`}>
                            {env.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-slate-400">
                          <span>{env.name}</span>
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
                      <a href={`/hub/${env.id}`} className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </a>
                    </div>
                  </div>

                  {/* Vulnerability Summary */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Critical</div>
                      <div className={`text-xl font-bold ${env.vulnCount.critical > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {env.vulnCount.critical}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">High</div>
                      <div className={`text-xl font-bold ${env.vulnCount.high > 0 ? 'text-orange-400' : 'text-slate-500'}`}>
                        {env.vulnCount.high}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Medium</div>
                      <div className={`text-xl font-bold ${env.vulnCount.medium > 0 ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {env.vulnCount.medium}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Low</div>
                      <div className="text-xl font-bold text-green-400">{env.vulnCount.low}</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">SBOM</div>
                      <div className={`text-sm font-medium ${
                        env.sbomStatus === 'complete' ? 'text-green-400' : 
                        env.sbomStatus === 'pending' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {env.sbomStatus.toUpperCase()}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Compliance</div>
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
            ))}
          </div>
        )}

        {activeTab === 'vulnerabilities' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400">Vulnerability management view - shows all CVEs across environments</p>
            <a href="/vulnerabilities" className="inline-flex items-center space-x-2 mt-4 text-teal-400 hover:text-teal-300">
              <span>Open Vulnerability Management</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        {activeTab === 'sbom' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400">SBOM management view - software bill of materials for all projects</p>
            <a href="/sbom" className="inline-flex items-center space-x-2 mt-4 text-teal-400 hover:text-teal-300">
              <span>Open SBOM Management</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400">Compliance dashboard - OSCAL SSP, POA&M, and authorization status</p>
            <div className="flex space-x-4 mt-4">
              <a href="/oscal" className="inline-flex items-center space-x-2 text-teal-400 hover:text-teal-300">
                <span>OSCAL SSP</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <a href="/poam" className="inline-flex items-center space-x-2 text-teal-400 hover:text-teal-300">
                <span>POA&M</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <a href="/authorization" className="inline-flex items-center space-x-2 text-teal-400 hover:text-teal-300">
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

