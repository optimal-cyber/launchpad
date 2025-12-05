'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle, 
  Settings, 
  FileText,
  GitBranch,
  Shield,
  TrendingUp,
  Zap,
  Boxes
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/launchpad',
      icon: LayoutDashboard,
    },
    {
      name: 'Investor View',
      href: '/investor',
      icon: TrendingUp,
      badge: 'NEW',
    },
    {
      name: 'Process Acceleration',
      href: '/acceleration',
      icon: Zap,
      badge: 'DEMO',
    },
    {
      name: 'Enterprise',
      href: '/enterprise',
      icon: LayoutDashboard,
      badge: '5',
    },
    {
      name: 'Module Registry',
      href: '/modules',
      icon: Boxes,
      badge: 'NEW',
    },
    {
      name: 'Security Agents',
      href: '/agents',
      icon: Shield,
      badge: '3',
    },
    {
      name: 'Vulnerabilities',
      href: '/vulnerabilities',
      icon: AlertTriangle,
      badge: '56',
    },
    {
      name: 'SBOM',
      href: '/sbom',
      icon: Package,
      badge: '29',
    },
    {
      name: 'POA&M',
      href: '/poam',
      icon: FileText,
    },
    {
      name: 'OSCAL SSP',
      href: '/oscal',
      icon: Settings,
    }
  ];

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/overview') {
      return pathname === '/overview' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="apollo-sidebar h-full overflow-y-auto">
      {/* Environment Overview */}
      <div className="apollo-filter-section">
        <div className="apollo-card p-4 mb-4">
          <div className="text-sm font-medium text-foreground mb-2">production</div>
          <div className="text-xs text-muted-foreground mb-3">environment</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-400">2 Stale installs</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-400">0 Failed canaries</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <div>Team: Security</div>
              <div>On call: Ryan Gutwein</div>
              <div>Managed: Yes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="apollo-filter-section">
        <div className="flex space-x-1 mb-4">
          <button className="px-3 py-2 text-sm font-medium text-foreground border-b-2 border-primary">
            Event Filters
          </button>
          <button className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Pull Requests
          </button>
        </div>
      </div>

      {/* Event Filters */}
      <div className="apollo-filter-section">
        <div className="apollo-filter-title">Event Filters</div>
        <div className="text-xs text-muted-foreground mb-4">
          Showing 101 events over 3 hours starting from 3 hours ago
        </div>
        
        <div className="space-y-4">
          {/* Category Filter */}
          <div>
            <div className="apollo-filter-title">Category</div>
            <div className="space-y-2">
              <div className="apollo-filter-item">
                <span>Plan</span>
                <span className="apollo-filter-count">48</span>
              </div>
              <div className="apollo-filter-item">
                <span>Monitor</span>
                <span className="apollo-filter-count">46</span>
              </div>
              <div className="apollo-filter-item">
                <span>Adjudication</span>
                <span className="apollo-filter-count">7</span>
              </div>
            </div>
          </div>

          {/* Severity Filter */}
          <div>
            <div className="apollo-filter-title">Severity</div>
            <div className="space-y-2">
              <div className="apollo-filter-item">
                <span>Success</span>
                <span className="apollo-filter-count">52</span>
              </div>
              <div className="apollo-filter-item">
                <span>Info</span>
                <span className="apollo-filter-count">28</span>
              </div>
              <div className="apollo-filter-item">
                <span>Warning</span>
                <span className="apollo-filter-count">18</span>
              </div>
              <div className="apollo-filter-item">
                <span>Error</span>
                <span className="apollo-filter-count">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="apollo-filter-section">
        <div className="apollo-filter-title">Navigation</div>
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${isActive(item.href)
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`h-4 w-4 ${isActive(item.href) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                <span>{item.name}</span>
              </div>
              
              {item.badge && (
                <span className="apollo-badge apollo-badge-info">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
