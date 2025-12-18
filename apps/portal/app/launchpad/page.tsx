'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitBranch,
  Rocket,
  Palette,
  Container,
  Shield,
  Bug,
  ShieldCheck,
  Cloud,
  Database,
  BarChart3,
  DollarSign,
  PieChart,
  CheckSquare,
  FileText,
  ExternalLink,
  Search,
  AlertTriangle,
  Radio,
  Clock,
  TrendingDown,
  RefreshCw,
  Brain,
  Bot,
  Cpu,
  Eye,
  Lock,
  Scan,
  Workflow,
} from 'lucide-react';

type Category = 'all' | 'development' | 'security' | 'cloud' | 'monitoring' | 'collaboration' | 'ai_ml';

interface Integration {
  id: string;
  name: string;
  icon: React.ElementType;
  category: Exclude<Category, 'all'>;
  description: string;
  launchUrl: string;
  isExternal: boolean;
  status: 'connected' | 'disconnected' | 'not_configured';
}

// Integration URLs - configurable via environment variables
const SERVICE_URLS = {
  gitlab: process.env.NEXT_PUBLIC_GITLAB_URL || 'https://gitlab.gooptimal.io',
  harbor: process.env.NEXT_PUBLIC_HARBOR_URL || 'https://harbor.gooptimal.io',
  grafana: process.env.NEXT_PUBLIC_GRAFANA_URL || 'https://grafana.gooptimal.io',
  argocd: process.env.NEXT_PUBLIC_ARGOCD_URL || 'https://argocd.gooptimal.io',
  jira: process.env.NEXT_PUBLIC_JIRA_URL || 'https://jira.gooptimal.io',
  confluence: process.env.NEXT_PUBLIC_CONFLUENCE_URL || 'https://confluence.gooptimal.io',
  kubecost: process.env.NEXT_PUBLIC_KUBECOST_URL || 'https://kubecost.gooptimal.io',
};

