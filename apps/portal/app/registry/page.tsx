'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Box,
  ChevronRight,
  Download,
  FileText,
  Shield,
  AlertTriangle,
  Clock,
  HardDrive,
  Cpu,
  Filter,
  ExternalLink,
  Package,
  Layers,
  FolderOpen,
  CircleDot,
  ChevronDown,
  Info,
  Settings,
  Bug,
  FileJson,
  Copy,
  Check,
} from 'lucide-react';

type TabType = 'versions' | 'overview' | 'config' | 'sbom' | 'vulnerabilities';
type FlavorType = 'iron-bank' | 'upstream' | 'all';

interface PackageVersion {
  version: string;
  flavor: 'Iron Bank' | 'Upstream';
  architecture: string;
  age: string;
  size: string;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    negligible: number;
    total: number;
  };
  digest: string;
  lastScanned: string;
}

interface PackageInfo {
  id: string;
  name: string;
  description: string;
  type: 'Package' | 'Image' | 'Chart';
  icon: string;
  maintainer: string;
  versions: PackageVersion[];
}

// Sample hardened packages similar to UDS Registry
const packages: PackageInfo[] = [
  {
    id: 'optimal-core',
    name: 'Optimal Core',
    description: 'Collection of packages that enable a secure baseline for cloud-native systems',
    type: 'Package',
    icon: '🛡️',
    maintainer: 'Optimal Platform',
    versions: [
      {
        version: '1.2.0',
        flavor: 'Iron Bank',
        architecture: 'amd64',
        age: '2 days ago',
        size: '2.1 GB',
        vulnerabilities: { critical: 1, high: 119, medium: 1154, low: 395, negligible: 4, total: 1692 },
        digest: 'sha256:abc123...',
        lastScanned: '2 hours ago',
      },
      {
        version: '1.2.0',
        flavor: 'Iron Bank',
        architecture: 'arm64',
        age: '2 days ago',
        size: '2.0 GB',
        vulnerabilities: { critical: 1, high: 119, medium: 1201, low: 405, negligible: 4, total: 1750 },
        digest: 'sha256:def456...',
        lastScanned: '2 hours ago',
      },
      {
        version: '1.2.0',
        flavor: 'Upstream',
        architecture: 'amd64',
        age: '2 days ago',
        size: '1.4 GB',
        vulnerabilities: { critical: 3, high: 57, medium: 128, low: 61, negligible: 0, total: 249 },
        digest: 'sha256:ghi789...',
        lastScanned: '2 hours ago',
      },
      {
        version: '1.1.0',
        flavor: 'Iron Bank',
        architecture: 'amd64',
        age: '7 days ago',
        size: '2.2 GB',
        vulnerabilities: { critical: 1, high: 128, medium: 1239, low: 441, negligible: 5, total: 1834 },
        digest: 'sha256:jkl012...',
        lastScanned: '1 day ago',
      },
      {
        version: '1.1.0',
        flavor: 'Upstream',
        architecture: 'amd64',
        age: '7 days ago',
        size: '1.5 GB',
        vulnerabilities: { critical: 3, high: 59, medium: 132, low: 69, negligible: 0, total: 263 },
        digest: 'sha256:mno345...',
        lastScanned: '1 day ago',
      },
    ],
  },
  {
    id: 'neuvector',
    name: 'NeuVector',
    description: 'Full lifecycle container security platform for Kubernetes',
    type: 'Package',
    icon: '🔒',
    maintainer: 'SUSE',
    versions: [
      {
        version: '5.3.0',
        flavor: 'Iron Bank',
        architecture: 'amd64',
        age: '5 days ago',
        size: '890 MB',
        vulnerabilities: { critical: 0, high: 12, medium: 45, low: 23, negligible: 2, total: 82 },
        digest: 'sha256:nv123...',
        lastScanned: '3 hours ago',
      },
      {
        version: '5.3.0',
        flavor: 'Upstream',
        architecture: 'amd64',
        age: '5 days ago',
        size: '750 MB',
        vulnerabilities: { critical: 0, high: 8, medium: 32, low: 18, negligible: 0, total: 58 },
        digest: 'sha256:nv456...',
        lastScanned: '3 hours ago',
      },
    ],
  },
  {
    id: 'keycloak',
    name: 'Keycloak',
    description: 'Open source identity and access management solution',
    type: 'Image',
    icon: '🔑',
    maintainer: 'Red Hat',
    versions: [
      {
        version: '24.0.1',
        flavor: 'Iron Bank',
        architecture: 'amd64',
        age: '3 days ago',
        size: '456 MB',
        vulnerabilities: { critical: 0, high: 5, medium: 28, low: 15, negligible: 1, total: 49 },
        digest: 'sha256:kc123...',
        lastScanned: '1 hour ago',
      },
    ],
  },
  {
    id: 'grafana',
    name: 'Grafana',
    description: 'Open source analytics and monitoring solution',
    type: 'Image',
    icon: '📊',
    maintainer: 'Grafana Labs',
    versions: [
      {
        version: '10.2.3',
        flavor: 'Iron Bank',
        architecture: 'amd64',
        age: '4 days ago',
        size: '320 MB',
        vulnerabilities: { critical: 0, high: 2, medium: 18, low: 12, negligible: 0, total: 32 },
        digest: 'sha256:gr123...',
        lastScanned: '2 hours ago',
      },
    ],
  },
  {
    id: 'loki',
    name: 'Loki',
    description: 'Horizontally scalable, highly available log aggregation system',
    type: 'Image',
    icon: '📝',
    maintainer: 'Grafana Labs',
    versions: [
      {
        version: '2.9.4',
        flavor: 'Iron Bank',
        architecture: 'amd64',
        age: '6 days ago',
        size: '185 MB',
        vulnerabilities: { critical: 0, high: 3, medium: 15, low: 8, negligible: 0, total: 26 },
        digest: 'sha256:lk123...',
        lastScanned: '4 hours ago',
      },
    ],
  },
  {
    id: 'promtail',
    name: 'Promtail',
    description: 'Agent for shipping logs to Loki',
    type: 'Image',
    icon: '📤',
    maintainer: 'Grafana Labs',
    versions: [
      {
        version: '2.9.4',
        flavor: 'Iron Bank',
        architecture: 'amd64',
        age: '6 days ago',
        size: '95 MB',
        vulnerabilities: { critical: 0, high: 1, medium: 8, low: 5, negligible: 0, total: 14 },
        digest: 'sha256:pt123...',
        lastScanned: '4 hours ago',
      },
    ],
  },
  {
    id: 'velero',
    name: 'Velero',
    description: 'Backup and migrate Kubernetes resources and persistent volumes',
    type: 'Image',
    icon: '💾',
    maintainer: 'VMware',
    versions: [
      {
        version: '1.13.0',
        flavor: 'Iron Bank',
        architecture: 'amd64',
        age: '8 days ago',
        size: '142 MB',
        vulnerabilities: { critical: 0, high: 4, medium: 22, low: 11, negligible: 1, total: 38 },
        digest: 'sha256:vl123...',
        lastScanned: '6 hours ago',
      },
    ],
  },
  {
    id: 'istio',
    name: 'Istio',
    description: 'Service mesh providing traffic management, security, and observability',
    type: 'Package',
    icon: '🕸️',
    maintainer: 'Istio',
    versions: [
      {
        version: '1.20.2',
        flavor: 'Iron Bank',
        architecture: 'amd64',
        age: '5 days ago',
        size: '1.1 GB',
        vulnerabilities: { critical: 0, high: 15, medium: 67, low: 34, negligible: 3, total: 119 },
        digest: 'sha256:is123...',
        lastScanned: '3 hours ago',
      },
    ],
  },
];

