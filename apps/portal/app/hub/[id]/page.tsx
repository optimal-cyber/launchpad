'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Shield, AlertTriangle, CheckCircle, Clock, Package, GitBranch, ArrowLeft, RefreshCw, ExternalLink, FileText, Download, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Vulnerability {
  id: string;
  cve: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  package: string;
  version: string;
  fixedVersion: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export default function EnvironmentDetailPage() {
  const params = useParams();
  const envId = params.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'vulnerabilities' | 'sbom' | 'compliance' | 'deployments'>('overview');

  // Mock environment data based on ID
  const environments: Record<string, any> = {
    'env-1': {
      id: 'env-1',
      name: 'Production',
      project: 'flask-container-test',
      status: 'warning',
      version: 'v2.3.1',
      lastDeployed: '2024-12-01 14:32',
      vulnCount: { critical: 2, high: 8, medium: 24, low: 42 },
      sbomStatus: 'complete',
      complianceScore: 87,
      image: 'registry.optimal.io/flask-container-test:v2.3.1',
      cluster: 'prod-us-east-1',
      namespace: 'production',
      replicas: 3
    },
    'env-2': {
      id: 'env-2',
      name: 'Staging',
      project: 'api-gateway-service',
      status: 'healthy',
      version: 'v1.8.0',
      lastDeployed: '2024-12-02 09:15',
      vulnCount: { critical: 0, high: 3, medium: 12, low: 28 },
      sbomStatus: 'complete',
      complianceScore: 94,
      image: 'registry.optimal.io/api-gateway:v1.8.0',
      cluster: 'staging-us-east-1',
      namespace: 'staging',
      replicas: 2
    },
    'env-3': {
      id: 'env-3',
      name: 'Development',
      project: 'auth-service',
      status: 'critical',
      version: 'v3.0.0-beta',
      lastDeployed: '2024-12-02 11:45',
      vulnCount: { critical: 5, high: 15, medium: 32, low: 18 },
      sbomStatus: 'pending',
      complianceScore: 62,
      image: 'registry.optimal.io/auth-service:v3.0.0-beta',
      cluster: 'dev-us-east-1',
      namespace: 'development',
      replicas: 1
    },
    'env-4': {
      id: 'env-4',
      name: 'Production',
      project: 'user-management',
      status: 'healthy',
      version: 'v4.1.2',
      lastDeployed: '2024-11-28 16:20',
      vulnCount: { critical: 0, high: 1, medium: 8, low: 35 },
      sbomStatus: 'complete',
      complianceScore: 96,
      image: 'registry.optimal.io/user-management:v4.1.2',
      cluster: 'prod-us-east-1',
      namespace: 'production',
      replicas: 5
    }
  };

  const env = environments[envId] || environments['env-1'];

  const vulnerabilities: Vulnerability[] = [
    { id: '1', cve: 'CVE-2024-1234', severity: 'critical', package: 'openssl', version: '1.1.1k', fixedVersion: '1.1.1l', description: 'Buffer overflow vulnerability in OpenSSL', status: 'open' },
    { id: '2', cve: 'CVE-2024-5678', severity: 'critical', package: 'libcurl', version: '7.79.0', fixedVersion: '7.80.0', description: 'Remote code execution in libcurl', status: 'in_progress' },
    { id: '3', cve: 'CVE-2024-9012', severity: 'high', package: 'python', version: '3.9.7', fixedVersion: '3.9.8', description: 'Denial of service vulnerability', status: 'open' },
    { id: '4', cve: 'CVE-2024-3456', severity: 'high', package: 'nginx', version: '1.20.1', fixedVersion: '1.20.2', description: 'HTTP request smuggling', status: 'open' },
    { id: '5', cve: 'CVE-2024-7890', severity: 'medium', package: 'flask', version: '2.0.1', fixedVersion: '2.0.2', description: 'Cross-site scripting vulnerability', status: 'resolved' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-400/10';
      case 'high': return 'text-orange-400 bg-orange-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-green-400 bg-green-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-400" />;
      default: return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/hub" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Hub</span>
              </Link>
              <div className="h-6 w-px bg-slate-700"></div>
              <div className="flex items-center space-x-3">
                {getStatusIcon(env.status)}
                <div>
                  <h1 className="text-xl font-bold text-white">{env.project}</h1>
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <span>{env.name}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <GitBranch className="h-3 w-3" />
                      <span>{env.version}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
                <RefreshCw className="h-4 w-4" />
                <span>Rescan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'vulnerabilities', label: 'Vulnerabilities' },
              { id: 'sbom', label: 'SBOM' },
              { id: 'compliance', label: 'Compliance' },
              { id: 'deployments', label: 'Deployments' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-4 border-b-2 transition-colors text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-teal-400 text-teal-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Card */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Environment Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Status</div>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${getStatusColor(env.status)}`}>
                      {env.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Cluster</div>
                    <div className="text-white font-medium">{env.cluster}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Namespace</div>
                    <div className="text-white font-medium">{env.namespace}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Replicas</div>
                    <div className="text-white font-medium">{env.replicas}</div>
                  </div>
                </div>
              </div>

              {/* Vulnerability Summary */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Vulnerability Summary</h3>
                  <button 
                    onClick={() => setActiveTab('vulnerabilities')}
                    className="text-sm text-teal-400 hover:text-teal-300 flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-400">{env.vulnCount.critical}</div>
                    <div className="text-xs text-red-400 mt-1">Critical</div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-400">{env.vulnCount.high}</div>
                    <div className="text-xs text-orange-400 mt-1">High</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-400">{env.vulnCount.medium}</div>
                    <div className="text-xs text-yellow-400 mt-1">Medium</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-400">{env.vulnCount.low}</div>
                    <div className="text-xs text-green-400 mt-1">Low</div>
                  </div>
                </div>
              </div>

              {/* Recent Vulnerabilities */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Critical & High Vulnerabilities</h3>
                <div className="space-y-3">
                  {vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').slice(0, 5).map((vuln) => (
                    <div key={vuln.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                          {vuln.severity.toUpperCase()}
                        </span>
                        <div>
                          <div className="text-white font-medium">{vuln.cve}</div>
                          <div className="text-sm text-slate-400">{vuln.package} {vuln.version}</div>
                        </div>
                      </div>
                      <div className="text-sm text-slate-400">
                        Fix: {vuln.fixedVersion}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Image Info */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Container Image</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Image</div>
                    <div className="text-sm text-white font-mono bg-slate-900 p-2 rounded break-all">{env.image}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Last Deployed</div>
                    <div className="text-white">{env.lastDeployed}</div>
                  </div>
                </div>
              </div>

              {/* Compliance Score */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Compliance</h3>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${
                    env.complianceScore >= 90 ? 'text-green-400' :
                    env.complianceScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {env.complianceScore}%
                  </div>
                  <div className="text-sm text-slate-400 mt-2">Compliance Score</div>
                </div>
                <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      env.complianceScore >= 90 ? 'bg-green-500' :
                      env.complianceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${env.complianceScore}%` }}
                  ></div>
                </div>
              </div>

              {/* SBOM Status */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">SBOM Status</h3>
                <div className={`flex items-center space-x-2 ${
                  env.sbomStatus === 'complete' ? 'text-green-400' :
                  env.sbomStatus === 'pending' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {env.sbomStatus === 'complete' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  <span className="font-medium">{env.sbomStatus.toUpperCase()}</span>
                </div>
                <button className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                  <FileText className="h-4 w-4" />
                  <span>View SBOM</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vulnerabilities' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">CVE</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Fixed In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {vulnerabilities.map((vuln) => (
                  <tr key={vuln.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 text-sm text-white font-medium">{vuln.cve}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                        {vuln.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{vuln.package}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{vuln.version}</td>
                    <td className="px-6 py-4 text-sm text-teal-400">{vuln.fixedVersion}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        vuln.status === 'resolved' ? 'text-green-400 bg-green-400/10' :
                        vuln.status === 'in_progress' ? 'text-yellow-400 bg-yellow-400/10' :
                        'text-slate-400 bg-slate-400/10'
                      }`}>
                        {vuln.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'sbom' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400">Software Bill of Materials for {env.project}</p>
            <Link href="/sbom" className="inline-flex items-center space-x-2 mt-4 text-teal-400 hover:text-teal-300">
              <span>Open Full SBOM View</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400">Compliance details for {env.project}</p>
            <div className="flex space-x-4 mt-4">
              <Link href="/oscal" className="inline-flex items-center space-x-2 text-teal-400 hover:text-teal-300">
                <span>OSCAL SSP</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link href="/poam" className="inline-flex items-center space-x-2 text-teal-400 hover:text-teal-300">
                <span>POA&M</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'deployments' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400">Deployment history for {env.project}</p>
          </div>
        )}
      </div>
    </div>
  );
}

