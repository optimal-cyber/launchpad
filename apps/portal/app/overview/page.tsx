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
  Pin
} from 'lucide-react';

interface ServiceCard {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
  url: string;
  badge?: string;
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
  default_branch: string;
  last_pipeline: number | null;
  sync_state: 'synced' | 'not_synced';
  description: string | null;
  created_at: string;
  last_activity_at: string;
}

interface PinnedService {
  key: string;
  label: string;
  url: string;
  icon: string;
  description: string;
}

export default function Overview() {
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [metrics, setMetrics] = useState<MetricTile[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [pinnedServices, setPinnedServices] = useState<PinnedService[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [gitlabJobId, setGitlabJobId] = useState('');

  useEffect(() => {
    initializeData();
    loadPinnedServices();
    loadProjects();
  }, []);

  const initializeData = () => {
    // Core platform services
    const coreServices: ServiceCard[] = [
      {
        id: 'gitlab',
        name: 'GitLab Integration',
        description: 'Connect and ingest artifacts from GitLab CI/CD pipelines',
        icon: GitBranch,
        status: 'ACTIVE',
        url: '/services',
        badge: 'Connected'
      },
      {
        id: 'sbom',
        name: 'SBOM Management',
        description: 'Track and manage Software Bill of Materials',
        icon: Package,
        status: 'ACTIVE',
        url: '/sbom',
        badge: '156 docs'
      },
      {
        id: 'vulnerabilities',
        name: 'Vulnerability Management',
        description: 'Track and manage security vulnerabilities',
        icon: AlertTriangle,
        status: 'ACTIVE',
        url: '/vulnerabilities',
        badge: '24 findings'
      },
      {
        id: 'poam',
        name: 'Cyber POA&M',
        description: 'Plan of Action and Milestones for cyber risk',
        icon: Shield,
        status: 'ACTIVE',
        url: '/poam',
        badge: '3 active'
      }
    ];

    // Platform metrics
    const metricTiles: MetricTile[] = [
      {
        id: 'projects',
        name: 'Active Projects',
        value: 12,
        change: '+2 this month',
        trend: 'up',
        icon: GitBranch
      },
      {
        id: 'sbom-docs',
        name: 'SBOM Documents',
        value: 156,
        change: '+23 this week',
        trend: 'up',
        icon: Package
      },
      {
        id: 'vulnerabilities',
        name: 'Vulnerabilities',
        value: 24,
        change: '-5 this week',
        trend: 'down',
        icon: AlertTriangle
      },
      {
        id: 'uptime',
        name: 'Platform Uptime',
        value: '99.9%',
        change: 'Last 30 days',
        trend: 'neutral',
        icon: Activity
      }
    ];

    // Recent activity
    const activity: ActivityItem[] = [
      {
        id: '1',
        type: 'ingest',
        message: 'SBOM ingested from GitLab job #10911221650',
        timestamp: '2 minutes ago',
        project: 'web-app'
      },
      {
        id: '2',
        type: 'vuln',
        message: 'New CVE-2024-1234 detected in package lodash',
        timestamp: '15 minutes ago',
        project: 'api-service'
      },
      {
        id: '3',
        type: 'sbom',
        message: 'SBOM updated for project mobile-app',
        timestamp: '1 hour ago',
        project: 'mobile-app'
      },
      {
        id: '4',
        type: 'deploy',
        message: 'Deployment successful for web-app v2.1.0',
        timestamp: '2 hours ago',
        project: 'web-app'
      },
      {
        id: '5',
        type: 'ingest',
        message: 'Vulnerability scan completed for api-service',
        timestamp: '3 hours ago',
        project: 'api-service'
      }
    ];

    setServices(coreServices);
    setMetrics(metricTiles);
    setRecentActivity(activity);
    setLoading(false);
  };

  const loadProjects = async () => {
    try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/projects`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const realProjects = await response.json();
      setProjects(realProjects);
      
      // Update metrics with real project data
      setMetrics(prev => prev.map(metric => {
        if (metric.id === 'projects') {
          return {
            ...metric,
            value: realProjects.length,
            change: `${realProjects.filter((p: Project) => p.sync_state === 'synced').length} synced`
          };
        }
        return metric;
      }));
    } catch (error) {
      console.error('Failed to load projects:', error);
      // Keep existing mock data if API fails
    }
  };

  const loadPinnedServices = async () => {
    try {
      const pinnedKeys = localStorage.getItem('pinnedServices');
      if (!pinnedKeys) return;

      const pinnedKeysArray = JSON.parse(pinnedKeys);
      
      // Load services config to get full service details
      const response = await fetch('/services.config.json');
      const servicesConfig = await response.json();
      
      const pinned = servicesConfig.groups
        .flatMap((group: any) => group.services)
        .filter((service: any) => pinnedKeysArray.includes(service.key))
        .map((service: any) => ({
          key: service.key,
          label: service.label,
          url: service.url,
          icon: service.icon,
          description: service.description
        }));

      setPinnedServices(pinned);
    } catch (error) {
      console.error('Failed to load pinned services:', error);
    }
  };

  const handleQuickIngest = async () => {
    if (!gitlabJobId.trim()) return;

    try {
      // TODO: Implement actual GitLab ingestion
      console.log('Ingesting from GitLab job:', gitlabJobId);
      
      // Add to recent activity
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        type: 'ingest',
        message: `SBOM ingested from GitLab job #${gitlabJobId}`,
        timestamp: 'Just now',
        project: 'web-app'
      };
      
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]);
      setGitlabJobId('');
    } catch (error) {
      console.error('Ingest failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DEGRADED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'OFFLINE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ingest':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'vuln':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'sbom':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'deploy':
        return <Rocket className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-6 border border-gray-800">
              <div className="skeleton h-6 w-32 mb-4"></div>
              <div className="skeleton h-4 w-full mb-2"></div>
              <div className="skeleton h-4 w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">Overview</h1>
        <p className="text-muted">Welcome to your GitLab-native DevSecOps control plane</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Pinned Services */}
          {pinnedServices.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-text mb-4">Pinned Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pinnedServices.map((service) => (
                  <div
                    key={service.key}
                    className="bg-card rounded-xl p-6 border border-gray-800 hover:border-accent/50 transition-colors group cursor-pointer"
                    onClick={() => window.open(service.url, '_blank')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <Pin className="h-6 w-6 text-accent" />
                      </div>
                      <span className="text-xs text-muted bg-gray-800 px-2 py-1 rounded">
                        Pinned
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-text mb-2 group-hover:text-accent transition-colors">
                      {service.label}
                    </h3>
                    <p className="text-sm text-muted mb-4">{service.description}</p>
                    
                    <div className="flex items-center text-accent text-sm font-medium group-hover:text-accent/80 transition-colors">
                      <span>Open Service</span>
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Core Platform Services */}
          <div>
            <h2 className="text-xl font-semibold text-text mb-4">Platform Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-card rounded-xl p-6 border border-gray-800 hover:border-accent/50 transition-colors group cursor-pointer"
                  onClick={() => window.open(service.url, '_blank')}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                      <service.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                      {service.badge && (
                        <span className="text-xs text-muted bg-gray-800 px-2 py-1 rounded">
                          {service.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-text mb-2 group-hover:text-accent transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-muted mb-4">{service.description}</p>
                  
                  <div className="flex items-center text-accent text-sm font-medium group-hover:text-accent/80 transition-colors">
                    <span>Open Service</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Metrics */}
          <div>
            <h2 className="text-xl font-semibold text-text mb-4">Platform Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric) => (
                <div key={metric.id} className="bg-card rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <metric.icon className="h-5 w-5 text-accent" />
                    </div>
                    <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                      {metric.change}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-2xl font-bold text-text">{metric.value}</span>
                  </div>
                  
                  <h3 className="text-sm font-medium text-muted">{metric.name}</h3>
                </div>
              ))}
            </div>
          </div>

          {/* GitLab Projects */}
          <div>
            <h2 className="text-xl font-semibold text-text mb-4">GitLab Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-card rounded-xl p-6 border border-gray-800 hover:border-accent/50 transition-colors group cursor-pointer"
                  onClick={() => window.open(project.repo_url, '_blank')}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                      <GitBranch className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                        project.sync_state === 'synced' 
                          ? 'border-green-500 text-green-600 bg-green-100' 
                          : 'border-yellow-500 text-yellow-600 bg-yellow-100'
                      }`}>
                        {project.sync_state === 'synced' ? 'Synced' : 'Not Synced'}
                      </span>
                      {project.last_pipeline && (
                        <span className="text-xs text-muted bg-gray-800 px-2 py-1 rounded">
                          #{project.last_pipeline}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-text mb-2 group-hover:text-accent transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted mb-4">
                    Branch: {project.default_branch} • Last Activity: {new Date(project.last_activity_at).toLocaleDateString()}
                  </p>
                  
                  <div className="flex items-center text-accent text-sm font-medium group-hover:text-accent/80 transition-colors">
                    <span>View in GitLab</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Rail */}
        <div className="space-y-6">
          {/* Quick Ingest from GitLab */}
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-text mb-4">Quick Ingest from GitLab</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="jobId" className="block text-sm font-medium text-muted mb-2">
                  GitLab Job ID
                </label>
                <input
                  type="text"
                  id="jobId"
                  value={gitlabJobId}
                  onChange={(e) => setGitlabJobId(e.target.value)}
                  placeholder="e.g., 10911221650"
                  className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>
              <button
                onClick={handleQuickIngest}
                disabled={!gitlabJobId.trim()}
                className="w-full flex items-center justify-center px-4 py-2 bg-accent text-card font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ingest from GitLab
              </button>
              <p className="text-xs text-muted text-center">
                Pulls SBOM and vulnerability data from GitLab CI/CD job artifacts
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-text mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text mb-1">{activity.message}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted">
                      <Clock className="h-3 w-3" />
                      <span>{activity.timestamp}</span>
                      {activity.project && (
                        <>
                          <span>•</span>
                          <span className="text-accent">{activity.project}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-800">
              <button className="w-full text-sm text-accent hover:text-accent/80 font-medium transition-colors">
                View All Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
