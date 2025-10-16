'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  Tag,
  Settings,
  Plus,
  Save,
  X,
  Bell,
  FileText,
  Shield,
  Activity
} from 'lucide-react';

interface Vulnerability {
  id: string;
  cve: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss_score: number;
  description: string;
  package: string;
  version: string;
  status: 'open' | 'in_progress' | 'resolved' | 'suppressed';
  created_at: string;
  updated_at: string;
  remediation: string;
  references: string[];
  assignee?: string;
  priority?: string;
  tags?: string[];
  comments?: Comment[];
  workflow_state?: string;
  false_positive?: boolean;
  suppressed?: boolean;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  created_at: string;
}

interface Monitor {
  id: string;
  name: string;
  description: string;
  severity_threshold: string;
  enabled: boolean;
  alert_channels: string[];
  created_at: string;
  last_triggered: string;
  trigger_count: number;
}

interface Event {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  timestamp: string;
  vulnerability_id: string;
  user: string;
}

interface Suppression {
  id: string;
  vulnerability_id: string;
  cve: string;
  reason: string;
  suppressed_by: string;
  suppressed_at: string;
  expires_at: string;
  status: string;
}

interface InvalidInstall {
  id: string;
  package: string;
  version: string;
  reason: string;
  detected_at: string;
  status: string;
}

interface RemediationPlan {
  id: string;
  name: string;
  description: string;
  vulnerabilities: string[];
  priority: string;
  status: string;
  created_at: string;
  target_completion: string;
  progress: number;
}

