'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Clock,
  GitBranch, Package, FileText, Award, Lock, Zap,
  ExternalLink, ChevronRight, Activity, BarChart3, Upload, Download,
  UserCheck, Users, Briefcase, ClipboardCheck, Send, MessageSquare
} from 'lucide-react';

interface PipelineStage {
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'running';
  jobs: {
    name: string;
    status: 'passed' | 'failed' | 'warning';
    duration: string;
    findings?: number;
  }[];
}

interface AuthorizationEvidence {
  id: string;
  component: string;
  project: string;
  pipeline_id: string;
  commit: string;
  status: 'authorized' | 'pending' | 'rejected';
  compliance_score: number;
  timestamp: string;
  stages: PipelineStage[];
  artifacts: {
    sbom: boolean;
    vulnerabilities: boolean;
    secrets: boolean;
    compliance: boolean;
    scorecard: boolean;
  };
}

interface ScorecardResult {
  date: string;
  checks: {
    name: string;
    score: number;
    reason: string;
  }[];
  score: number;
  metadata?: Record<string, any>;
}

interface Approval {
  role: 'AO' | 'ISSO' | 'SCA' | 'ISSM';
  roleName: string;
  status: 'pending' | 'approved' | 'rejected' | 'not_required';
  approver?: string;
  timestamp?: string;
  comments?: string;
}

interface AuthorizationPackage {
  id: string;
  systemName: string;
  component: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  submittedDate: string;
  targetDate: string;
  riskLevel: 'low' | 'moderate' | 'high';
  approvals: Approval[];
  evidenceIds: string[];
}