const integrations: Integration[] = [
  // AI & ML Security (NEW - Featured)
  {
    id: 'optimal-agents',
    name: 'Optimal Agents',
    icon: Bot,
    category: 'ai_ml',
    description: 'AI-powered security scanning agents',
    launchUrl: '/agents',
    isExternal: false,
    status: 'connected',
  },
  {
    id: 'ai-security',
    name: 'AI Security',
    icon: Brain,
    category: 'ai_ml',
    description: 'AI model security assessments',
    launchUrl: '/ai-security',
    isExternal: false,
    status: 'connected',
  },
  {
    id: 'huggingface',
    name: 'HuggingFace',
    icon: Cpu,
    category: 'ai_ml',
    description: 'AI model hub & discovery',
    launchUrl: 'https://huggingface.co',
    isExternal: true,
    status: 'connected',
  },
  // Development
  {
    id: 'gitlab',
    name: 'GitLab',
    icon: GitBranch,
    category: 'development',
    description: 'Source control & CI/CD pipelines',
    launchUrl: SERVICE_URLS.gitlab,
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'argocd',
    name: 'ArgoCD',
    icon: Rocket,
    category: 'development',
    description: 'GitOps continuous delivery',
    launchUrl: SERVICE_URLS.argocd,
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'drawio',
    name: 'Draw.io',
    icon: Palette,
    category: 'development',
    description: 'Diagram and flowchart creation',
    launchUrl: 'https://app.diagrams.net',
    isExternal: true,
    status: 'connected',
  },
  // Security
  {
    id: 'wiz',
    name: 'Wiz',
    icon: Eye,
    category: 'security',
    description: 'Cloud security posture management',
    launchUrl: 'https://app.wiz.io',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'harbor',
    name: 'Harbor',
    icon: Container,
    category: 'security',
    description: 'Container registry & scanning',
    launchUrl: SERVICE_URLS.harbor,
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'snyk',
    name: 'Snyk',
    icon: Shield,
    category: 'security',
    description: 'Dependency & container scanning',
    launchUrl: 'https://app.snyk.io',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'trivy',
    name: 'Trivy',
    icon: Bug,
    category: 'security',
    description: 'Container vulnerability scanning',
    launchUrl: '/services/trivy',
    isExternal: false,
    status: 'connected',
  },
  {
    id: 'tenable',
    name: 'Tenable',
    icon: ShieldCheck,
    category: 'security',
    description: 'Enterprise vulnerability management',
    launchUrl: 'https://cloud.tenable.com',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'crowdstrike',
    name: 'CrowdStrike',
    icon: Scan,
    category: 'security',
    description: 'Endpoint detection & response',
    launchUrl: 'https://falcon.crowdstrike.com',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'vault',
    name: 'HashiCorp Vault',
    icon: Lock,
    category: 'security',
    description: 'Secrets management',
    launchUrl: 'https://vault.gooptimal.io',
    isExternal: true,
    status: 'connected',
  },
  // Cloud
  {
    id: 'aws-inspector',
    name: 'AWS Inspector',
    icon: Cloud,
    category: 'cloud',
    description: 'AWS security assessment',
    launchUrl: 'https://console.aws.amazon.com/inspector',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'aws-security-hub',
    name: 'AWS Security Hub',
    icon: Shield,
    category: 'cloud',
    description: 'AWS security findings aggregation',
    launchUrl: 'https://console.aws.amazon.com/securityhub',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'azure-defender',
    name: 'Azure Defender',
    icon: Cloud,
    category: 'cloud',
    description: 'Azure security center',
    launchUrl: 'https://portal.azure.com',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'gcp-scc',
    name: 'GCP Security Command',
    icon: Cloud,
    category: 'cloud',
    description: 'Google Cloud security management',
    launchUrl: 'https://console.cloud.google.com/security',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'kion',
    name: 'Kion',
    icon: Database,
    category: 'cloud',
    description: 'Cloud governance & cost',
    launchUrl: 'https://app.kion.io',
    isExternal: true,
    status: 'connected',
  },
  // Monitoring
  {
    id: 'grafana',
    name: 'Grafana',
    icon: BarChart3,
    category: 'monitoring',
    description: 'Metrics visualization',
    launchUrl: SERVICE_URLS.grafana,
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'datadog',
    name: 'Datadog',
    icon: BarChart3,
    category: 'monitoring',
    description: 'Infrastructure monitoring',
    launchUrl: 'https://app.datadoghq.com',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'kubecost',
    name: 'Kubecost',
    icon: DollarSign,
    category: 'monitoring',
    description: 'Kubernetes cost monitoring',
    launchUrl: SERVICE_URLS.kubecost,
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'splunk',
    name: 'Splunk',
    icon: PieChart,
    category: 'monitoring',
    description: 'Log analysis & SIEM',
    launchUrl: 'https://splunk.gooptimal.io',
    isExternal: true,
    status: 'connected',
  },
  // Collaboration
  {
    id: 'jira',
    name: 'Jira',
    icon: CheckSquare,
    category: 'collaboration',
    description: 'Issue & project tracking',
    launchUrl: SERVICE_URLS.jira,
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'confluence',
    name: 'Confluence',
    icon: FileText,
    category: 'collaboration',
    description: 'Team documentation & wiki',
    launchUrl: SERVICE_URLS.confluence,
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'servicenow',
    name: 'ServiceNow',
    icon: Workflow,
    category: 'collaboration',
    description: 'IT service management',
    launchUrl: 'https://servicenow.gooptimal.io',
    isExternal: true,
    status: 'connected',
  },
];

const categories: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ai_ml', label: 'AI & ML' },
  { id: 'security', label: 'Security' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'development', label: 'Development' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'collaboration', label: 'Collaboration' },
];

const categoryColors: Record<Exclude<Category, 'all'>, string> = {
  ai_ml: 'ai-ml',
  development: 'development',
  security: 'security',
  cloud: 'cloud',
  monitoring: 'monitoring',
  collaboration: 'collaboration',
};

const statusConfig = {
  connected: { label: 'Connected', className: 'connected' },
  disconnected: { label: 'Disconnected', className: 'disconnected' },
  not_configured: { label: 'Not Configured', className: 'configuring' },
};