export default function VulnerabilitiesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('installs');
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [suppressions, setSuppressions] = useState<Suppression[]>([]);
  const [invalidInstalls, setInvalidInstalls] = useState<InvalidInstall[]>([]);
  const [plans, setPlans] = useState<RemediationPlan[]>([]);
  const [filteredVulnerabilities, setFilteredVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVuln, setEditingVuln] = useState<Vulnerability | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [newComment, setNewComment] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const projectInfo = {
    id: '65646370',
    name: 'flask-container-test',
    path: 'r.gutwein/flask-container-test',
    last_scan: {
      total_scans: 3,
      vulnerabilities_count: 56,
      secrets_count: 0,
      timestamp: '2025-08-18T15:46:56'
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vulnerabilities, searchTerm, statusFilter, severityFilter]);

  const loadData = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      
      // Load vulnerabilities
      const vulnResponse = await fetch(`${apiBase}/api/vulns`);
      const vulnData = await vulnResponse.json();
      setVulnerabilities(vulnData.vulnerabilities || []);

      // Load monitors
      const monitorResponse = await fetch(`${apiBase}/api/vulns/monitors`);
      const monitorData = await monitorResponse.json();
      setMonitors(monitorData.monitors || []);

      // Load events
      const eventResponse = await fetch(`${apiBase}/api/vulns/events`);
      const eventData = await eventResponse.json();
      setEvents(eventData.events || []);

      // Load suppressions
      const suppResponse = await fetch(`${apiBase}/api/vulns/suppressions`);
      const suppData = await suppResponse.json();
      setSuppressions(suppData.suppressions || []);

      // Load invalid installs
      const invalidResponse = await fetch(`${apiBase}/api/vulns/invalid-installs`);
      const invalidData = await invalidResponse.json();
      setInvalidInstalls(invalidData.invalid_installs || []);

      // Load plans
      const planResponse = await fetch(`${apiBase}/api/vulns/plans`);
      const planData = await planResponse.json();
      setPlans(planData.plans || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = vulnerabilities;

    if (searchTerm) {
      filtered = filtered.filter(vuln => 
        vuln.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.cve.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.package.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(vuln => vuln.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(vuln => vuln.severity.toLowerCase() === severityFilter.toLowerCase());
    }

    setFilteredVulnerabilities(filtered);
  };

  const handleEditVulnerability = (vuln: Vulnerability) => {
    setEditingVuln({ ...vuln });
    setShowEditModal(true);
  };

  const handleSaveVulnerability = async () => {
    if (!editingVuln) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/api/vulns/${editingVuln.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingVuln),
      });

      if (response.ok) {
        setVulnerabilities(prev => 
          prev.map(v => v.id === editingVuln.id ? editingVuln : v)
        );
        setShowEditModal(false);
        setEditingVuln(null);
      }
    } catch (error) {
      console.error('Error saving vulnerability:', error);
    }
  };

  const handleAddComment = async () => {
    if (!selectedVuln || !newComment.trim()) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/api/vulns/${selectedVuln.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          author: 'user@company.com'
        }),
      });

      if (response.ok) {
        setNewComment('');
        setShowCommentModal(false);
        setSelectedVuln(null);
        loadData(); // Reload to get updated comments
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleAssignVulnerability = async (vulnId: string, assignee: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/api/vulns/${vulnId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignee }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error assigning vulnerability:', error);
    }
  };

  const handleSuppressVulnerability = async (vulnId: string, reason: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/api/vulns/${vulnId}/suppress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reason,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
        }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error suppressing vulnerability:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getUniqueStatuses = () => {
    const statuses = Array.from(new Set(vulnerabilities.map(v => v.status)));
    return statuses;
  };

  const getUniqueSeverities = () => {
    const severities = Array.from(new Set(vulnerabilities.map(v => v.severity)));
    return severities;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'installs':
        return renderVulnerabilitiesTable();
      case 'events':
        return renderEventsTable();
      case 'suppressions':
        return renderSuppressionsTable();
      case 'invalid-installs':
        return renderInvalidInstallsTable();
      case 'monitors':
        return renderMonitorsTable();
      case 'plans':
        return renderPlansTable();
      default:
        return renderVulnerabilitiesTable();
    }
  };

  const renderVulnerabilitiesTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Vulnerabilities ({filteredVulnerabilities.length})
          </h3>
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
      
      {filteredVulnerabilities.length === 0 ? (
        <div className="p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vulnerabilities found</h3>
          <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vulnerability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CVE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVulnerabilities.map((vuln) => (
                <tr key={vuln.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{vuln.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{vuln.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {vuln.cve}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getSeverityColor(vuln.severity)}`}>
                      {vuln.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{vuln.package}</div>
                    <div className="text-sm text-gray-500">{vuln.version}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {vuln.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditVulnerability(vuln)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedVuln(vuln);
                          setShowCommentModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 text-sm font-medium cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleAssignVulnerability(vuln.id, 'john.doe@company.com')}
                        className="text-purple-600 hover:text-purple-900 text-sm font-medium cursor-pointer"
                      >
                        <User className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderEventsTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Events ({events.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{event.title}</div>
                  <div className="text-sm text-gray-500">{event.description}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {event.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getSeverityColor(event.severity)}`}>
                    {event.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{event.user}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(event.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSuppressionsTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Suppressions ({suppressions.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CVE</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suppressed By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppressions.map((supp) => (
              <tr key={supp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{supp.cve}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{supp.reason}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{supp.suppressed_by}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(supp.expires_at)}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {supp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInvalidInstallsTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Invalid Installs ({invalidInstalls.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detected</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invalidInstalls.map((install) => (
              <tr key={install.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{install.package}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{install.version}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{install.reason}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(install.detected_at)}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {install.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMonitorsTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Monitors ({monitors.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channels</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Triggers</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {monitors.map((monitor) => (
              <tr key={monitor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{monitor.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{monitor.description}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getSeverityColor(monitor.severity_threshold)}`}>
                    {monitor.severity_threshold}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{monitor.alert_channels.join(', ')}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{monitor.trigger_count}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${monitor.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {monitor.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPlansTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Remediation Plans ({plans.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Completion</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{plan.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{plan.description}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getSeverityColor(plan.priority)}`}>
                    {plan.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${plan.progress}%` }}></div>
                    </div>
                    <span className="text-sm text-gray-500">{plan.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(plan.target_completion)}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {plan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Apollo-style Header */}
      <div className="apollo-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Vulnerability Management</h1>
            <p className="text-sm text-muted-foreground">Track and manage security vulnerabilities</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Apollo-style Tabs */}
        <div className="apollo-tabs mb-6">
          <button 
            className={`apollo-tab ${activeTab === 'installs' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('installs')}
          >
            Installs
          </button>
          <button 
            className={`apollo-tab ${activeTab === 'events' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button 
            className={`apollo-tab ${activeTab === 'suppressions' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('suppressions')}
          >
            Suppressions
          </button>
          <button 
            className={`apollo-tab ${activeTab === 'invalid-installs' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('invalid-installs')}
          >
            Invalid installs
          </button>
          <button 
            className={`apollo-tab ${activeTab === 'monitors' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('monitors')}
          >
            Monitors <span className="apollo-badge apollo-badge-error ml-1">{monitors.length}</span>
          </button>
          <button 
            className={`apollo-tab ${activeTab === 'plans' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            Plans
          </button>
        </div>

        {/* Scan Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-primary">{projectInfo.last_scan.total_scans}</div>
            <div className="apollo-metric-label">Total Scans</div>
          </div>
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-red-500">{projectInfo.last_scan.vulnerabilities_count}</div>
            <div className="apollo-metric-label">Vulnerabilities</div>
          </div>
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-yellow-500">{projectInfo.last_scan.secrets_count}</div>
            <div className="apollo-metric-label">Secrets Found</div>
          </div>
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-green-500">{formatDate(projectInfo.last_scan.timestamp)}</div>
            <div className="apollo-metric-label">Last Scan</div>
          </div>
        </div>

        {/* Project Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{projectInfo.name}</h3>
              <p className="text-sm text-gray-600">{projectInfo.path}</p>
            </div>
            <Link
              href={`https://gitlab.com/${projectInfo.path}`}
              target="_blank"
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View in GitLab
            </Link>
          </div>
        </div>

        {/* Filters and Search - Only show for installs tab */}
        {activeTab === 'installs' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search vulnerabilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  {getUniqueStatuses().map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              {/* Severity Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Severities</option>
                  {getUniqueSeverities().map(severity => (
                    <option key={severity} value={severity}>{severity}</option>
                  ))}
                </select>
              </div>
              
              {/* Results Count */}
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  Showing {filteredVulnerabilities.length} of {vulnerabilities.length} vulnerabilities
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {/* Edit Vulnerability Modal */}
      {showEditModal && editingVuln && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Vulnerability</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={editingVuln.title}
                    onChange={(e) => setEditingVuln({...editingVuln, title: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editingVuln.status}
                    onChange={(e) => setEditingVuln({...editingVuln, status: e.target.value as any})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="suppressed">Suppressed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Severity</label>
                  <select
                    value={editingVuln.severity}
                    onChange={(e) => setEditingVuln({...editingVuln, severity: e.target.value as any})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={editingVuln.description}
                    onChange={(e) => setEditingVuln({...editingVuln, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleSaveVulnerability}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {showCommentModal && selectedVuln && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Comment</h3>
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">Vulnerability: {selectedVuln.title}</p>
                <p className="text-sm text-gray-500">CVE: {selectedVuln.cve}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  placeholder="Add your comment here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </button>
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}