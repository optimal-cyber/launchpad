'use client';

import { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Package, 
  AlertTriangle, 
  Shield, 
  Rocket, 
  Building2,
  Activity,
  Clock,
  ArrowRight,
  Plus,
  ExternalLink,
  Pin,
  Zap,
  Database,
  Layers,
  Globe,
  Server,
  Cpu,
  BarChart3,
  FileText,
  Lock,
  DollarSign,
  GitCommit,
  Cloud,
  Palette,
  PieChart
} from 'lucide-react';
import { keycloakSSO } from '@/lib/keycloak';

interface ServiceCard {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
  url: string;
  badge?: string;
  ssoEnabled?: boolean;
  externalUrl?: string;
  category: 'development' | 'monitoring' | 'security' | 'collaboration' | 'cost' | 'deployment';
}

interface MetricTile {
  id: string;
  name: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

interface ActivityItem {
  id: string;
  type: 'ingest' | 'vuln' | 'sbom' | 'deploy';
  message: string;
  timestamp: string;
  project?: string;
}

interface Project {
  id: string;
  name: string;
  gitlab_project_id: number;
  repo_url: string;
  last_scan: string;
  vuln_count: number;
  sbom_status: 'COMPLETE' | 'PENDING' | 'FAILED';
  compliance_score: number;
}

interface RuntimeRisk {
  type: string;
  severity: string;
  description: string;
  detected_at: string;
}

interface ContainerVulnerability {
  cve: string;
  severity: string;
  package: string;
  version: string;
  description: string;
}

interface ComplianceIssue {
  rule: string;
  description: string;
  status: string;
}

interface RuntimeContainer {
  id: string;
  name: string;
  image: string;
  cluster: string;
  namespace: string;
  pod: string;
  status: string;
  runtime_risks: RuntimeRisk[];
  vulnerabilities: ContainerVulnerability[];
  compliance_issues: ComplianceIssue[];
  network_connections: number;
  file_system_changes: number;
  process_activity: string;
}

export default function LaunchpadPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'services' | 'runtime' | 'ai-security'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [realProjects, setRealProjects] = useState<any[]>([]);
  const [runtimeAgents, setRuntimeAgents] = useState<any[]>([]);
  const [runtimeContainers, setRuntimeContainers] = useState<RuntimeContainer[]>([]);
  const [runtimeEvents, setRuntimeEvents] = useState<any[]>([]);
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [aiSecurityTests, setAiSecurityTests] = useState<any[]>([]);
  const [aiThreatModel, setAiThreatModel] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Handle service click with SSO integration
  const handleServiceClick = async (service: ServiceCard) => {
    if (service.ssoEnabled) {
      // For SSO-enabled services, initiate Keycloak SSO flow
      try {
        const ssoUrl = await keycloakSSO.initiateSSO(service.id);
        
        // If we get a service URL back, open it directly
        if (ssoUrl.startsWith('http')) {
          window.open(ssoUrl, '_blank');
        } else {
          // If we get an auth URL, redirect to Keycloak
          window.location.href = ssoUrl;
        }
      } catch (error) {
        console.error('SSO authentication failed:', error);
        // Fallback to direct external URL
        window.open(service.externalUrl, '_blank');
      }
    } else {
      // For non-SSO services, open external URL directly
      window.open(service.externalUrl, '_blank');
    }
  };

