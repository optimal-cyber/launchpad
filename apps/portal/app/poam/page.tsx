'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Search,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Shield,
  FileText,
  GitBranch,
  History,
  ChevronDown,
  Ban,
  FileCheck,
  Filter,
} from 'lucide-react';

// Types
interface CVEItem {
  id: string;
  cve: string;
  title: string;
  scanType: 'container' | 'sast' | 'dast' | 'dependency' | 'secret';
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvssRaw: number;
  cvssVersion: string;
  cveType: string;
  package: string;
  version: string;
  createdAt: string;
  status: 'open' | 'in_progress' | 'remediated' | 'blacklisted';
}

interface POAMItem {
  id: string;
  controlId: string;
  weakness: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'ongoing' | 'completed' | 'risk_accepted';
  scheduledCompletionDate: string;
  submittedDate: string;
  assignedTo: string;
  milestones: Milestone[];
  comments: Comment[];
  remediation: string;
  resources: string;
  estimatedCost: string;
}

interface Milestone {
  id: string;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface Comment {
  id: string;
  author: string;
  content: string;
  created_at: string;
}

interface ScanFile {
  id: string;
  name: string;
  scanType: string;
  cveCount: number;
  uploadedAt: string;
  status: 'processed' | 'processing' | 'failed';
}

// Mock data for CVEs
const mockCVEs: CVEItem[] = [
  {
    id: '1',
    cve: 'CVE-2023-43804',
    title: 'urllib3 HTTP redirect handling vulnerability',
    scanType: 'container',
    severity: 'high',
    cvssRaw: 8.1,
    cvssVersion: '3.1',
    cveType: 'Network',
    package: 'urllib3',
    version: '1.26.5',
    createdAt: '2024-05-15',
    status: 'open',
  },
  {
    id: '2',
    cve: 'CVE-2023-41105',
    title: 'Python path traversal vulnerability',
    scanType: 'container',
    severity: 'high',
    cvssRaw: 7.5,
    cvssVersion: '3.1',
    cveType: 'Local',
    package: 'python',
    version: '3.9.7',
    createdAt: '2024-05-14',
    status: 'open',
  },
  {
    id: '3',
    cve: 'CVE-2023-27043',
    title: 'Python email parsing vulnerability',
    scanType: 'container',
    severity: 'medium',
    cvssRaw: 5.3,
    cvssVersion: '3.1',
    cveType: 'Network',
    package: 'python',
    version: '3.9.7',
    createdAt: '2024-05-13',
    status: 'open',
  },
  {
    id: '4',
    cve: 'CVE-2024-21503',
    title: 'Node.js HTTP/2 denial of service',
    scanType: 'dependency',
    severity: 'critical',
    cvssRaw: 9.1,
    cvssVersion: '3.1',
    cveType: 'Network',
    package: 'nodejs',
    version: '18.14.0',
    createdAt: '2024-05-12',
    status: 'open',
  },
  {
    id: '5',
    cve: 'CVE-2023-44487',
    title: 'HTTP/2 Rapid Reset Attack',
    scanType: 'container',
    severity: 'critical',
    cvssRaw: 9.8,
    cvssVersion: '3.1',
    cveType: 'Network',
    package: 'nginx',
    version: '1.24.0',
    createdAt: '2024-05-11',
    status: 'in_progress',
  },
  {
    id: '6',
    cve: 'CVE-2023-38545',
    title: 'curl SOCKS5 heap buffer overflow',
    scanType: 'container',
    severity: 'critical',
    cvssRaw: 9.8,
    cvssVersion: '3.1',
    cveType: 'Network',
    package: 'curl',
    version: '7.88.1',
    createdAt: '2024-05-10',
    status: 'open',
  },
  {
    id: '7',
    cve: 'CVE-2023-36884',
    title: 'Microsoft Office code execution',
    scanType: 'sast',
    severity: 'high',
    cvssRaw: 8.8,
    cvssVersion: '3.1',
    cveType: 'Local',
    package: 'ms-office-sdk',
    version: '16.0.14326',
    createdAt: '2024-05-09',
    status: 'remediated',
  },
  {
    id: '8',
    cve: 'CVE-2023-32681',
    title: 'Requests library proxy authentication leak',
    scanType: 'dependency',
    severity: 'medium',
    cvssRaw: 6.1,
    cvssVersion: '3.1',
    cveType: 'Network',
    package: 'requests',
    version: '2.28.0',
    createdAt: '2024-05-08',
    status: 'open',
  },
];

const mockScanFiles: ScanFile[] = [
  { id: '1', name: 'container-scan-2024-05-15.json', scanType: 'Container Scan', cveCount: 45, uploadedAt: '2024-05-15', status: 'processed' },
  { id: '2', name: 'dependency-check-report.json', scanType: 'Dependency Scan', cveCount: 28, uploadedAt: '2024-05-14', status: 'processed' },
  { id: '3', name: 'sast-results-main.sarif', scanType: 'SAST', cveCount: 12, uploadedAt: '2024-05-13', status: 'processed' },
  { id: '4', name: 'trivy-scan-latest.json', scanType: 'Container Scan', cveCount: 67, uploadedAt: '2024-05-12', status: 'processing' },
];

type TabId = 'project-cves' | 'scan-files' | 'project-files' | 'pipeline-history' | 'poam-items';

function POAMPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('project-cves');
  const [cveItems, setCveItems] = useState<CVEItem[]>(mockCVEs);
  const [poamItems, setPOAMItems] = useState<POAMItem[]>([]);
  const [scanFiles] = useState<ScanFile[]>(mockScanFiles);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [scanTypeFilter, setScanTypeFilter] = useState('all');
  const [selectedCVEs, setSelectedCVEs] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<POAMItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPOAMData, setNewPOAMData] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState('optimal-platform');
  const [selectedEnv, setSelectedEnv] = useState('production');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();

    const createMode = searchParams?.get('create');
    if (createMode === 'true') {
      const storedData = localStorage.getItem('poam_creation_data');
      if (storedData) {
        const data = JSON.parse(storedData);
        setNewPOAMData(data);
        setShowCreateModal(true);
        localStorage.removeItem('poam_creation_data');
      }
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      const storedItems = localStorage.getItem('poam_items');
      if (storedItems) {
        setPOAMItems(JSON.parse(storedItems));
      } else {
        const defaultItems: POAMItem[] = [
          {
            id: '1',
            controlId: 'AC-2',
            weakness: 'Account Management - Inadequate account review process',
            severity: 'high',
            status: 'ongoing',
            scheduledCompletionDate: '2025-11-15',
            submittedDate: '2025-09-01',
            assignedTo: 'John Doe',
            milestones: [
              { id: 'm1', description: 'Implement automated account review system', scheduledDate: '2025-10-01', status: 'completed', completedDate: '2025-09-28' },
              { id: 'm2', description: 'Train security team on new procedures', scheduledDate: '2025-10-15', status: 'in_progress' }
            ],
            comments: [],
            remediation: 'Implement automated account review process and update security policies',
            resources: '2 FTE, Security Tools License',
            estimatedCost: '$50,000'
          },
          {
            id: '2',
            controlId: 'AU-6',
            weakness: 'Audit Review - Insufficient log analysis',
            severity: 'medium',
            status: 'open',
            scheduledCompletionDate: '2025-12-01',
            submittedDate: '2025-09-15',
            assignedTo: 'Jane Smith',
            milestones: [],
            comments: [],
            remediation: 'Deploy SIEM solution and establish log review procedures',
            resources: '1 FTE, SIEM Tool',
            estimatedCost: '$75,000'
          },
        ];
        localStorage.setItem('poam_items', JSON.stringify(defaultItems));
        setPOAMItems(defaultItems);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  // Calculate CVE metrics
  const cveMetrics = {
    total: cveItems.length,
    needingAction: cveItems.filter(c => c.status === 'open').length,
    critical: cveItems.filter(c => c.severity === 'critical').length,
    high: cveItems.filter(c => c.severity === 'high').length,
    medium: cveItems.filter(c => c.severity === 'medium').length,
    low: cveItems.filter(c => c.severity === 'low').length,
    blacklisted: cveItems.filter(c => c.status === 'blacklisted').length,
  };

  // Filter CVEs
  const filteredCVEs = cveItems.filter((cve) => {
    const matchesSearch = searchTerm === '' ||
      cve.cve.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cve.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cve.package.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || cve.severity === severityFilter;
    const matchesScanType = scanTypeFilter === 'all' || cve.scanType === scanTypeFilter;
    return matchesSearch && matchesSeverity && matchesScanType;
  });

  // Handle checkbox selection
  const handleSelectAll = () => {
    if (selectedCVEs.length === filteredCVEs.length) {
      setSelectedCVEs([]);
    } else {
      setSelectedCVEs(filteredCVEs.map(c => c.id));
    }
  };

  const handleSelectCVE = (id: string) => {
    setSelectedCVEs(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'project-cves', label: 'PROJECT CVEs', icon: AlertTriangle },
    { id: 'scan-files', label: 'SCAN FILES', icon: FileText },
    { id: 'project-files', label: 'PROJECT FILES', icon: GitBranch },
    { id: 'pipeline-history', label: 'PIPELINE HISTORY', icon: History },
    { id: 'poam-items', label: 'POA&M ITEMS', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-cyan)] mx-auto mb-4"></div>
          <p className="text-[var(--text-primary)]">Loading Cyber POA&M...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="poam-header mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-wide">Cyber POA&M</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Plan of Action and Milestones - CVE Management
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Project Selector */}
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="enterprise-select appearance-none pr-8"
              >
                <option value="optimal-platform">optimal-platform</option>
                <option value="api-gateway">api-gateway</option>
                <option value="scanner-service">scanner-service</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            </div>
            {/* Environment Selector */}
            <div className="relative">
              <select
                value={selectedEnv}
                onChange={(e) => setSelectedEnv(e.target.value)}
                className="enterprise-select appearance-none pr-8"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            </div>
            {/* Actions */}
            <button
              onClick={handleRefresh}
              className="enterprise-btn enterprise-btn-secondary"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="enterprise-btn enterprise-btn-secondary">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* CVE Metrics Row */}
      <div className="cve-metrics-row mb-6">
        <div className="cve-metric-card">
          <div className="metric-value">{cveMetrics.total}</div>
          <div className="metric-label">Total CVEs</div>
        </div>
        <div className="cve-metric-card warning">
          <div className="metric-value">{cveMetrics.needingAction}</div>
          <div className="metric-label">Needing Action</div>
        </div>
        <div className="cve-metric-card critical">
          <div className="metric-value">{cveMetrics.critical}</div>
          <div className="metric-label">Critical</div>
        </div>
        <div className="cve-metric-card high">
          <div className="metric-value">{cveMetrics.high}</div>
          <div className="metric-label">High</div>
        </div>
        <div className="cve-metric-card medium">
          <div className="metric-value">{cveMetrics.medium}</div>
          <div className="metric-label">Medium</div>
        </div>
        <div className="cve-metric-card low">
          <div className="metric-value">{cveMetrics.low}</div>
          <div className="metric-label">Low</div>
        </div>
        <div className="cve-metric-card blacklist">
          <div className="metric-value">{cveMetrics.blacklisted}</div>
          <div className="metric-label">Blacklisted</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="poam-tabs mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`poam-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'project-cves' && (
        <div className="enterprise-card">
          {/* Filters */}
          <div className="p-4 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-4">
              <div className="enterprise-search flex-1 max-w-md">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search CVEs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="enterprise-input"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--text-muted)]" />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="enterprise-select"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={scanTypeFilter}
                  onChange={(e) => setScanTypeFilter(e.target.value)}
                  className="enterprise-select"
                >
                  <option value="all">All Scan Types</option>
                  <option value="container">Container</option>
                  <option value="dependency">Dependency</option>
                  <option value="sast">SAST</option>
                  <option value="dast">DAST</option>
                </select>
              </div>
            </div>
          </div>

          {/* Batch Actions */}
          {selectedCVEs.length > 0 && (
            <div className="p-3 bg-[var(--bg-active)] border-b border-[var(--border-default)] flex items-center gap-4">
              <span className="text-sm text-[var(--text-secondary)]">
                {selectedCVEs.length} selected
              </span>
              <button className="enterprise-btn enterprise-btn-primary text-sm py-1">
                <FileCheck className="w-3.5 h-3.5" />
                Create POA&M
              </button>
              <button className="enterprise-btn enterprise-btn-secondary text-sm py-1">
                <Ban className="w-3.5 h-3.5" />
                Blacklist
              </button>
              <button className="enterprise-btn enterprise-btn-secondary text-sm py-1">
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          )}

          {/* CVE Table */}
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedCVEs.length === filteredCVEs.length && filteredCVEs.length > 0}
                      onChange={handleSelectAll}
                      className="enterprise-checkbox"
                    />
                  </th>
                  <th>CVE</th>
                  <th>Scan Type</th>
                  <th>Package</th>
                  <th>Severity</th>
                  <th>CVSS</th>
                  <th>Type</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCVEs.map((cve) => (
                  <tr key={cve.id} className={selectedCVEs.includes(cve.id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedCVEs.includes(cve.id)}
                        onChange={() => handleSelectCVE(cve.id)}
                        className="enterprise-checkbox"
                      />
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm text-[var(--accent-cyan)]">{cve.cve}</span>
                        <span className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">{cve.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="scan-type-badge">{cve.scanType}</span>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-sm text-[var(--text-primary)]">{cve.package}</span>
                        <span className="text-xs text-[var(--text-muted)]">v{cve.version}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`severity-badge ${getSeverityClass(cve.severity)}`}>
                        {cve.severity}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm text-[var(--text-primary)]">{cve.cvssRaw}</span>
                        <span className="text-xs text-[var(--text-muted)]">v{cve.cvssVersion}</span>
                      </div>
                    </td>
                    <td className="text-sm text-[var(--text-secondary)]">{cve.cveType}</td>
                    <td className="text-sm text-[var(--text-muted)]">{formatDate(cve.createdAt)}</td>
                    <td>
                      <button className="text-[var(--accent-cyan)] hover:text-[var(--text-primary)] transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCVEs.length === 0 && (
            <div className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No CVEs found</h3>
              <p className="text-[var(--text-muted)]">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'scan-files' && (
        <div className="enterprise-card">
          <div className="p-4 border-b border-[var(--border-default)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Scan Files</h3>
            <p className="text-sm text-[var(--text-muted)]">Uploaded vulnerability scan results</p>
          </div>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Scan Type</th>
                  <th>CVE Count</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scanFiles.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <span className="font-mono text-sm text-[var(--text-primary)]">{file.name}</span>
                    </td>
                    <td>
                      <span className="scan-type-badge">{file.scanType}</span>
                    </td>
                    <td className="font-mono text-[var(--accent-cyan)]">{file.cveCount}</td>
                    <td className="text-[var(--text-muted)]">{formatDate(file.uploadedAt)}</td>
                    <td>
                      <span className={`status-badge ${file.status === 'processed' ? 'success' : file.status === 'processing' ? 'warning' : 'error'}`}>
                        {file.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'project-files' && (
        <div className="enterprise-card p-12 text-center">
          <GitBranch className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Project Files</h3>
          <p className="text-[var(--text-muted)]">View and manage project source files with vulnerability annotations.</p>
        </div>
      )}

      {activeTab === 'pipeline-history' && (
        <div className="enterprise-card p-12 text-center">
          <History className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Pipeline Scan History</h3>
          <p className="text-[var(--text-muted)]">View historical pipeline scan results and trends.</p>
        </div>
      )}

      {activeTab === 'poam-items' && (
        <div className="enterprise-card">
          <div className="p-4 border-b border-[var(--border-default)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">POA&M Items</h3>
                <p className="text-sm text-[var(--text-muted)]">Plan of Action and Milestones</p>
              </div>
              <div className="text-sm text-[var(--text-muted)]">
                {poamItems.length} items
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Control ID</th>
                  <th>Weakness</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {poamItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="font-mono text-sm text-[var(--accent-cyan)]">{item.controlId}</span>
                    </td>
                    <td>
                      <span className="text-sm text-[var(--text-primary)] line-clamp-1">{item.weakness}</span>
                    </td>
                    <td>
                      <span className={`severity-badge ${getSeverityClass(item.severity)}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${item.status === 'completed' ? 'success' : item.status === 'ongoing' ? 'warning' : item.status === 'open' ? 'error' : 'info'}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-sm text-[var(--text-secondary)]">{item.assignedTo}</td>
                    <td className="text-sm text-[var(--text-muted)]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(item.scheduledCompletionDate)}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDetailsModal(true);
                        }}
                        className="text-[var(--accent-cyan)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)]">
            <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border-default)] px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">POA&M Item Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Control ID</label>
                  <p className="text-sm font-mono text-[var(--text-primary)]">{selectedItem.controlId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Severity</label>
                  <span className={`severity-badge ${getSeverityClass(selectedItem.severity)}`}>
                    {selectedItem.severity}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Weakness Description</label>
                <p className="text-sm text-[var(--text-secondary)]">{selectedItem.weakness}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Remediation Plan</label>
                <p className="text-sm text-[var(--text-secondary)]">{selectedItem.remediation}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Resources</label>
                  <p className="text-sm text-[var(--text-secondary)]">{selectedItem.resources}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Estimated Cost</label>
                  <p className="text-sm text-[var(--text-secondary)]">{selectedItem.estimatedCost}</p>
                </div>
              </div>

              {selectedItem.milestones.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Milestones</label>
                  <div className="space-y-2">
                    {selectedItem.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-start space-x-3 p-3 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                        <div className="flex-shrink-0 mt-1">
                          {milestone.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-[var(--status-success)]" />
                          ) : milestone.status === 'in_progress' ? (
                            <Clock className="h-5 w-5 text-[var(--status-warning)]" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-[var(--text-muted)]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{milestone.description}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            Scheduled: {formatDate(milestone.scheduledDate)}
                            {milestone.completedDate && (
                              <span className="text-[var(--status-success)] ml-4">
                                Completed: {formatDate(milestone.completedDate)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[var(--border-default)] flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="enterprise-btn enterprise-btn-primary"
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

export default function POAMPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-cyan)] mx-auto mb-4"></div>
          <p className="text-[var(--text-primary)]">Loading Cyber POA&M...</p>
        </div>
      </div>
    }>
      <POAMPageContent />
    </Suspense>
  );
}