export default function AuthorizationPage() {
  const [evidence, setEvidence] = useState<AuthorizationEvidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<AuthorizationEvidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [scorecardResults, setScorecardResults] = useState<Record<string, ScorecardResult>>({});
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [showEmassModal, setShowEmassModal] = useState(false);
  const [emassSystemId, setEmassSystemId] = useState<string>('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<AuthorizationPackage | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<'AO' | 'ISSO' | 'SCA' | 'ISSM'>('ISSO');
  const [authPackages, setAuthPackages] = useState<AuthorizationPackage[]>([
    {
      id: 'pkg-001',
      systemName: 'Optimal Platform',
      component: 'flask-container-test',
      status: 'in_review',
      submittedDate: '2025-12-10',
      targetDate: '2025-12-20',
      riskLevel: 'moderate',
      approvals: [
        { role: 'SCA', roleName: 'Security Control Assessor', status: 'approved', approver: 'Sarah Chen', timestamp: '2025-12-11T14:30:00Z', comments: 'Security controls validated' },
        { role: 'ISSO', roleName: 'Information System Security Officer', status: 'pending' },
        { role: 'ISSM', roleName: 'Information System Security Manager', status: 'pending' },
        { role: 'AO', roleName: 'Authorizing Official', status: 'pending' }
      ],
      evidenceIds: ['2202794428']
    },
    {
      id: 'pkg-002',
      systemName: 'Optimal Platform',
      component: 'api-gateway',
      status: 'draft',
      submittedDate: '2025-12-12',
      targetDate: '2025-12-25',
      riskLevel: 'high',
      approvals: [
        { role: 'SCA', roleName: 'Security Control Assessor', status: 'pending' },
        { role: 'ISSO', roleName: 'Information System Security Officer', status: 'pending' },
        { role: 'ISSM', roleName: 'Information System Security Manager', status: 'pending' },
        { role: 'AO', roleName: 'Authorizing Official', status: 'pending' }
      ],
      evidenceIds: []
    },
    {
      id: 'pkg-003',
      systemName: 'Optimal Platform',
      component: 'portal-frontend',
      status: 'approved',
      submittedDate: '2025-11-01',
      targetDate: '2025-11-15',
      riskLevel: 'low',
      approvals: [
        { role: 'SCA', roleName: 'Security Control Assessor', status: 'approved', approver: 'Sarah Chen', timestamp: '2025-11-05T10:00:00Z' },
        { role: 'ISSO', roleName: 'Information System Security Officer', status: 'approved', approver: 'Michael Torres', timestamp: '2025-11-08T11:30:00Z' },
        { role: 'ISSM', roleName: 'Information System Security Manager', status: 'approved', approver: 'Emily Davis', timestamp: '2025-11-10T09:15:00Z' },
        { role: 'AO', roleName: 'Authorizing Official', status: 'approved', approver: 'Director James Wilson', timestamp: '2025-11-12T16:00:00Z', comments: 'Authorized for production deployment' }
      ],
      evidenceIds: ['1989745898']
    }
  ]);

  useEffect(() => {
    loadAuthorizationEvidence();
  }, []);

  const loadScorecardResults = async (projectId: string, jobId: string, pipelineId: string) => {
    try {
      const response = await fetch(`/api/gitlab/scorecard?project_id=${projectId}&job_id=${jobId}&pipeline_id=${pipelineId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setScorecardResults(prev => ({
            ...prev,
            [pipelineId]: data.data,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading scorecard:', error);
    }
  };

  const syncToEmass = async (evidence: AuthorizationEvidence) => {
    try {
      // Create POA&Ms from vulnerabilities
      const response = await fetch(`/api/emass/systems/${emassSystemId}/poams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controlAcronym: 'SC-7',
          weaknessName: `Security findings from ${evidence.component}`,
          weaknessDescription: `Pipeline ${evidence.pipeline_id} found ${evidence.compliance_score}% compliance`,
          severity: evidence.compliance_score < 80 ? 'high' : 'medium',
          remediation: 'Review and address security findings',
          scheduledCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'open',
        }),
      });

      if (response.ok) {
        alert('Successfully synced to eMASS!');
        setShowEmassModal(false);
      } else {
        throw new Error('Failed to sync to eMASS');
      }
    } catch (error) {
      console.error('Error syncing to eMASS:', error);
      alert('Failed to sync to eMASS. Please check configuration.');
    }
  };

  const loadAuthorizationEvidence = async () => {
    try {
      // Try to fetch real data from API
      const response = await fetch('/api/authorization/evidence');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setEvidence(data);
          setSelectedEvidence(data[0]);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.log('Using demo data from flask-container-test');
    }

    // Real data from flask-container-test pipeline #2202794428
    const realEvidence: AuthorizationEvidence[] = [
      {
        id: '2202794428',
        component: 'flask-container-test',
        project: 'r.gutwein/flask-container-test',
        pipeline_id: '2202794428',
        commit: 'd6a08cf1',
        status: 'authorized',
        compliance_score: 92,
        timestamp: '31 minutes ago',
        stages: [
          {
            name: 'build',
            status: 'passed',
            jobs: [
              { name: 'build', status: 'passed', duration: '9.87s' }
            ]
          },
          {
            name: 'test',
            status: 'passed',
            jobs: [
              { name: 'container_scanning', status: 'passed', duration: '182.13s', findings: 0 },
              { name: 'secret_detection', status: 'passed', duration: '6.45s', findings: 0 },
              { name: 'semgrep-sast', status: 'passed', duration: '13.95s', findings: 4 }
            ]
          },
          {
            name: 'sbom',
            status: 'passed',
            jobs: [
              { name: 'sbom_syft', status: 'passed', duration: '247.84s' }
            ]
          },
          {
            name: 'compliance',
            status: 'passed',
            jobs: [
              { name: 'compliance_trivy', status: 'passed', duration: '14.10s', findings: 2 }
            ]
          },
          {
            name: 'scorecard',
            status: 'warning',
            jobs: [
              { name: 'scorecard', status: 'warning', duration: '4.65s' }
            ]
          }
        ],
        artifacts: {
          sbom: true,
          vulnerabilities: true,
          secrets: true,
          compliance: true,
          scorecard: true
        }
      },
      // Previous pipeline for comparison
      {
        id: '1989745898',
        component: 'flask-container-test',
        project: 'r.gutwein/flask-container-test',
        pipeline_id: '1989745898',
        commit: '2f54fe0f',
        status: 'authorized',
        compliance_score: 94,
        timestamp: '3 months ago',
        stages: [
          {
            name: 'build',
            status: 'passed',
            jobs: [
              { name: 'build', status: 'passed', duration: '08:02' }
            ]
          },
          {
            name: 'test',
            status: 'passed',
            jobs: [
              { name: 'container_scanning', status: 'passed', duration: '08:12', findings: 0 },
              { name: 'secret_detection', status: 'passed', duration: '08:01', findings: 0 },
              { name: 'semgrep-sast', status: 'passed', duration: '08:00', findings: 2 }
            ]
          },
          {
            name: 'sbom',
            status: 'passed',
            jobs: [
              { name: 'sbom_syft', status: 'passed', duration: '08:00' }
            ]
          },
          {
            name: 'compliance',
            status: 'warning',
            jobs: [
              { name: 'compliance_trivy', status: 'warning', duration: '08:01', findings: 3 }
            ]
          },
          {
            name: 'scorecard',
            status: 'warning',
            jobs: [
              { name: 'scorecard', status: 'warning', duration: '08:00' }
            ]
          }
        ],
        artifacts: {
          sbom: true,
          vulnerabilities: true,
          secrets: true,
          compliance: true,
          scorecard: true
        }
      }
    ];

    setEvidence(realEvidence);
    setSelectedEvidence(realEvidence[0]);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'authorized':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'failed':
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
      case 'pending':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-400 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
      case 'authorized':
        return 'text-green-400';
      case 'failed':
      case 'rejected':
        return 'text-red-400';
      case 'warning':
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleApproval = (packageId: string, action: 'approve' | 'reject') => {
    setAuthPackages(prev => prev.map(pkg => {
      if (pkg.id !== packageId) return pkg;

      const updatedApprovals = pkg.approvals.map(approval => {
        if (approval.role !== currentUserRole) return approval;
        return {
          ...approval,
          status: action === 'approve' ? 'approved' as const : 'rejected' as const,
          approver: `Current User (${currentUserRole})`,
          timestamp: new Date().toISOString(),
          comments: approvalComment || undefined
        };
      });

      // Check if all approvals are complete
      const allApproved = updatedApprovals.every(a => a.status === 'approved' || a.status === 'not_required');
      const anyRejected = updatedApprovals.some(a => a.status === 'rejected');

      return {
        ...pkg,
        approvals: updatedApprovals,
        status: anyRejected ? 'rejected' : allApproved ? 'approved' : pkg.status
      };
    }));

    setShowApprovalModal(false);
    setApprovalComment('');
  };

  const canUserApprove = (pkg: AuthorizationPackage): boolean => {
    const userApproval = pkg.approvals.find(a => a.role === currentUserRole);
    if (!userApproval || userApproval.status !== 'pending') return false;

    // Check if previous approvals in chain are complete
    const roleOrder: ('SCA' | 'ISSO' | 'ISSM' | 'AO')[] = ['SCA', 'ISSO', 'ISSM', 'AO'];
    const currentIndex = roleOrder.indexOf(currentUserRole);

    for (let i = 0; i < currentIndex; i++) {
      const prevApproval = pkg.approvals.find(a => a.role === roleOrder[i]);
      if (prevApproval && prevApproval.status !== 'approved' && prevApproval.status !== 'not_required') {
        return false;
      }
    }

    return true;
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getApprovalIcon = (role: string) => {
    switch (role) {
      case 'SCA': return ClipboardCheck;
      case 'ISSO': return Shield;
      case 'ISSM': return Users;
      case 'AO': return Briefcase;
      default: return UserCheck;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading authorization evidence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] bg-gradient-to-r from-[var(--bg-void)] to-[var(--bg-base)]">
        <div className="px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="h-8 w-8 text-[var(--accent-cyan)]" />
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Authorization Pipeline</h1>
              </div>
              <p className="text-[var(--text-secondary)] text-lg">
                Continuous authorization through automated security and compliance validation
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-[var(--text-secondary)]">Live Monitoring</span>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <div className="metric-label">Authorized Components</div>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="metric-value text-green-400">12</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">All requirements met</div>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <div className="metric-label">Compliance Score</div>
                <BarChart3 className="h-5 w-5 text-[var(--accent-cyan)]" />
              </div>
              <div className="metric-value">94%</div>
              <div className="text-xs text-green-400 mt-1">+3% this week</div>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <div className="metric-label">Active Pipelines</div>
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div className="metric-value text-blue-400">3</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Running validations</div>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <div className="metric-label">Evidence Artifacts</div>
                <Award className="h-5 w-5 text-purple-400" />
              </div>
              <div className="metric-value text-purple-400">47</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Generated today</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-7xl mx-auto">
        {/* Authorization Process Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Authorization Process</h2>
          <div className="enterprise-card p-6">
            <div className="flex items-center justify-between">
              {[
                { label: 'Build', icon: Package, status: 'passed' },
                { label: 'Security Scan', icon: Shield, status: 'passed' },
                { label: 'SBOM Generation', icon: FileText, status: 'passed' },
                { label: 'Compliance Check', icon: Lock, status: 'warning' },
                { label: 'Authorization', icon: Award, status: 'passed' }
              ].map((step, idx, arr) => (
                <div key={idx} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      step.status === 'passed' ? 'bg-green-500/20 border-2 border-green-500' :
                      step.status === 'warning' ? 'bg-yellow-500/20 border-2 border-yellow-500' :
                      'bg-[var(--bg-elevated)] border-2 border-[var(--border-default)]'
                    }`}>
                      <step.icon className={`h-5 w-5 ${
                        step.status === 'passed' ? 'text-green-400' :
                        step.status === 'warning' ? 'text-yellow-400' :
                        'text-[var(--text-muted)]'
                      }`} />
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] mt-2 font-medium">{step.label}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      step.status === 'passed' ? 'bg-green-500' : 'bg-[var(--border-default)]'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Authorization Approval Workflow */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Authorization Packages</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-[var(--text-muted)]">Your Role:</span>
                <select
                  value={currentUserRole}
                  onChange={(e) => setCurrentUserRole(e.target.value as 'AO' | 'ISSO' | 'SCA' | 'ISSM')}
                  className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded text-sm text-[var(--text-primary)]"
                >
                  <option value="SCA">Security Control Assessor (SCA)</option>
                  <option value="ISSO">Info System Security Officer (ISSO)</option>
                  <option value="ISSM">Info System Security Manager (ISSM)</option>
                  <option value="AO">Authorizing Official (AO)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {authPackages.map((pkg) => (
              <div key={pkg.id} className="enterprise-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{pkg.component}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${
                        pkg.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        pkg.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        pkg.status === 'in_review' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {pkg.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getRiskBadgeColor(pkg.riskLevel)}`}>
                        {pkg.riskLevel.toUpperCase()} RISK
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-[var(--text-muted)]">
                      <span>System: {pkg.systemName}</span>
                      <span>Submitted: {new Date(pkg.submittedDate).toLocaleDateString()}</span>
                      <span>Target: {new Date(pkg.targetDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {canUserApprove(pkg) && (
                    <button
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setShowApprovalModal(true);
                      }}
                      className="enterprise-btn enterprise-btn-primary"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Review & Approve
                    </button>
                  )}
                </div>

                {/* Approval Chain */}
                <div className="bg-[var(--bg-elevated)] rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Approval Chain</h4>
                  <div className="flex items-center justify-between">
                    {pkg.approvals.map((approval, idx) => {
                      const Icon = getApprovalIcon(approval.role);
                      const isCurrentUserRole = approval.role === currentUserRole;
                      return (
                        <div key={approval.role} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <div className={`relative w-14 h-14 rounded-full flex items-center justify-center ${
                              approval.status === 'approved' ? 'bg-green-500/20 border-2 border-green-500' :
                              approval.status === 'rejected' ? 'bg-red-500/20 border-2 border-red-500' :
                              approval.status === 'pending' ? 'bg-[var(--bg-base)] border-2 border-[var(--border-default)]' :
                              'bg-gray-500/20 border-2 border-gray-500'
                            } ${isCurrentUserRole ? 'ring-2 ring-[var(--accent-cyan)] ring-offset-2 ring-offset-[var(--bg-elevated)]' : ''}`}>
                              <Icon className={`h-6 w-6 ${
                                approval.status === 'approved' ? 'text-green-400' :
                                approval.status === 'rejected' ? 'text-red-400' :
                                'text-[var(--text-muted)]'
                              }`} />
                              {approval.status === 'approved' && (
                                <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-green-400 bg-[var(--bg-elevated)] rounded-full" />
                              )}
                              {approval.status === 'rejected' && (
                                <XCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-red-400 bg-[var(--bg-elevated)] rounded-full" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-[var(--text-primary)] mt-2">{approval.role}</span>
                            <span className="text-[10px] text-[var(--text-muted)] text-center max-w-[80px]">{approval.roleName}</span>
                            {approval.approver && (
                              <span className="text-[10px] text-[var(--accent-cyan)] mt-1">{approval.approver.split(' ')[0]}</span>
                            )}
                            {approval.timestamp && (
                              <span className="text-[10px] text-[var(--text-muted)]">
                                {new Date(approval.timestamp).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {idx < pkg.approvals.length - 1 && (
                            <div className={`w-12 h-0.5 mx-2 ${
                              approval.status === 'approved' ? 'bg-green-500' :
                              approval.status === 'rejected' ? 'bg-red-500' :
                              'bg-[var(--border-default)]'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Comments from approvers */}
                {pkg.approvals.some(a => a.comments) && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Approval Comments
                    </h4>
                    <div className="space-y-2">
                      {pkg.approvals.filter(a => a.comments).map(a => (
                        <div key={a.role} className="text-sm bg-[var(--bg-elevated)] rounded p-2">
                          <span className="font-medium text-[var(--accent-cyan)]">{a.role}:</span>
                          <span className="text-[var(--text-secondary)] ml-2">{a.comments}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Authorizations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Pipeline Evidence</h2>
            <Link href="/hub" className="text-sm text-[var(--accent-cyan)] hover:text-[var(--accent-cyan-muted)] flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="space-y-4">
            {evidence.map((item) => (
              <div key={item.id} className="enterprise-card p-6 hover:border-[var(--accent-cyan)]/30 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${
                      item.status === 'authorized' ? 'bg-green-500/20' :
                      item.status === 'pending' ? 'bg-yellow-500/20' :
                      'bg-red-500/20'
                    }`}>
                      {getStatusIcon(item.status)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{item.component}</h3>
                        <span className={`status-badge ${
                          item.status === 'authorized' ? 'healthy' :
                          item.status === 'pending' ? 'warning' :
                          'error'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-[var(--text-muted)]">
                        <span className="flex items-center space-x-1">
                          <GitBranch className="h-4 w-4" />
                          <span>{item.project}</span>
                        </span>
                        <span>Pipeline #{item.pipeline_id}</span>
                        <span>Commit {item.commit}</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--accent-cyan)] font-mono">{item.compliance_score}%</div>
                    <div className="text-xs text-[var(--text-muted)]">Compliance Score</div>
                  </div>
                </div>

                {/* Pipeline Stages */}
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {item.stages.map((stage, idx) => (
                    <div key={idx} className="bg-[var(--bg-elevated)] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide">{stage.name}</span>
                        {getStatusIcon(stage.status)}
                      </div>
                      <div className="space-y-1">
                        {stage.jobs.map((job, jIdx) => (
                          <div key={jIdx} className="flex items-center justify-between text-xs">
                            <span className="text-[var(--text-muted)] truncate">{job.name}</span>
                            <span className={`font-mono ${getStatusColor(job.status)}`}>
                              {job.findings !== undefined ? `${job.findings}` : '✓'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Artifacts */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-[var(--text-secondary)] font-medium">Evidence Artifacts:</span>
                    <div className="flex items-center space-x-2">
                      {item.artifacts.sbom && (
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/30">SBOM</span>
                      )}
                      {item.artifacts.vulnerabilities && (
                        <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/30">Vulnerabilities</span>
                      )}
                      {item.artifacts.secrets && (
                        <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded border border-purple-500/30">Secrets</span>
                      )}
                      {item.artifacts.compliance && (
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/30">Compliance</span>
                      )}
                      {item.artifacts.scorecard && (
                        <button
                          onClick={() => {
                            const projectId = '65646370'; // flask-container-test
                            const jobId = item.pipeline_id;
                            loadScorecardResults(projectId, jobId, item.pipeline_id);
                            setShowScorecardModal(true);
                          }}
                          className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded border border-cyan-500/30 hover:bg-cyan-500/20 cursor-pointer"
                        >
                          Scorecard
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedEvidence(item);
                        setShowEmassModal(true);
                      }}
                      className="enterprise-btn enterprise-btn-secondary text-sm"
                      title="Sync to eMASS"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      eMASS
                    </button>
                    <a
                      href={`https://gitlab.com/${item.project}/-/pipelines/${item.pipeline_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="enterprise-btn enterprise-btn-secondary text-sm"
                    >
                      View in GitLab
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Authorization Requirements */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Authorization Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="enterprise-card p-6">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center">
                <Shield className="h-5 w-5 text-green-400 mr-2" />
                Security Requirements
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Container Scanning</span>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Secret Detection</span>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">SAST Analysis</span>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Dependency Scanning</span>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
              </div>
            </div>

            <div className="enterprise-card p-6">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center">
                <FileText className="h-5 w-5 text-blue-400 mr-2" />
                Compliance Requirements
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">SBOM Generation</span>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">License Compliance</span>
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Security Scorecard</span>
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Attestation</span>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Info */}
        <div className="enterprise-card p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-[var(--accent-cyan)]/10 rounded-lg">
              <Zap className="h-6 w-6 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                Automated Authorization Pipeline
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Components are continuously monitored through GitLab CI/CD pipelines. Each commit triggers automated security scans, 
                SBOM generation, and compliance checks. Only components that pass all authorization requirements are approved for deployment.
              </p>
              <div className="flex items-center space-x-4 text-xs text-[var(--text-muted)]">
                <span>• Real-time validation</span>
                <span>• Evidence collection</span>
                <span>• Automated attestation</span>
                <span>• Continuous authorization</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scorecard Results Modal */}
      {showScorecardModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Scorecard Results</h3>
                <button
                  onClick={() => setShowScorecardModal(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              {scorecardResults[selectedEvidence.pipeline_id] ? (
                <div className="space-y-4">
                  <div className="metric-card">
                    <div className="metric-label">Overall Score</div>
                    <div className="metric-value text-[var(--accent-cyan)]">
                      {scorecardResults[selectedEvidence.pipeline_id].score}%
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Check Details</h4>
                    <div className="space-y-2">
                      {scorecardResults[selectedEvidence.pipeline_id].checks?.map((check: any, idx: number) => (
                        <div key={idx} className="bg-[var(--bg-elevated)] rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[var(--text-primary)]">{check.name}</span>
                            <span className={`text-sm font-mono ${
                              check.score === 10 ? 'text-green-400' :
                              check.score >= 7 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {check.score}/10
                            </span>
                          </div>
                          {check.reason && (
                            <p className="text-xs text-[var(--text-muted)] mt-1">{check.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4 animate-spin" />
                  <p className="text-[var(--text-secondary)]">Loading scorecard results...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* eMASS Sync Modal */}
      {showEmassModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Sync to eMASS</h3>
                <button
                  onClick={() => setShowEmassModal(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    eMASS System ID
                  </label>
                  <input
                    type="text"
                    value={emassSystemId}
                    onChange={(e) => setEmassSystemId(e.target.value)}
                    placeholder="Enter eMASS system ID"
                    className="enterprise-input"
                  />
                </div>

                <div className="bg-[var(--bg-elevated)] rounded-lg p-4">
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    This will create a POA&M item in eMASS for:
                  </p>
                  <ul className="text-xs text-[var(--text-muted)] space-y-1 list-disc list-inside">
                    <li>Component: {selectedEvidence.component}</li>
                    <li>Pipeline: #{selectedEvidence.pipeline_id}</li>
                    <li>Compliance Score: {selectedEvidence.compliance_score}%</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowEmassModal(false)}
                    className="enterprise-btn enterprise-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => syncToEmass(selectedEvidence)}
                    disabled={!emassSystemId}
                    className="enterprise-btn enterprise-btn-primary"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Sync to eMASS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">Authorization Review</h3>
                  <p className="text-sm text-gray-400">Review as {currentUserRole}</p>
                </div>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalComment('');
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Package Info */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Component</span>
                    <p className="text-white font-medium">{selectedPackage.component}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase">System</span>
                    <p className="text-white font-medium">{selectedPackage.systemName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Risk Level</span>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getRiskBadgeColor(selectedPackage.riskLevel)}`}>
                      {selectedPackage.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Target Date</span>
                    <p className="text-white font-medium">{new Date(selectedPackage.targetDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Previous Approvals */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-white mb-3">Approval History</h4>
                <div className="space-y-2">
                  {selectedPackage.approvals.filter(a => a.status === 'approved' || a.status === 'rejected').map(a => (
                    <div key={a.role} className="flex items-center justify-between bg-gray-800 rounded p-3">
                      <div className="flex items-center space-x-3">
                        {a.status === 'approved' ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                        <div>
                          <p className="text-white font-medium">{a.roleName}</p>
                          <p className="text-xs text-gray-400">{a.approver}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium ${a.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                          {a.status.toUpperCase()}
                        </span>
                        {a.timestamp && (
                          <p className="text-xs text-gray-500">{new Date(a.timestamp).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Decision */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-white mb-3">Your Decision as {currentUserRole}</h4>
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-300">
                    {currentUserRole === 'SCA' && 'As the Security Control Assessor, verify that all security controls have been properly assessed and documented.'}
                    {currentUserRole === 'ISSO' && 'As the ISSO, verify that the system meets security requirements and appropriate safeguards are in place.'}
                    {currentUserRole === 'ISSM' && 'As the ISSM, verify organizational security policies are met and risk is acceptable.'}
                    {currentUserRole === 'AO' && 'As the Authorizing Official, you have final authority to authorize this system for operation.'}
                  </p>
                </div>

                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Comments (optional)
                </label>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Add any comments or conditions for your decision..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalComment('');
                  }}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproval(selectedPackage.id, 'reject')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => handleApproval(selectedPackage.id, 'approve')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