  // Mock data - in real app, this would come from API
  const services: ServiceCard[] = [
    // Development Services
    {
      id: 'gitlab',
      name: 'GitLab',
      description: 'Source code management and CI/CD',
      icon: GitBranch,
      status: 'ACTIVE',
      url: '/services/gitlab',
      badge: 'Connected',
      ssoEnabled: true,
      externalUrl: 'https://gitlab.com',
      category: 'development'
    },
    {
      id: 'harbor',
      name: 'Harbor',
      description: 'Container registry and security scanning',
      icon: Package,
      status: 'ACTIVE',
      url: '/services/harbor',
      badge: 'Active',
      ssoEnabled: true,
      externalUrl: 'https://harbor.example.com',
      category: 'development'
    },
    {
      id: 'argo',
      name: 'Argo CD',
      description: 'GitOps continuous delivery',
      icon: GitCommit,
      status: 'ACTIVE',
      url: '/services/argo',
      badge: 'Synced',
      ssoEnabled: true,
      externalUrl: 'https://argo.example.com',
      category: 'deployment'
    },
    
    // Monitoring Services
    {
      id: 'grafana',
      name: 'Grafana',
      description: 'Observability and monitoring dashboards',
      icon: BarChart3,
      status: 'ACTIVE',
      url: '/services/grafana',
      badge: 'Monitoring',
      ssoEnabled: true,
      externalUrl: 'http://localhost:3001',
      category: 'monitoring'
    },
    {
      id: 'prometheus',
      name: 'Prometheus',
      description: 'Metrics collection and alerting',
      icon: Activity,
      status: 'ACTIVE',
      url: '/services/prometheus',
      badge: 'Collecting',
      ssoEnabled: false,
      externalUrl: 'http://localhost:9090',
      category: 'monitoring'
    },
    
    // Security Services
    {
      id: 'vault',
      name: 'Vault',
      description: 'Secrets management and encryption',
      icon: Shield,
      status: 'ACTIVE',
      url: '/services/vault',
      badge: 'Secure',
      ssoEnabled: true,
      externalUrl: 'https://vault.example.com',
      category: 'security'
    },
    {
      id: 'kion',
      name: 'Kion',
      description: 'Cloud security and compliance',
      icon: Lock,
      status: 'ACTIVE',
      url: '/services/kion',
      badge: 'Compliant',
      ssoEnabled: true,
      externalUrl: 'https://kion.example.com',
      category: 'security'
    },
    
    // Collaboration Services
    {
      id: 'confluence',
      name: 'Confluence',
      description: 'Documentation and knowledge management',
      icon: Building2,
      status: 'DEGRADED',
      url: '/services/confluence',
      badge: 'Sync Issues',
      ssoEnabled: true,
      externalUrl: 'https://confluence.example.com',
      category: 'collaboration'
    },
    {
      id: 'jira',
      name: 'Jira',
      description: 'Project management and issue tracking',
      icon: Activity,
      status: 'ACTIVE',
      url: '/services/jira',
      badge: 'Connected',
      ssoEnabled: true,
      externalUrl: 'https://jira.example.com',
      category: 'collaboration'
    },
    {
      id: 'rocketchat',
      name: 'RocketChat',
      description: 'Team communication and collaboration',
      icon: Globe,
      status: 'OFFLINE',
      url: '/services/rocketchat',
      badge: 'Offline',
      ssoEnabled: true,
      externalUrl: 'https://chat.example.com',
      category: 'collaboration'
    },
    {
      id: 'drawio',
      name: 'Draw.io',
      description: 'Diagramming and flowcharts',
      icon: Palette,
      status: 'ACTIVE',
      url: '/services/drawio',
      badge: 'Available',
      ssoEnabled: true,
      externalUrl: 'https://draw.io',
      category: 'collaboration'
    },
    
    // Cost Management
    {
      id: 'kubecost',
      name: 'Kubecost',
      description: 'Kubernetes cost monitoring and optimization',
      icon: DollarSign,
      status: 'ACTIVE',
      url: '/services/kubecost',
      badge: 'Optimizing',
      ssoEnabled: true,
      externalUrl: 'https://kubecost.example.com',
      category: 'cost'
    },
    
    // Analytics
    {
      id: 'superset',
      name: 'Apache Superset',
      description: 'Data visualization and analytics',
      icon: PieChart,
      status: 'ACTIVE',
      url: '/services/superset',
      badge: 'Analyzing',
      ssoEnabled: true,
      externalUrl: 'https://superset.example.com',
      category: 'monitoring'
    }
  ];

  const metrics: MetricTile[] = [
    {
      id: 'projects',
      name: 'Active Projects',
      value: 12,
      change: '+2 this week',
      trend: 'up',
      icon: GitBranch
    },
    {
      id: 'vulnerabilities',
      name: 'Critical Vulnerabilities',
      value: 3,
      change: '-5 this week',
      trend: 'down',
      icon: AlertTriangle
    },
    {
      id: 'sboms',
      name: 'SBOMs Generated',
      value: 47,
      change: '+12 this week',
      trend: 'up',
      icon: Package
    },
    {
      id: 'compliance',
      name: 'Compliance Score',
      value: '94%',
      change: '+2% this week',
      trend: 'up',
      icon: Shield
    }
  ];

