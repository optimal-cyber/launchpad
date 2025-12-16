'use client';

import { useState } from 'react';
import {
  GitBranch,
  Rocket,
  Palette,
  Container,
  Shield,
  Bug,
  ShieldAlert,
  ShieldCheck,
  Cloud,
  Database,
  BarChart3,
  DollarSign,
  PieChart,
  CheckSquare,
  FileText,
  Package,
  ExternalLink,
  Search,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

type Category = 'all' | 'development' | 'security' | 'cloud' | 'monitoring' | 'collaboration';

interface Product {
  id: string;
  name: string;
  icon: React.ElementType;
  category: Exclude<Category, 'all'>;
  description: string;
  detailedDescription: string;
  configPath: string;
  launchUrl: string;
  isExternal: boolean;
  status: 'connected' | 'disconnected' | 'not_configured';
}

const products: Product[] = [
  // Development
  {
    id: 'gitlab',
    name: 'GitLab',
    icon: GitBranch,
    category: 'development',
    description: 'Source control & CI/CD pipelines',
    detailedDescription: 'Unify source code, pipelines, and image builds in a single application. GitLab accelerates development and integrates with Argo to streamline packaging and deployment.',
    configPath: '/services/gitlab',
    launchUrl: 'https://gitlab.com',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'argocd',
    name: 'ArgoCD',
    icon: Rocket,
    category: 'development',
    description: 'GitOps continuous delivery',
    detailedDescription: 'Maintain deployment consistency with GitOps-driven automation. Argo CD syncs Kubernetes manifests to prevent drift and support reliable, scalable application delivery.',
    configPath: '/services/argocd',
    launchUrl: 'https://argocd.example.com',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'drawio',
    name: 'Draw.io',
    icon: Palette,
    category: 'development',
    description: 'Diagram and flowchart creation',
    detailedDescription: 'Clarify complex systems through collaborative diagramming. Draw.io enhances team alignment with visual tools that support planning, architecture, and communication.',
    configPath: '/services/drawio',
    launchUrl: 'https://app.diagrams.net',
    isExternal: true,
    status: 'not_configured',
  },
  // Security
  {
    id: 'harbor',
    name: 'Harbor',
    icon: Container,
    category: 'security',
    description: 'Container registry & scanning',
    detailedDescription: 'Ensure deployment integrity with a trusted image registry. Harbor certifies container images and separates staging from production to reduce risk and enforce security.',
    configPath: '/services/harbor',
    launchUrl: 'https://registry.example.com',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'snyk',
    name: 'Snyk',
    icon: Shield,
    category: 'security',
    description: 'Dependency & container scanning',
    detailedDescription: 'Developer-first security scanning for code, dependencies, containers, and infrastructure as code. Find and fix vulnerabilities automatically.',
    configPath: '/services/snyk',
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
    detailedDescription: 'Comprehensive vulnerability scanner for containers, file systems, Git repositories, and Kubernetes. Detect CVEs, misconfigurations, and secrets.',
    configPath: '/services/trivy',
    launchUrl: '/services/trivy',
    isExternal: false,
    status: 'connected',
  },
  {
    id: 'nessus',
    name: 'Nessus',
    icon: ShieldAlert,
    category: 'security',
    description: 'Vulnerability assessment',
    detailedDescription: 'Enterprise vulnerability scanning and compliance assessment. Identify vulnerabilities, misconfigurations, and malware across your infrastructure.',
    configPath: '/services/nessus',
    launchUrl: 'https://nessus.example.com',
    isExternal: true,
    status: 'disconnected',
  },
  {
    id: 'tenable',
    name: 'Tenable',
    icon: ShieldCheck,
    category: 'security',
    description: 'Enterprise vulnerability management',
    detailedDescription: 'Unified vulnerability management platform. Gain visibility into assets and vulnerabilities across your entire attack surface.',
    configPath: '/services/tenable',
    launchUrl: 'https://cloud.tenable.com',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'rapid7',
    name: 'Rapid7',
    icon: Shield,
    category: 'security',
    description: 'Security analytics & insights',
    detailedDescription: 'Vulnerability risk management with exploitability assessment. Prioritize remediation based on real-world threat intelligence.',
    configPath: '/services/rapid7',
    launchUrl: 'https://insight.rapid7.com',
    isExternal: true,
    status: 'not_configured',
  },
  // Cloud
  {
    id: 'aws-inspector',
    name: 'AWS Inspector',
    icon: Cloud,
    category: 'cloud',
    description: 'AWS security assessment',
    detailedDescription: 'Automated vulnerability management for AWS workloads. Continuously scan EC2 instances, Lambda functions, and container images.',
    configPath: '/services/aws-inspector',
    launchUrl: 'https://console.aws.amazon.com/inspector',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'azure-defender',
    name: 'Azure Defender',
    icon: Cloud,
    category: 'cloud',
    description: 'Azure security center',
    detailedDescription: 'Cloud-native security for Azure workloads. Unified security management and advanced threat protection across hybrid cloud environments.',
    configPath: '/services/azure-defender',
    launchUrl: 'https://portal.azure.com',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'kion',
    name: 'Kion',
    icon: Database,
    category: 'cloud',
    description: 'Cloud governance & cost',
    detailedDescription: 'Cloud governance and cost management platform. Gain visibility, guidance, and automation to control cloud costs and enforce compliance.',
    configPath: '/services/kion',
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
    detailedDescription: 'Query, visualize, alert on, and understand your metrics. Create, explore, and share beautiful dashboards for comprehensive observability.',
    configPath: '/services/grafana',
    launchUrl: 'https://grafana.example.com',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'kubecost',
    name: 'Kubecost',
    icon: DollarSign,
    category: 'monitoring',
    description: 'Kubernetes cost monitoring',
    detailedDescription: 'Real-time cost monitoring and optimization for Kubernetes. Track resource usage, identify savings opportunities, and set budget alerts.',
    configPath: '/services/kubecost',
    launchUrl: '/services/kubecost',
    isExternal: false,
    status: 'connected',
  },
  {
    id: 'superset',
    name: 'Superset',
    icon: PieChart,
    category: 'monitoring',
    description: 'Data visualization & BI',
    detailedDescription: 'Modern data exploration and visualization platform. Build interactive dashboards and perform ad-hoc analysis on your data.',
    configPath: '/services/superset',
    launchUrl: 'https://superset.example.com',
    isExternal: true,
    status: 'not_configured',
  },
  // Collaboration
  {
    id: 'jira',
    name: 'Jira',
    icon: CheckSquare,
    category: 'collaboration',
    description: 'Issue & project tracking',
    detailedDescription: 'Agile project management and issue tracking. Plan sprints, track progress, and release software with confidence.',
    configPath: '/services/jira',
    launchUrl: 'https://jira.example.com',
    isExternal: true,
    status: 'connected',
  },
  {
    id: 'confluence',
    name: 'Confluence',
    icon: FileText,
    category: 'collaboration',
    description: 'Team documentation & wiki',
    detailedDescription: 'Team collaboration and documentation platform. Create, organize, and share knowledge across your organization.',
    configPath: '/services/confluence',
    launchUrl: '/services/confluence',
    isExternal: false,
    status: 'connected',
  },
];

const categories: { id: Category; label: string; description: string }[] = [
  { id: 'all', label: 'All Products', description: 'View all available integrations' },
  { id: 'development', label: 'Development', description: 'Source control, CI/CD, and development tools' },
  { id: 'security', label: 'Security', description: 'Vulnerability scanning and security assessment' },
  { id: 'cloud', label: 'Cloud', description: 'Cloud security and governance' },
  { id: 'monitoring', label: 'Monitoring', description: 'Metrics, cost tracking, and observability' },
  { id: 'collaboration', label: 'Collaboration', description: 'Project management and documentation' },
];

const categoryColors: Record<Exclude<Category, 'all'>, string> = {
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

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch =
      searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (category: Category) => {
    if (category === 'all') return products.length;
    return products.filter((p) => p.category === category).length;
  };

  return (
    <div className="p-6 min-h-screen">
      {/* Hero Section */}
      <div className="products-hero mb-8">
        <div className="hero-content">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-blue)] flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="hero-title">Optimal Products</h1>
              <p className="text-sm text-[var(--text-muted)]">17 integrations across 5 categories</p>
            </div>
          </div>
          <p className="hero-description">
            The complete security and DevOps ecosystem. Access all integrated tools and services in one unified platform
            for seamless development, security, and operations.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="enterprise-search flex-1 max-w-md">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="enterprise-input"
          />
        </div>

        {/* Category Filter */}
        <div className="category-filter">
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
      </div>

      {/* Category Description */}
      {selectedCategory !== 'all' && (
        <div className="mb-6 p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-1">
            {categories.find((c) => c.id === selectedCategory)?.label}
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            {categories.find((c) => c.id === selectedCategory)?.description}
          </p>
        </div>
      )}

      {/* Products Grid */}
      <div className="products-grid">
        {filteredProducts.map((product) => {
          const Icon = product.icon;
          const status = statusConfig[product.status];

          return (
            <div key={product.id} className="integration-card">
              {/* Icon */}
              <div className="card-icon">
                <Icon className="w-6 h-6" />
              </div>

              {/* Category Badge */}
              <span className={`card-category ${categoryColors[product.category]}`}>
                {product.category}
              </span>

              {/* Title */}
              <h3 className="card-title">{product.name}</h3>

              {/* Description */}
              <p className="card-description line-clamp-2">{product.description}</p>

              {/* Status */}
              <div className={`connection-status ${status.className}`}>
                <span className="status-dot rounded-full" />
                <span>{status.label}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-2">
                {product.isExternal ? (
                  <a
                    href={product.launchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`launch-btn flex-1 ${product.status === 'not_configured' ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Launch
                  </a>
                ) : (
                  <Link href={product.launchUrl} className="launch-btn flex-1 text-center">
                    Launch
                  </Link>
                )}
                <Link
                  href={product.configPath}
                  className="enterprise-btn enterprise-btn-secondary flex-1 justify-center"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Configure
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="enterprise-card p-12 text-center">
          <Package className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No products found</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-8 p-4 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-lg">
        <div className="flex flex-wrap gap-6 justify-center text-sm">
          <div className="text-center">
            <div className="font-mono text-xl font-bold text-[var(--accent-cyan)]">{products.length}</div>
            <div className="text-[var(--text-muted)]">Total Products</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-bold text-[var(--status-success)]">
              {products.filter((p) => p.status === 'connected').length}
            </div>
            <div className="text-[var(--text-muted)]">Connected</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-bold text-[var(--status-warning)]">
              {products.filter((p) => p.status === 'not_configured').length}
            </div>
            <div className="text-[var(--text-muted)]">Need Configuration</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-bold text-[var(--status-error)]">
              {products.filter((p) => p.status === 'disconnected').length}
            </div>
            <div className="text-[var(--text-muted)]">Disconnected</div>
          </div>
        </div>
      </div>
    </div>
  );
}
