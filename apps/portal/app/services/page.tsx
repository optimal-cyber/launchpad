'use client';

import { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  Pin, 
  PinOff, 
  Activity,
  GitBranch,
  Package,
  Shield,
  Users,
  Cloud,
  Rocket,
  Building2,
  BarChart3,
  DollarSign,
  FileText,
  MessageCircle,
  Hash,
  Database,
  Palette
} from 'lucide-react';

interface ServiceHealth {
  key: string;
  status: 'ACTIVE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN';
  lastCheck: string;
}

interface Service {
  key: string;
  label: string;
  url: string;
  icon: string;
  health?: {
    type: string;
    path: string;
  };
  description: string;
}

interface ServiceGroup {
  name: string;
  services: Service[];
}

export default function Services() {
  const [services, setServices] = useState<ServiceGroup[]>([]);
  const [healthStatus, setHealthStatus] = useState<ServiceHealth[]>([]);
  const [pinnedServices, setPinnedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
    loadPinnedServices();
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      checkServiceHealth();
    }
  }, [services]);

  const loadServices = async () => {
    try {
      // Load services from the services.config.json file
      const response = await fetch('/services.config.json');
      if (!response.ok) {
        throw new Error('Failed to fetch services config');
      }
      const servicesData = await response.json();
      setServices(servicesData);
    } catch (error) {
      console.error('Failed to load services:', error);
      // Fallback to hardcoded services if config fails
      const fallbackServices: ServiceGroup[] = [
        {
          name: 'Development & CI/CD',
          services: [
            {
              key: 'gitlab',
              label: 'GitLab',
              url: 'https://gitlab.com',
              icon: 'gitlab',
              description: 'Git repository and CI/CD platform'
            },
            {
              key: 'harbor',
              label: 'Harbor',
              url: 'https://harbor.example.com',
              icon: 'harbor',
              description: 'Container registry for storing and managing Docker images'
            },
            {
              key: 'argocd',
              label: 'ArgoCD',
              url: 'https://argocd.example.com',
              icon: 'argocd',
              description: 'GitOps continuous delivery tool for Kubernetes'
            }
          ]
        },
        {
          name: 'Monitoring & Observability',
          services: [
            {
              key: 'grafana',
              label: 'Grafana',
              url: 'https://grafana.example.com',
              icon: 'grafana',
              description: 'Metrics visualization and analytics platform'
            },
            {
              key: 'elasticsearch',
              label: 'Elasticsearch',
              url: 'https://elasticsearch.example.com',
              icon: 'elasticsearch',
              description: 'Search and analytics engine'
            },
            {
              key: 'superset',
              label: 'Apache Superset',
              url: 'https://superset.example.com',
              icon: 'superset',
              description: 'Data exploration and visualization platform'
            }
          ]
        },
        {
          name: 'Security & Compliance',
          services: [
            {
              key: 'kion',
              label: 'Kion',
              url: 'https://kion.example.com',
              icon: 'kion',
              description: 'Cloud security and compliance platform'
            },
            {
              key: 'kubecost',
              label: 'KubeCost',
              url: 'https://kubecost.example.com',
              icon: 'kubecost',
              description: 'Kubernetes cost monitoring and optimization'
            }
          ]
        },
        {
          name: 'Collaboration & Documentation',
          services: [
            {
              key: 'confluence',
              label: 'Confluence',
              url: 'https://confluence.example.com',
              icon: 'confluence',
              description: 'Team collaboration and documentation platform'
            },
            {
              key: 'jira',
              label: 'Jira',
              url: 'https://jira.example.com',
              icon: 'jira',
              description: 'Project management and issue tracking'
            },
            {
              key: 'drawio',
              label: 'Draw.io',
              url: 'https://drawio.example.com',
              icon: 'drawio',
              description: 'Diagram and flowchart creation tool'
            }
          ]
        },
        {
          name: 'Communication',
          services: [
            {
              key: 'slack',
              label: 'Slack',
              url: 'https://slack.com',
              icon: 'slack',
              description: 'Team communication and collaboration platform'
            },
            {
              key: 'rocketchat',
              label: 'Rocket.Chat',
              url: 'https://rocketchat.example.com',
              icon: 'rocketchat',
              description: 'Open-source team communication platform'
            }
          ]
        }
      ];
      setServices(fallbackServices);
    } finally {
      setLoading(false);
    }
  };

  const loadPinnedServices = () => {
    const pinned = localStorage.getItem('pinnedServices');
    if (pinned) {
      setPinnedServices(JSON.parse(pinned));
    }
  };

  const checkServiceHealth = async () => {
    const healthChecks = services.flatMap(group => 
      group.services
        .filter(service => service.health)
        .map(async (service) => {
          try {
            const response = await fetch(`/api/services/health?key=${service.key}`);
            if (response.ok) {
              const health = await response.json();
              return {
                key: service.key,
                status: health.status,
                lastCheck: new Date().toISOString()
              };
            }
          } catch (error) {
            console.error(`Health check failed for ${service.key}:`, error);
          }
          return {
            key: service.key,
            status: 'UNKNOWN' as const,
            lastCheck: new Date().toISOString()
          };
        })
    );

    const results = await Promise.all(healthChecks);
    setHealthStatus(results);
  };

  const togglePinService = (serviceKey: string) => {
    const newPinned = pinnedServices.includes(serviceKey)
      ? pinnedServices.filter(key => key !== serviceKey)
      : [...pinnedServices, serviceKey];
    
    setPinnedServices(newPinned);
    localStorage.setItem('pinnedServices', JSON.stringify(newPinned));
  };

  const getServiceIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
      gitlab: GitBranch,
      drawio: Palette,
      argo: Rocket,
      harbor: Building2,
      grafana: BarChart3,
      kubecost: DollarSign,
      jira: FileText,
      confluence: FileText,
      rocketchat: MessageCircle,
      slack: Hash,
      kion: Cloud,
      superset: Database
    };

    return iconMap[iconName] || Package;
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

  const getServiceHealth = (serviceKey: string): ServiceHealth | undefined => {
    return healthStatus.find(h => h.key === serviceKey);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64"></div>
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

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted mb-4" />
        <h3 className="text-lg font-medium text-text mb-2">No Services Configured</h3>
        <p className="text-muted mb-6">
          Configure your services in <code className="bg-gray-800 px-2 py-1 rounded">services.config.json</code> or set the <code className="bg-gray-800 px-2 py-1 rounded">NEXT_PUBLIC_SERVICES_JSON</code> environment variable.
        </p>
        <button
          onClick={loadServices}
          className="px-4 py-2 bg-accent text-card font-medium rounded-lg hover:bg-accent/90 transition-colors"
        >
          Reload Services
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">Service Catalog</h1>
        <p className="text-muted">Access and monitor your DevSecOps ecosystem tools</p>
      </div>

      {/* Service Groups */}
      {services.map((group) => (
        <div key={group.name}>
          <h2 className="text-xl font-semibold text-text mb-4">{group.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.services.map((service) => {
              const IconComponent = getServiceIcon(service.icon);
              const health = getServiceHealth(service.key);
              const isPinned = pinnedServices.includes(service.key);

              return (
                <div
                  key={service.key}
                  className="bg-card rounded-xl p-6 border border-gray-800 hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <IconComponent className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {health && (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(health.status)}`}>
                          {health.status}
                        </span>
                      )}
                      <button
                        onClick={() => togglePinService(service.key)}
                        className={`p-1 rounded transition-colors ${
                          isPinned 
                            ? 'text-accent hover:text-accent/80' 
                            : 'text-muted hover:text-text'
                        }`}
                        title={isPinned ? 'Unpin from Overview' : 'Pin to Overview'}
                      >
                        {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-text mb-2">{service.label}</h3>
                  <p className="text-sm text-muted mb-4">{service.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-muted">
                      <Activity className="h-3 w-3" />
                      {health ? (
                        <span>Last check: {new Date(health.lastCheck).toLocaleTimeString()}</span>
                      ) : (
                        <span>No health check</span>
                      )}
                    </div>
                    
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      OPEN
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