  const recentActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'deploy',
      message: 'Production deployment completed for optimal-platform',
      timestamp: '2 minutes ago',
      project: 'optimal-platform'
    },
    {
      id: '2',
      type: 'vuln',
      message: '3 new vulnerabilities detected in container images',
      timestamp: '15 minutes ago',
      project: 'optimal-platform'
    },
    {
      id: '3',
      type: 'sbom',
      message: 'SBOM generated for optimal-platform v2.1.0',
      timestamp: '1 hour ago',
      project: 'optimal-platform'
    },
    {
      id: '4',
      type: 'ingest',
      message: 'GitLab webhook received for optimal-platform',
      timestamp: '2 hours ago',
      project: 'optimal-platform'
    }
  ];

  const projects: Project[] = [
    {
      id: '1',
      name: 'optimal-platform',
      gitlab_project_id: 123,
      repo_url: 'https://gitlab.com/optimal/optimal-platform',
      last_scan: '2 minutes ago',
      vuln_count: 3,
      sbom_status: 'COMPLETE',
      compliance_score: 94
    },
    {
      id: '2',
      name: 'optimal-agent',
      gitlab_project_id: 124,
      repo_url: 'https://gitlab.com/optimal/optimal-agent',
      last_scan: '1 hour ago',
      vuln_count: 0,
      sbom_status: 'COMPLETE',
      compliance_score: 98
    },
    {
      id: '3',
      name: 'optimal-dashboard',
      gitlab_project_id: 125,
      repo_url: 'https://gitlab.com/optimal/optimal-dashboard',
      last_scan: '3 hours ago',
      vuln_count: 1,
      sbom_status: 'PENDING',
      compliance_score: 87
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch real GitLab projects
        const projectsResponse = await fetch('http://localhost:8000/api/gitlab/projects');
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          if (projectsData.success) {
            setRealProjects(projectsData.projects);
          }
        }

        // Fetch runtime security data
        const [agentsResponse, containersResponse, eventsResponse, aiModelsResponse, aiTestsResponse, aiThreatModelResponse] = await Promise.all([
          fetch('http://localhost:8000/api/runtime/agents'),
          fetch('http://localhost:8000/api/runtime/containers'),
          fetch('http://localhost:8000/api/runtime/security-events'),
          fetch('http://localhost:8000/api/ai/models'),
          fetch('http://localhost:8000/api/ai/security-tests'),
          fetch('http://localhost:8000/api/ai/threat-model')
        ]);

        if (agentsResponse.ok) {
          const agentsData = await agentsResponse.json();
          if (agentsData.success) {
            setRuntimeAgents(agentsData.agents);
          }
        }

        if (containersResponse.ok) {
          const containersData = await containersResponse.json();
          if (containersData.success) {
            setRuntimeContainers(containersData.containers);
          }
        }

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          if (eventsData.success) {
            setRuntimeEvents(eventsData.events);
          }
        }

        if (aiModelsResponse.ok) {
          const aiModelsData = await aiModelsResponse.json();
          if (aiModelsData.success) {
            setAiModels(aiModelsData.models);
          }
        }

        if (aiTestsResponse.ok) {
          const aiTestsData = await aiTestsResponse.json();
          if (aiTestsData.success) {
            setAiSecurityTests(aiTestsData.test_results);
          }
        }

        if (aiThreatModelResponse.ok) {
          const aiThreatModelData = await aiThreatModelResponse.json();
          if (aiThreatModelData.success) {
            setAiThreatModel(aiThreatModelData.threat_model);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-400/20';
      case 'DEGRADED': return 'text-yellow-400 bg-yellow-400/20';
      case 'OFFLINE': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deploy': return Rocket;
      case 'vuln': return AlertTriangle;
      case 'sbom': return Package;
      case 'ingest': return GitBranch;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'deploy': return 'text-blue-400 bg-blue-400/20';
      case 'vuln': return 'text-red-400 bg-red-400/20';
      case 'sbom': return 'text-green-400 bg-green-400/20';
      case 'ingest': return 'text-purple-400 bg-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Optimal Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Optimal Platform</h1>
                <p className="text-sm text-blue-200">Application Security Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-400">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">All Systems Operational</span>
              </div>
              <button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-200">
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: Activity },
              { id: 'projects', name: 'Projects', icon: GitBranch },
              { id: 'services', name: 'Services', icon: Server },
              { id: 'runtime', name: 'Runtime Security', icon: Shield },
              { id: 'ai-security', name: 'AI Security', icon: Cpu }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric) => (
                <div key={metric.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <metric.icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                      {metric.change}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                  <div className="text-sm text-gray-400">{metric.name}</div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{activity.message}</p>
                        <p className="text-gray-400 text-xs">{activity.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">GitLab Projects</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">
                  {realProjects.length > 0 ? `${realProjects.length} projects from GitLab` : 'No GitLab projects found'}
                </span>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Project</span>
                </button>
              </div>
            </div>
            
            {realProjects.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {realProjects.map((project) => (
                  <div key={project.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                      <div className="text-sm text-gray-400">#{project.id}</div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-300 mb-2">{project.description || 'No description'}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span className={`px-2 py-1 rounded-full ${
                          project.visibility === 'public' ? 'bg-green-400/20 text-green-400' : 'bg-blue-400/20 text-blue-400'
                        }`}>
                          {project.visibility}
                        </span>
                        <span>Branch: {project.default_branch}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Pipeline Success Rate</span>
                        <span className="text-sm font-medium text-white">{project.metrics?.success_rate || 0}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Open Issues</span>
                        <span className="text-sm font-medium text-white">{project.metrics?.open_issues || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Open MRs</span>
                        <span className="text-sm font-medium text-white">{project.metrics?.open_merge_requests || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Security Jobs</span>
                        <span className="text-sm font-medium text-white">{project.metrics?.security_jobs || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Last Activity</span>
                        <span className="text-sm text-gray-300">
                          {project.last_activity_at ? new Date(project.last_activity_at).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => window.open(project.web_url, '_blank')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                      >
                        View in GitLab
                      </button>
                      <button className="bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No GitLab Projects Found</h3>
                <p className="text-gray-400 mb-4">
                  Make sure your GitLab token is configured and you have access to projects.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Configure GitLab Integration
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Platform Services</h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Service</span>
              </button>
            </div>

            {/* Service Categories Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedCategory === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                onClick={() => setSelectedCategory('all')}
              >
                All Services
              </button>
              {['development', 'monitoring', 'security', 'collaboration', 'cost', 'deployment'].map((category) => (
                <button
                  key={category}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                    selectedCategory === category 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services
                .filter(service => selectedCategory === 'all' || service.category === selectedCategory)
                .map((service) => (
                <div 
                  key={service.id} 
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 cursor-pointer transition-all duration-200 group"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <service.icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {service.ssoEnabled && (
                        <div className="h-2 w-2 bg-green-400 rounded-full" title="SSO Enabled"></div>
                      )}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                        {service.badge}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${
                        service.status === 'ACTIVE' ? 'bg-green-400' :
                        service.status === 'DEGRADED' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                      <span className="text-sm text-gray-400">{service.status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 capitalize">{service.category}</span>
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'runtime' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Runtime Security</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">
                  {runtimeAgents.length} agents monitoring {runtimeContainers.length} containers
                </span>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Deploy Agent</span>
                </button>
              </div>
            </div>

            {/* Runtime Agents */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Runtime Security Agents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {runtimeAgents.map((agent) => (
                  <div key={agent.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white">{agent.name}</h4>
                      <div className={`h-2 w-2 rounded-full ${
                        agent.status === 'active' ? 'bg-green-400' : 
                        agent.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cluster:</span>
                        <span className="text-white">{agent.cluster}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Containers:</span>
                        <span className="text-white">{agent.containers_monitored}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vulnerabilities:</span>
                        <span className="text-white">{agent.vulnerabilities_detected}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Compliance:</span>
                        <span className="text-white">{agent.compliance_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Location:</span>
                        <span className="text-white">{agent.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Runtime Containers */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Monitored Containers</h3>
              <div className="space-y-4">
                {runtimeContainers.map((container) => (
                  <div key={container.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-white">{container.name}</h4>
                        <span className="text-sm text-gray-400">{container.image}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          container.status === 'running' ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
                        }`}>
                          {container.status}
                        </span>
                        <span className="text-sm text-gray-400">{container.cluster}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Runtime Risks:</span>
                        <span className="text-white ml-2">{container.runtime_risks?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Vulnerabilities:</span>
                        <span className="text-white ml-2">{container.vulnerabilities?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Compliance Issues:</span>
                        <span className="text-white ml-2">{container.compliance_issues?.length || 0}</span>
                      </div>
                    </div>
                    
                    {container.runtime_risks && container.runtime_risks.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm text-red-400 font-medium">Active Risks:</span>
                        <div className="mt-1 space-y-1">
                          {container.runtime_risks.map((risk: RuntimeRisk, index: number) => (
                            <div key={index} className="text-sm text-red-300">
                              • {risk.description} ({risk.severity})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Runtime Security Events */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Security Events</h3>
              <div className="space-y-3">
                {runtimeEvents.map((event) => (
                  <div key={event.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`h-2 w-2 rounded-full ${
                          event.severity === 'critical' ? 'bg-red-400' :
                          event.severity === 'high' ? 'bg-orange-400' :
                          event.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                        }`}></div>
                        <h4 className="font-medium text-white">{event.type.replace('_', ' ').toUpperCase()}</h4>
                        <span className="text-sm text-gray-400">{event.severity}</span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{event.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>Container: {event.container_name}</span>
                      <span>Cluster: {event.cluster}</span>
                      <span>Namespace: {event.namespace}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-security' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">AI Security & Red Teaming</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">
                  {aiModels.length} AI models • {aiSecurityTests.length} security tests conducted
                </span>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Run Red Team Test</span>
                </button>
              </div>
            </div>

            {/* AI Models Overview */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">AI/ML Models</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiModels.map((model) => (
                  <div key={model.model_id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white">{model.model_name}</h4>
                      <div className={`h-2 w-2 rounded-full ${
                        model.status === 'active' ? 'bg-green-400' : 
                        model.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white">{model.model_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Framework:</span>
                        <span className="text-white">{model.framework}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vulnerabilities:</span>
                        <span className={`${model.vulnerabilities > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {model.vulnerabilities}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Compliance:</span>
                        <span className="text-white">{model.compliance_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cluster:</span>
                        <span className="text-white">{model.cluster}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {model.capabilities.map((cap: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-blue-400/20 text-blue-400 text-xs rounded">
                            {cap.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Security Test Results */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Red Team Test Results</h3>
              <div className="space-y-4">
                {aiSecurityTests.map((test) => (
                  <div key={test.test_id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`h-2 w-2 rounded-full ${
                          test.severity === 'critical' ? 'bg-red-400' :
                          test.severity === 'high' ? 'bg-orange-400' :
                          test.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                        }`}></div>
                        <h4 className="font-medium text-white">{test.threat_type.replace('_', ' ').toUpperCase()}</h4>
                        <span className="text-sm text-gray-400">{test.severity}</span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(test.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{test.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Model:</span>
                        <span className="text-white ml-2">{test.model_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Cluster:</span>
                        <span className="text-white ml-2">{test.cluster}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Payload:</span>
                        <span className="text-white ml-2 font-mono text-xs">{test.payload}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Result:</span>
                        <span className={`ml-2 ${test.success ? 'text-red-400' : 'text-green-400'}`}>
                          {test.success ? 'VULNERABLE' : 'SECURE'}
                        </span>
                      </div>
                    </div>
                    {test.actual_behavior && (
                      <div className="mt-3 p-3 bg-gray-800 rounded">
                        <span className="text-sm text-gray-400">Actual Response:</span>
                        <p className="text-sm text-gray-300 mt-1">{test.actual_behavior}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Threat Model */}
            {aiThreatModel && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">AI Threat Model</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-white mb-3">Risk Assessment</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Overall Risk Score:</span>
                        <span className={`font-bold ${
                          aiThreatModel.overall_risk_score > 7 ? 'text-red-400' :
                          aiThreatModel.overall_risk_score > 5 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {aiThreatModel.overall_risk_score}/10
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Level:</span>
                        <span className={`font-bold ${
                          aiThreatModel.risk_level === 'HIGH' ? 'text-red-400' :
                          aiThreatModel.risk_level === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {aiThreatModel.risk_level}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Models Analyzed:</span>
                        <span className="text-white">{aiThreatModel.models_analyzed}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-3">Threat Categories</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(aiThreatModel.threat_categories || {}).map(([category, data]: [string, any]) => (
                        <div key={category} className="flex justify-between">
                          <span className="text-gray-400">{category.replace('_', ' ')}:</span>
                          <span className="text-white">{data.count} tests</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {aiThreatModel.recommendations && (
                  <div className="mt-6">
                    <h4 className="font-medium text-white mb-3">Security Recommendations</h4>
                    <div className="space-y-3">
                      {aiThreatModel.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-white">{rec.category}</h5>
                            <span className={`px-2 py-1 rounded text-xs ${
                              rec.priority === 'HIGH' ? 'bg-red-400/20 text-red-400' :
                              rec.priority === 'MEDIUM' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-blue-400/20 text-blue-400'
                            }`}>
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{rec.recommendation}</p>
                          <p className="text-xs text-gray-400">{rec.implementation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}