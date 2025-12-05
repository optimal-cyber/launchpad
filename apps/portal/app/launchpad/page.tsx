'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink, Shield, BarChart3, Lock, GitBranch,
  MessageSquare, Archive, TrendingUp, FileText, Waypoints,
  Brain, Zap, Target, AlertTriangle, Package, Radio,
  ChevronRight, ArrowRight
} from 'lucide-react';

interface ProductCard {
  id: string;
  name: string;
  icon: any;
  description: string;
  category: string;
  href: string;
  status: 'active' | 'coming_soon' | 'beta';
  isInternal: boolean;
  metrics?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
  };
}

export default function LaunchPadPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const products: ProductCard[] = [
    {
      id: 'command-center',
      name: 'Command Center',
      icon: Target,
      description: 'Real-time security monitoring and alerting across all environments',
      category: 'Security',
      href: '/command-center',
      status: 'active',
      isInternal: true,
      metrics: { label: 'Active Alerts', value: '7', trend: 'up' }
    },
    {
      id: 'hub',
      name: 'Optimal Hub',
      icon: Waypoints,
      description: 'Centralized project management and deployment tracking',
      category: 'Management',
      href: '/hub',
      status: 'active',
      isInternal: true,
      metrics: { label: 'Environments', value: '4' }
    },
    {
      id: 'vulnerabilities',
      name: 'Vulnerability Management',
      icon: AlertTriangle,
      description: 'Track and remediate CVEs across your software supply chain',
      category: 'Security',
      href: '/vulnerabilities',
      status: 'active',
      isInternal: true,
      metrics: { label: 'Open CVEs', value: '275', trend: 'down' }
    },
    {
      id: 'sbom',
      name: 'SBOM Manager',
      icon: Package,
      description: 'Software Bill of Materials generation and analysis',
      category: 'Compliance',
      href: '/sbom',
      status: 'active',
      isInternal: true,
      metrics: { label: 'Components', value: '1,243' }
    },
    {
      id: 'agents',
      name: 'Security Agents',
      icon: Radio,
      description: 'Deploy and manage scanning agents across your infrastructure',
      category: 'Security',
      href: '/agents',
      status: 'active',
      isInternal: true,
      metrics: { label: 'Active', value: '6' }
    },
    {
      id: 'ai-security',
      name: 'AI Security',
      icon: Brain,
      description: 'AI/ML model security with OWASP AISVS and NIST AI RMF',
      category: 'Security',
      href: '/ai-security',
      status: 'beta',
      isInternal: true
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      icon: GitBranch,
      description: 'Source code management and CI/CD pipelines',
      category: 'Development',
      href: '/services/gitlab',
      status: 'active',
      isInternal: false
    },
    {
      id: 'harbor',
      name: 'Harbor',
      icon: Archive,
      description: 'Secure container registry and image scanning',
      category: 'Development',
      href: '/services/harbor',
      status: 'active',
      isInternal: false
    },
    {
      id: 'grafana',
      name: 'Observability',
      icon: BarChart3,
      description: 'Metrics, logs, and distributed tracing',
      category: 'Operations',
      href: '/services/grafana',
      status: 'active',
      isInternal: false
    },
    {
      id: 'vault',
      name: 'Secrets Management',
      icon: Lock,
      description: 'Centralized secrets and encryption key management',
      category: 'Security',
      href: '/services/vault',
      status: 'coming_soon',
      isInternal: false
    }
  ];

  const categories = ['all', 'Security', 'Compliance', 'Management', 'Development', 'Operations'];

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return null;
      case 'beta':
        return <span className="status-badge info">BETA</span>;
      case 'coming_soon':
        return <span className="status-badge neutral">COMING SOON</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Hero Section */}
      <div className="border-b border-[var(--border-subtle)]">
        <div className="px-8 py-10">
          <div className="max-w-4xl">
            <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-3">
              Welcome back, Ryan
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Your DevSecOps platform is monitoring <span className="text-[var(--accent-cyan)] font-mono">47 assets</span> across 
              <span className="text-[var(--accent-cyan)] font-mono"> 4 environments</span>
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8 max-w-4xl">
            <Link href="/command-center" className="metric-card group">
              <div className="flex items-center justify-between">
                <div className="metric-label">Risk Score</div>
                <ChevronRight className="w-4 h-4 text-[var(--text-subtle)] group-hover:text-[var(--accent-cyan)] transition-colors" />
              </div>
              <div className="metric-value text-[var(--accent-cyan)]">72</div>
              <div className="text-xs text-[var(--status-success)] flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                -8 from last week
              </div>
            </Link>
            <Link href="/vulnerabilities" className="metric-card critical group">
              <div className="flex items-center justify-between">
                <div className="metric-label">Critical CVEs</div>
                <ChevronRight className="w-4 h-4 text-[var(--text-subtle)] group-hover:text-[var(--accent-cyan)] transition-colors" />
              </div>
              <div className="metric-value text-red-400">7</div>
              <div className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" />
                Requires attention
              </div>
            </Link>
            <Link href="/sbom" className="metric-card group">
              <div className="flex items-center justify-between">
                <div className="metric-label">Components</div>
                <ChevronRight className="w-4 h-4 text-[var(--text-subtle)] group-hover:text-[var(--accent-cyan)] transition-colors" />
              </div>
              <div className="metric-value">1,243</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Across all projects</div>
            </Link>
            <Link href="/agents" className="metric-card group">
              <div className="flex items-center justify-between">
                <div className="metric-label">Agents</div>
                <ChevronRight className="w-4 h-4 text-[var(--text-subtle)] group-hover:text-[var(--accent-cyan)] transition-colors" />
              </div>
              <div className="metric-value text-[var(--status-success)]">6</div>
              <div className="text-xs text-[var(--status-success)] mt-1">All healthy</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-8 py-8">
        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`enterprise-btn ${
                activeCategory === cat 
                  ? 'enterprise-btn-primary' 
                  : 'enterprise-btn-ghost'
              }`}
            >
              {cat === 'all' ? 'All Products' : cat}
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const Icon = product.icon;
            const isDisabled = product.status === 'coming_soon';
            
            const CardContent = (
              <div className={`enterprise-card h-full p-5 group ${isDisabled ? 'opacity-60' : 'cursor-pointer'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-lg ${
                    product.category === 'Security' ? 'bg-red-500/10 text-red-400' :
                    product.category === 'Compliance' ? 'bg-blue-500/10 text-blue-400' :
                    product.category === 'Management' ? 'bg-purple-500/10 text-purple-400' :
                    product.category === 'Development' ? 'bg-green-500/10 text-green-400' :
                    'bg-[var(--bg-active)] text-[var(--text-muted)]'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {getStatusBadge(product.status)}
                </div>
                
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-cyan)] transition-colors">
                  {product.name}
                </h3>
                
                <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">
                  {product.description}
                </p>
                
                {product.metrics && (
                  <div className="mt-auto pt-4 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">{product.metrics.label}</span>
                      <span className={`text-sm font-mono font-semibold ${
                        product.metrics.trend === 'up' ? 'text-red-400' :
                        product.metrics.trend === 'down' ? 'text-green-400' :
                        'text-[var(--text-primary)]'
                      }`}>
                        {product.metrics.value}
                      </span>
                    </div>
                  </div>
                )}
                
                {!product.metrics && (
                  <div className="mt-auto pt-4 flex items-center text-xs text-[var(--accent-cyan)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                )}
              </div>
            );

            if (isDisabled) {
              return <div key={product.id}>{CardContent}</div>;
            }

            return (
              <Link key={product.id} href={product.href}>
                {CardContent}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-8 py-8 border-t border-[var(--border-subtle)]">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
        <div className="flex gap-3">
          <Link href="/onboarding" className="enterprise-btn enterprise-btn-primary">
            <Zap className="w-4 h-4" />
            Connect New Scanner
          </Link>
          <Link href="/vulnerabilities" className="enterprise-btn enterprise-btn-secondary">
            <AlertTriangle className="w-4 h-4" />
            Review Critical CVEs
          </Link>
          <Link href="/sbom" className="enterprise-btn enterprise-btn-secondary">
            <Package className="w-4 h-4" />
            Generate SBOM Report
          </Link>
        </div>
      </div>
    </div>
  );
}