export default function LaunchPadPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch =
      searchTerm === '' ||
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (category: Category) => {
    if (category === 'all') return integrations.length;
    return integrations.filter((i) => i.category === category).length;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  // Quick metrics
  const connectedCount = integrations.filter((i) => i.status === 'connected').length;
  const criticalCVEs = 12;
  const complianceScore = 94;
  const lastScanHours = 2;

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="launchpad-header mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-wide">LAUNCH PAD</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Access all integrated tools and services
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="enterprise-search">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="enterprise-input"
              />
            </div>
            {/* Time */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg">
              <Clock className="w-4 h-4 text-[var(--accent-cyan)]" />
              <span className="font-mono text-sm text-[var(--text-secondary)]">{currentTime}</span>
            </div>
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="enterprise-btn enterprise-btn-secondary"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="launchpad-metrics mb-6">
        <Link href="/vulnerabilities" className="metric-tile critical">
          <div className="metric-icon">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="metric-content">
            <span className="metric-value">{criticalCVEs}</span>
            <span className="metric-label">Critical CVEs</span>
          </div>
        </Link>
        <Link href="/agents" className="metric-tile success">
          <div className="metric-icon">
            <Radio className="w-5 h-5" />
          </div>
          <div className="metric-content">
            <span className="metric-value">{connectedCount}</span>
            <span className="metric-label">Connected</span>
          </div>
        </Link>
        <Link href="/poam" className="metric-tile info">
          <div className="metric-icon">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="metric-content">
            <span className="metric-value">{complianceScore}%</span>
            <span className="metric-label">Compliance</span>
          </div>
        </Link>
        <div className="metric-tile neutral">
          <div className="metric-icon">
            <Clock className="w-5 h-5" />
          </div>
          <div className="metric-content">
            <span className="metric-value">{lastScanHours}h</span>
            <span className="metric-label">Last Scan</span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`category-pill ${selectedCategory === category.id ? 'active' : ''}`}
          >
            {category.label}
            <span className="ml-2 text-xs opacity-70">({getCategoryCount(category.id)})</span>
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="launchpad-grid">
        {filteredIntegrations.map((integration) => {
          const Icon = integration.icon;
          const status = statusConfig[integration.status];
          const isLaunchable = integration.status !== 'not_configured';

          return (
            <div key={integration.id} className="integration-card">
              {/* Icon */}
              <div className="card-icon">
                <Icon className="w-6 h-6" />
              </div>

              {/* Category Badge */}
              <span className={`card-category ${categoryColors[integration.category]}`}>
                {integration.category}
              </span>

              {/* Title */}
              <h3 className="card-title">{integration.name}</h3>

              {/* Description */}
              <p className="card-description line-clamp-2">{integration.description}</p>

              {/* Status */}
              <div className={`connection-status ${status.className}`}>
                <span className="status-dot rounded-full" />
                <span>{status.label}</span>
              </div>

              {/* Launch Button */}
              <div className="mt-auto pt-3">
                {integration.isExternal ? (
                  <a
                    href={integration.launchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`launch-btn w-full justify-center ${!isLaunchable ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    LAUNCH
                  </a>
                ) : (
                  <Link
                    href={integration.launchUrl}
                    className={`launch-btn w-full justify-center ${!isLaunchable ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    LAUNCH
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <div className="enterprise-card p-12 text-center">
          <Search className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No integrations found</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Status Summary */}
      <div className="mt-8 p-4 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-lg">
        <div className="flex flex-wrap gap-6 justify-center text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
            <span className="text-[var(--text-muted)]">Connected:</span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              {integrations.filter((i) => i.status === 'connected').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--status-error)]" />
            <span className="text-[var(--text-muted)]">Disconnected:</span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              {integrations.filter((i) => i.status === 'disconnected').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--status-warning)]" />
            <span className="text-[var(--text-muted)]">Not Configured:</span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              {integrations.filter((i) => i.status === 'not_configured').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
