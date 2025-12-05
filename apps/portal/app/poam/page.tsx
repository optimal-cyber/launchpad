'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Calendar,
  User,
  FileText,
  TrendingUp,
  Shield
} from 'lucide-react';

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

function POAMPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('items');
  const [poamItems, setPOAMItems] = useState<POAMItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<POAMItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<POAMItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPOAMData, setNewPOAMData] = useState<any>(null);

  useEffect(() => {
    loadPOAMData();
    
    // Check if we're creating from vulnerabilities
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

  useEffect(() => {
    applyFilters();
  }, [poamItems, searchTerm, statusFilter, severityFilter]);

  const loadPOAMData = async () => {
    try {
      // Load from localStorage or use mock data
      const storedItems = localStorage.getItem('poam_items');
      let mockData: POAMItem[] = [];
      
      if (storedItems) {
        mockData = JSON.parse(storedItems);
      } else {
        // Default mock data
        mockData = [
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
              {
                id: 'm1',
                description: 'Implement automated account review system',
                scheduledDate: '2025-10-01',
                status: 'completed',
                completedDate: '2025-09-28'
              },
              {
                id: 'm2',
                description: 'Train security team on new procedures',
                scheduledDate: '2025-10-15',
                status: 'in_progress'
              }
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
          {
            id: '3',
            controlId: 'IA-5',
            weakness: 'Authenticator Management - Weak password requirements',
            severity: 'critical',
            status: 'ongoing',
            scheduledCompletionDate: '2025-10-30',
            submittedDate: '2025-08-20',
            assignedTo: 'Bob Johnson',
            milestones: [
              {
                id: 'm3',
                description: 'Update password policy',
                scheduledDate: '2025-09-15',
                status: 'completed',
                completedDate: '2025-09-14'
              },
              {
                id: 'm4',
                description: 'Implement MFA for all users',
                scheduledDate: '2025-10-30',
                status: 'in_progress'
              }
            ],
            comments: [],
            remediation: 'Enforce strong password requirements and implement multi-factor authentication',
            resources: '1 FTE, MFA Solution',
            estimatedCost: '$30,000'
          }
        ];
        // Save default data
        localStorage.setItem('poam_items', JSON.stringify(mockData));
      }
      
      setPOAMItems(mockData);
    } catch (error) {
      console.error('Error loading POA&M data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = poamItems;

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.controlId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.weakness.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(item => item.severity === severityFilter);
    }

    setFilteredItems(filtered);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'risk_accepted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateMetrics = () => {
    const total = poamItems.length;
    const open = poamItems.filter(i => i.status === 'open').length;
    const ongoing = poamItems.filter(i => i.status === 'ongoing').length;
    const completed = poamItems.filter(i => i.status === 'completed').length;
    const overdue = poamItems.filter(i => 
      i.status !== 'completed' && new Date(i.scheduledCompletionDate) < new Date()
    ).length;

    return { total, open, ongoing, completed, overdue };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground text-lg">Loading POA&M...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="apollo-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Cyber POA&M</h1>
            <p className="text-sm text-muted-foreground">Plan of Action and Milestones Management</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadPOAMData}
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
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-primary">{metrics.total}</div>
            <div className="apollo-metric-label">Total Items</div>
          </div>
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-red-500">{metrics.open}</div>
            <div className="apollo-metric-label">Open</div>
          </div>
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-yellow-500">{metrics.ongoing}</div>
            <div className="apollo-metric-label">Ongoing</div>
          </div>
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-green-500">{metrics.completed}</div>
            <div className="apollo-metric-label">Completed</div>
          </div>
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-orange-500">{metrics.overdue}</div>
            <div className="apollo-metric-label">Overdue</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Search</label>
              <input
                type="text"
                placeholder="Search POA&M items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="risk_accepted">Risk Accepted</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                Showing {filteredItems.length} of {poamItems.length} items
              </div>
            </div>
          </div>
        </div>

        {/* POA&M Items Table */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">
                POA&M Items ({filteredItems.length})
              </h3>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
          
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No POA&M items found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Control ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Weakness
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {item.controlId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground max-w-xs">{item.weakness}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getSeverityColor(item.severity)}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{item.assignedTo}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-foreground">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatDate(item.scheduledCompletionDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => {
                            setSelectedItem(item);
                            setShowDetailsModal(true);
                          }}
                          className="text-primary hover:text-primary/80 text-sm font-medium"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative w-11/12 md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-y-auto bg-card rounded-lg shadow-xl border border-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">POA&M Item Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Control ID</label>
                    <p className="text-sm text-foreground font-mono">{selectedItem.controlId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Severity</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getSeverityColor(selectedItem.severity)}`}>
                      {selectedItem.severity}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Weakness Description</label>
                  <p className="text-sm text-foreground">{selectedItem.weakness}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Remediation Plan</label>
                  <p className="text-sm text-foreground">{selectedItem.remediation}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Resources Required</label>
                    <p className="text-sm text-foreground">{selectedItem.resources}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Estimated Cost</label>
                    <p className="text-sm text-foreground">{selectedItem.estimatedCost}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Assigned To</label>
                    <p className="text-sm text-foreground">{selectedItem.assignedTo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedItem.status)}`}>
                      {selectedItem.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Submitted Date</label>
                    <p className="text-sm text-foreground">{formatDate(selectedItem.submittedDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Scheduled Completion</label>
                    <p className="text-sm text-foreground">{formatDate(selectedItem.scheduledCompletionDate)}</p>
                  </div>
                </div>

                {selectedItem.milestones.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Milestones</label>
                    <div className="space-y-2">
                      {selectedItem.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            {milestone.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : milestone.status === 'in_progress' ? (
                              <Clock className="h-5 w-5 text-yellow-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{milestone.description}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <p className="text-xs text-muted-foreground">
                                Scheduled: {formatDate(milestone.scheduledDate)}
                              </p>
                              {milestone.completedDate && (
                                <p className="text-xs text-green-600">
                                  Completed: {formatDate(milestone.completedDate)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create POA&M Modal */}
      {showCreateModal && newPOAMData && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative w-11/12 md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-y-auto bg-card rounded-lg shadow-xl border border-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Create POA&M from Vulnerabilities</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Creating POA&M items for {newPOAMData.vulnerabilities?.length} vulnerabilities
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-3">Selected Vulnerabilities:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {newPOAMData.vulnerabilities?.map((vuln: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-background rounded border border-border">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{vuln.title}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs text-muted-foreground">{vuln.cve}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${
                              vuln.severity === 'critical' ? 'bg-red-600' :
                              vuln.severity === 'high' ? 'bg-orange-600' :
                              vuln.severity === 'medium' ? 'bg-yellow-600' :
                              'bg-blue-600'
                            }`}>
                              {vuln.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                        POA&M Items Will Be Created
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Each vulnerability will be converted into a POA&M item with:
                      </p>
                      <ul className="mt-2 text-sm text-green-700 dark:text-green-300 list-disc list-inside space-y-1">
                        <li>Control ID mapped from vulnerability type</li>
                        <li>Severity level preserved</li>
                        <li>Scheduled completion date (90 days from now)</li>
                        <li>Status set to "open"</li>
                        <li>Remediation plan based on vulnerability details</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border text-foreground bg-background rounded-md hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Create POA&M items from vulnerabilities
                    const existingItems = JSON.parse(localStorage.getItem('poam_items') || '[]');
                    const newItems: POAMItem[] = newPOAMData.vulnerabilities.map((vuln: any, idx: number) => {
                      const newId = String(existingItems.length + idx + 1);
                      const scheduledDate = new Date();
                      scheduledDate.setDate(scheduledDate.getDate() + 90); // 90 days from now
                      
                      return {
                        id: newId,
                        controlId: vuln.severity === 'critical' ? 'IA-5' : 
                                   vuln.severity === 'high' ? 'SC-7' : 
                                   vuln.severity === 'medium' ? 'AU-6' : 'AC-2',
                        weakness: `${vuln.title} - ${vuln.package}`,
                        severity: vuln.severity,
                        status: 'open',
                        scheduledCompletionDate: scheduledDate.toISOString().split('T')[0],
                        submittedDate: new Date().toISOString().split('T')[0],
                        assignedTo: 'Security Team',
                        milestones: [
                          {
                            id: `m${newId}-1`,
                            description: 'Assess vulnerability impact',
                            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            status: 'pending'
                          },
                          {
                            id: `m${newId}-2`,
                            description: 'Apply security patch or workaround',
                            scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            status: 'pending'
                          },
                          {
                            id: `m${newId}-3`,
                            description: 'Verify fix and conduct testing',
                            scheduledDate: scheduledDate.toISOString().split('T')[0],
                            status: 'pending'
                          }
                        ],
                        comments: [],
                        remediation: `Address vulnerability ${vuln.cve} in ${vuln.package} ${vuln.version}. ${vuln.remediation || 'Update to the latest secure version.'}`,
                        resources: 'Security Team, Development Team',
                        estimatedCost: vuln.severity === 'critical' ? '$20,000' : 
                                      vuln.severity === 'high' ? '$15,000' : 
                                      vuln.severity === 'medium' ? '$10,000' : '$5,000'
                      };
                    });
                    
                    // Merge with existing items
                    const allItems = [...existingItems, ...newItems];
                    localStorage.setItem('poam_items', JSON.stringify(allItems));
                    
                    // Show success and reload
                    alert(`Successfully created ${newItems.length} POA&M item(s)!`);
                    setShowCreateModal(false);
                    loadPOAMData();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create POA&M Items
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground text-lg">Loading POA&M...</p>
        </div>
      </div>
    }>
      <POAMPageContent />
    </Suspense>
  );
}

