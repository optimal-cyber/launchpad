'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Download,
  RefreshCw,
  Eye,
  User,
  Calendar,
  AlertTriangle,
  CheckSquare,
  Edit3,
  MessageSquare
} from 'lucide-react';

interface Application {
  id: string;
  name: string;
  systemId: string;
  description: string;
  impactLevel: 'low' | 'moderate' | 'high';
  status: 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'conditional';
  submittedDate: string;
  reviewedDate?: string;
  expirationDate?: string;
  authorizedBy?: string;
  securityScore: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  poamItems: number;
  controlsImplemented: number;
  controlsTotal: number;
  documents: {
    ssp: boolean;
    poam: boolean;
    sar: boolean;
    contingencyPlan: boolean;
  };
  submittedBy: string;
  notes?: string;
}

export default function AuthorizationPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected' | 'conditional' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [aoSignature, setAOSignature] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applications, statusFilter, impactFilter]);

  const loadApplications = async () => {
    try {
      // Load from localStorage or use mock data
      const storedApps = localStorage.getItem('ato_applications');
      let mockData: Application[] = [];
      
      if (storedApps) {
        mockData = JSON.parse(storedApps);
      } else {
        // Default mock data
        mockData = [
          {
            id: '1',
            name: 'Flask Container Application',
            systemId: 'SYS-2025-001',
            description: 'Python Flask web application for customer portal',
            impactLevel: 'moderate',
            status: 'pending_review',
            submittedDate: '2025-10-15',
            securityScore: 87,
            vulnerabilities: {
              critical: 0,
              high: 3,
              medium: 12,
              low: 8
            },
            poamItems: 3,
            controlsImplemented: 285,
            controlsTotal: 325,
            documents: {
              ssp: true,
              poam: true,
              sar: true,
              contingencyPlan: true
            },
            submittedBy: 'John Doe - System Owner'
          },
          {
            id: '2',
            name: 'API Gateway Service',
            systemId: 'SYS-2025-002',
            description: 'RESTful API gateway for microservices architecture',
            impactLevel: 'high',
            status: 'under_review',
            submittedDate: '2025-10-10',
            securityScore: 92,
            vulnerabilities: {
              critical: 0,
              high: 1,
              medium: 5,
              low: 3
            },
            poamItems: 1,
            controlsImplemented: 310,
            controlsTotal: 325,
            documents: {
              ssp: true,
              poam: true,
              sar: true,
              contingencyPlan: true
            },
            submittedBy: 'Jane Smith - System Owner'
          },
          {
            id: '3',
            name: 'Database Cluster',
            systemId: 'SYS-2025-003',
            description: 'PostgreSQL database cluster for enterprise data',
            impactLevel: 'high',
            status: 'approved',
            submittedDate: '2025-09-20',
            reviewedDate: '2025-10-05',
            expirationDate: '2026-10-05',
            authorizedBy: 'Ryan Gutwein - Authorizing Official',
            securityScore: 95,
            vulnerabilities: {
              critical: 0,
              high: 0,
              medium: 2,
              low: 1
            },
            poamItems: 0,
            controlsImplemented: 320,
            controlsTotal: 325,
            documents: {
              ssp: true,
              poam: true,
              sar: true,
              contingencyPlan: true
            },
            submittedBy: 'Bob Johnson - System Owner',
            notes: 'All security controls verified and approved for 1-year ATO'
          }
        ];
        localStorage.setItem('ato_applications', JSON.stringify(mockData));
      }
      
      setApplications(mockData);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = applications;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (impactFilter !== 'all') {
      filtered = filtered.filter(app => app.impactLevel === impactFilter);
    }

    setFilteredApplications(filtered);
  };

  const handleReviewApplication = (app: Application) => {
    setSelectedApp(app);
    setReviewDecision(null);
    setReviewNotes('');
    setAOSignature('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (!selectedApp || !reviewDecision || !aoSignature) {
      alert('Please complete all required fields');
      return;
    }

    const updatedApps = applications.map(app => {
      if (app.id === selectedApp.id) {
        return {
          ...app,
          status: reviewDecision,
          reviewedDate: new Date().toISOString().split('T')[0],
          authorizedBy: aoSignature,
          notes: reviewNotes,
          expirationDate: reviewDecision === 'approved' 
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : undefined
        };
      }
      return app;
    });

    localStorage.setItem('ato_applications', JSON.stringify(updatedApps));
    setApplications(updatedApps);
    setShowReviewModal(false);
    setSelectedApp(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'under_review': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'approved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'conditional': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-600';
      case 'moderate': return 'bg-orange-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
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
    const total = applications.length;
    const pending = applications.filter(a => a.status === 'pending_review').length;
    const underReview = applications.filter(a => a.status === 'under_review').length;
    const approved = applications.filter(a => a.status === 'approved').length;
    const needsAttention = applications.filter(a => 
      a.vulnerabilities.critical > 0 || a.vulnerabilities.high > 5
    ).length;

    return { total, pending, underReview, approved, needsAttention };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground text-lg">Loading Authorization Requests...</p>
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
            <h1 className="text-2xl font-semibold text-foreground">Authorization & ATO Management</h1>
            <p className="text-sm text-muted-foreground">Review and approve applications for Authority to Operate</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadApplications}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-primary">{metrics.total}</div>
            <div className="apollo-metric-label">Total Applications</div>
          </div>
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-yellow-500">{metrics.pending}</div>
            <div className="apollo-metric-label">Pending Review</div>
          </div>
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-blue-500">{metrics.underReview}</div>
            <div className="apollo-metric-label">Under Review</div>
          </div>
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-green-500">{metrics.approved}</div>
            <div className="apollo-metric-label">Approved (ATO)</div>
          </div>
          <div className="apollo-metric-card">
            <div className="apollo-metric-value text-red-500">{metrics.needsAttention}</div>
            <div className="apollo-metric-label">Needs Attention</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="pending_review">Pending Review</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="conditional">Conditional</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Impact Level</label>
              <select
                value={impactFilter}
                onChange={(e) => setImpactFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Impact Levels</option>
                <option value="high">High</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                Showing {filteredApplications.length} of {applications.length} applications
              </div>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">
                ATO Applications ({filteredApplications.length})
              </h3>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
          
          {filteredApplications.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No applications found</h3>
              <p className="text-muted-foreground">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      System
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Impact Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Security Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Vulnerabilities
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Controls
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-foreground">{app.name}</div>
                          <div className="text-sm text-muted-foreground">{app.systemId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getImpactColor(app.impactLevel)}`}>
                          {app.impactLevel.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-foreground">{app.securityScore}%</div>
                          {app.securityScore >= 90 && <CheckCircle className="h-4 w-4 ml-2 text-green-500" />}
                          {app.securityScore < 80 && <AlertTriangle className="h-4 w-4 ml-2 text-yellow-500" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-xs">
                          {app.vulnerabilities.critical > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                              {app.vulnerabilities.critical} C
                            </span>
                          )}
                          {app.vulnerabilities.high > 0 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
                              {app.vulnerabilities.high} H
                            </span>
                          )}
                          {app.vulnerabilities.medium > 0 && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                              {app.vulnerabilities.medium} M
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground">
                          {app.controlsImplemented}/{app.controlsTotal}
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-primary h-1.5 rounded-full" 
                              style={{ width: `${(app.controlsImplemented / app.controlsTotal) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-foreground">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatDate(app.submittedDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleReviewApplication(app)}
                          className="inline-flex items-center px-3 py-1.5 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
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

      {/* Review Modal */}
      {showReviewModal && selectedApp && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setShowReviewModal(false)}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-lg shadow-2xl border border-border flex flex-col" 
            style={{ zIndex: 51 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0 bg-card">
              <h3 className="text-xl font-semibold text-foreground">Authorization Review - {selectedApp.name}</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto p-6 flex-1 bg-card">
              <div className="flex flex-col gap-6">
                {/* Application Details */}
                <div className="bg-muted rounded-lg p-4 border border-border block">
                  <h4 className="text-sm font-semibold text-foreground mb-3">System Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">System ID</p>
                      <p className="text-sm font-medium text-foreground">{selectedApp.systemId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Impact Level</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getImpactColor(selectedApp.impactLevel)}`}>
                        {selectedApp.impactLevel.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Submitted By</p>
                      <p className="text-sm font-medium text-foreground">{selectedApp.submittedBy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Submitted Date</p>
                      <p className="text-sm font-medium text-foreground">{formatDate(selectedApp.submittedDate)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-foreground">{selectedApp.description}</p>
                  </div>
                </div>

                {/* Security Posture */}
                <div className="bg-muted rounded-lg p-4 border border-border block">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Security Posture</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedApp.securityScore}%</div>
                      <p className="text-xs text-muted-foreground">Security Score</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {selectedApp.controlsImplemented}/{selectedApp.controlsTotal}
                      </div>
                      <p className="text-xs text-muted-foreground">Controls Implemented</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">{selectedApp.poamItems}</div>
                      <p className="text-xs text-muted-foreground">Open POA&M Items</p>
                    </div>
                  </div>
                </div>

                {/* Vulnerabilities */}
                <div className="bg-muted rounded-lg p-4 border border-border block">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Vulnerability Summary</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                      <div className="text-xl font-bold text-red-600">{selectedApp.vulnerabilities.critical}</div>
                      <p className="text-xs text-red-600">Critical</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                      <div className="text-xl font-bold text-orange-600">{selectedApp.vulnerabilities.high}</div>
                      <p className="text-xs text-orange-600">High</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                      <div className="text-xl font-bold text-yellow-600">{selectedApp.vulnerabilities.medium}</div>
                      <p className="text-xs text-yellow-600">Medium</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <div className="text-xl font-bold text-blue-600">{selectedApp.vulnerabilities.low}</div>
                      <p className="text-xs text-blue-600">Low</p>
                    </div>
                  </div>
                </div>

                {/* Required Documents */}
                <div className="bg-muted rounded-lg p-4 border border-border block">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Required Documentation</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      {selectedApp.documents.ssp ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-sm text-foreground">System Security Plan (SSP)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {selectedApp.documents.poam ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-sm text-foreground">Plan of Action & Milestones</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {selectedApp.documents.sar ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-sm text-foreground">Security Assessment Report</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {selectedApp.documents.contingencyPlan ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-sm text-foreground">Contingency Plan</span>
                    </div>
                  </div>
                </div>

                {/* Authorization Decision */}
                <div className="border-t border-border pt-6 block">
                  <h4 className="text-sm font-medium text-foreground mb-4">Authorization Decision</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Decision *</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setReviewDecision('approved')}
                          className={`p-3 rounded-lg border-2 ${
                            reviewDecision === 'approved'
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-border hover:border-green-300'
                          }`}
                        >
                          <CheckCircle className={`h-6 w-6 mx-auto mb-1 ${reviewDecision === 'approved' ? 'text-green-600' : 'text-muted-foreground'}`} />
                          <p className="text-sm font-medium text-foreground">Approve</p>
                          <p className="text-xs text-muted-foreground">Grant ATO</p>
                        </button>
                        <button
                          onClick={() => setReviewDecision('conditional')}
                          className={`p-3 rounded-lg border-2 ${
                            reviewDecision === 'conditional'
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                              : 'border-border hover:border-orange-300'
                          }`}
                        >
                          <AlertCircle className={`h-6 w-6 mx-auto mb-1 ${reviewDecision === 'conditional' ? 'text-orange-600' : 'text-muted-foreground'}`} />
                          <p className="text-sm font-medium text-foreground">Conditional</p>
                          <p className="text-xs text-muted-foreground">With conditions</p>
                        </button>
                        <button
                          onClick={() => setReviewDecision('rejected')}
                          className={`p-3 rounded-lg border-2 ${
                            reviewDecision === 'rejected'
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : 'border-border hover:border-red-300'
                          }`}
                        >
                          <XCircle className={`h-6 w-6 mx-auto mb-1 ${reviewDecision === 'rejected' ? 'text-red-600' : 'text-muted-foreground'}`} />
                          <p className="text-sm font-medium text-foreground">Reject</p>
                          <p className="text-xs text-muted-foreground">Deny ATO</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Review Notes {reviewDecision === 'conditional' && '*'}
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={4}
                        placeholder="Enter authorization decision notes, conditions, or reasons..."
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Authorizing Official Signature *
                      </label>
                      <input
                        type="text"
                        value={aoSignature}
                        onChange={(e) => setAOSignature(e.target.value)}
                        placeholder="Enter your full name to sign"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        By signing, you certify that you have reviewed all documentation and authorize this decision.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-border text-foreground bg-background rounded-md hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={!reviewDecision || !aoSignature}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Authorization Decision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