// Catalog structure
const catalogStructure = [
  {
    name: 'Airgap Store',
    icon: FolderOpen,
    packages: [],
    isExpanded: false,
  },
  {
    name: 'Public',
    icon: FolderOpen,
    packages: packages,
    isExpanded: true,
  },
];

export default function RegistryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo>(packages[0]);
  const [activeTab, setActiveTab] = useState<TabType>('versions');
  const [flavorFilter, setFlavorFilter] = useState<FlavorType>('all');
  const [copiedDigest, setCopiedDigest] = useState<string | null>(null);

  const filteredVersions = selectedPackage.versions.filter((v) => {
    if (flavorFilter === 'all') return true;
    if (flavorFilter === 'iron-bank') return v.flavor === 'Iron Bank';
    if (flavorFilter === 'upstream') return v.flavor === 'Upstream';
    return true;
  });

  const filteredPackages = packages.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyDigest = (digest: string) => {
    navigator.clipboard.writeText(digest);
    setCopiedDigest(digest);
    setTimeout(() => setCopiedDigest(null), 2000);
  };

  const VulnerabilityBadges = ({ vulns }: { vulns: PackageVersion['vulnerabilities'] }) => (
    <div className="flex items-center gap-1">
      {vulns.critical > 0 && (
        <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-500/20 text-red-400 border border-red-500/30">
          {vulns.critical}
        </span>
      )}
      {vulns.high > 0 && (
        <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
          {vulns.high}
        </span>
      )}
      {vulns.medium > 0 && (
        <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          {vulns.medium}
        </span>
      )}
      {vulns.low > 0 && (
        <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
          {vulns.low}
        </span>
      )}
      {vulns.negligible > 0 && (
        <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">
          {vulns.negligible}
        </span>
      )}
      <span className="ml-2 text-xs text-slate-500">Total: {vulns.total}</span>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-72px)]">
      {/* Sidebar - Catalog Browser */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Browse Catalog */}
        <div className="p-4 border-b border-slate-800">
          <Link href="/registry" className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white">
            <Package className="w-4 h-4" />
            Browse Catalog
          </Link>
        </div>

        {/* Organizations */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Orgs</div>

            {catalogStructure.map((org) => (
              <div key={org.name} className="mb-2">
                <div className="flex items-center gap-2 text-sm text-slate-400 py-1">
                  <org.icon className="w-4 h-4" />
                  <span>{org.name}</span>
                  {org.isExpanded && <ChevronDown className="w-3 h-3 ml-auto" />}
                </div>

                {org.isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {(searchTerm ? filteredPackages : org.packages).map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`w-full flex items-center gap-2 text-sm py-1.5 px-2 rounded-md transition-colors ${
                          selectedPackage.id === pkg.id
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <CircleDot className={`w-3 h-3 ${
                          selectedPackage.id === pkg.id ? 'text-emerald-400' : 'text-slate-600'
                        }`} />
                        <span>{pkg.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Breadcrumb */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/registry" className="hover:text-white">Catalog</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-500">Public</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{selectedPackage.name}</span>
          </div>
        </div>

        {/* Package Header */}
        <div className="px-6 py-6 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-3xl">
              {selectedPackage.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{selectedPackage.name}</h1>
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                  {selectedPackage.type}
                </span>
              </div>
              <p className="text-slate-400 mt-1">{selectedPackage.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                <span>Maintainer: {selectedPackage.maintainer}</span>
                <span>•</span>
                <span>{selectedPackage.versions.length} versions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-slate-800 bg-slate-900/30">
          <div className="flex gap-1">
            {(['versions', 'overview', 'config', 'sbom', 'vulnerabilities'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'versions' && <Layers className="w-4 h-4" />}
                {tab === 'overview' && <Info className="w-4 h-4" />}
                {tab === 'config' && <Settings className="w-4 h-4" />}
                {tab === 'sbom' && <FileJson className="w-4 h-4" />}
                {tab === 'vulnerabilities' && <Bug className="w-4 h-4" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'versions' && (
            <div>
              {/* Version Search and Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search versions..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={flavorFilter}
                    onChange={(e) => setFlavorFilter(e.target.value as FlavorType)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="all">All Flavors</option>
                    <option value="iron-bank">Iron Bank</option>
                    <option value="upstream">Upstream</option>
                  </select>
                </div>
              </div>

              {/* Versions Table */}
              <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Version</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Flavor</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Architecture</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Age</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Size</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vulnerabilities</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredVersions.map((version, idx) => (
                      <tr key={`${version.version}-${version.flavor}-${version.architecture}-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-white">{version.version}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            version.flavor === 'Iron Bank'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-600/20 text-slate-400 border border-slate-500/30'
                          }`}>
                            {version.flavor}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">{version.architecture}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{version.age}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{version.size}</td>
                        <td className="px-4 py-3">
                          <VulnerabilityBadges vulns={version.vulnerabilities} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyDigest(version.digest)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                              title="Copy digest"
                            >
                              {copiedDigest === version.digest ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Download SBOM">
                              <FileJson className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="View vulnerabilities">
                              <Shield className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Download">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="max-w-3xl">
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">About {selectedPackage.name}</h2>
                <p className="text-slate-400 mb-6">{selectedPackage.description}</p>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Package Information</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-slate-400">Type</dt>
                        <dd className="text-sm text-white">{selectedPackage.type}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-slate-400">Maintainer</dt>
                        <dd className="text-sm text-white">{selectedPackage.maintainer}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-slate-400">Total Versions</dt>
                        <dd className="text-sm text-white">{selectedPackage.versions.length}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Latest Version</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-slate-400">Version</dt>
                        <dd className="text-sm text-white font-mono">{selectedPackage.versions[0]?.version}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-slate-400">Last Scanned</dt>
                        <dd className="text-sm text-white">{selectedPackage.versions[0]?.lastScanned}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sbom' && (
            <div className="max-w-3xl">
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Software Bill of Materials</h2>
                <p className="text-slate-400 mb-6">
                  Download the SBOM for {selectedPackage.name} in various formats.
                </p>

                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileJson className="w-5 h-5 text-emerald-400" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">CycloneDX (JSON)</div>
                        <div className="text-xs text-slate-400">Industry standard SBOM format</div>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400" />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">SPDX (JSON)</div>
                        <div className="text-xs text-slate-400">Linux Foundation standard format</div>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vulnerabilities' && (
            <div>
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Vulnerability Summary</h2>
                <div className="grid grid-cols-5 gap-4">
                  {(['critical', 'high', 'medium', 'low', 'negligible'] as const).map((severity) => {
                    const total = selectedPackage.versions.reduce((sum, v) => sum + v.vulnerabilities[severity], 0);
                    const colors = {
                      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
                      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                      negligible: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
                    };
                    return (
                      <div key={severity} className={`p-4 rounded-lg border ${colors[severity]}`}>
                        <div className="text-2xl font-bold">{total}</div>
                        <div className="text-sm capitalize">{severity}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
                <h3 className="text-md font-semibold text-white mb-4">Vulnerability Details by Version</h3>
                <p className="text-slate-400 text-sm">
                  Select a specific version from the Versions tab to view detailed vulnerability information.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="max-w-3xl">
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Configuration</h2>
                <p className="text-slate-400 mb-6">
                  Pull and deploy {selectedPackage.name} using the following commands.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Docker Pull Command</label>
                    <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm text-emerald-400">
                      docker pull registry.gooptimal.io/{selectedPackage.id}:{selectedPackage.versions[0]?.version}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Helm Install</label>
                    <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm text-emerald-400">
                      helm install {selectedPackage.id} oci://registry.gooptimal.io/charts/{selectedPackage.id} --version {selectedPackage.versions[0]?.version}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
