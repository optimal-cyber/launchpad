'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search, Bell, Settings, User, ChevronDown,
  LayoutDashboard, Shield, AlertTriangle, Package,
  FileText, GitBranch, Activity, Server, Zap, 
  Eye, Terminal, Lock, HelpCircle, LogOut,
  Radio, Box, Layers, Target, Compass
} from 'lucide-react';

interface EnterpriseLayoutProps {
  children: React.ReactNode;
}

const mainNavItems = [
  { name: 'Command Center', href: '/command-center', icon: Target },
  { name: 'Hub', href: '/hub', icon: Layers },
  { name: 'Vulnerabilities', href: '/vulnerabilities', icon: AlertTriangle, badge: 275 },
  { name: 'SBOM', href: '/sbom', icon: Package, badge: 1243 },
  { name: 'Agents', href: '/agents', icon: Radio, badge: 6 },
];

const secondaryNavItems = [
  { name: 'OSCAL SSP', href: '/oscal', icon: FileText },
  { name: 'POA&M', href: '/poam', icon: Shield },
  { name: 'Authorization', href: '/authorization', icon: Lock },
  { name: 'Diagrams', href: '/diagrams', icon: Box },
];

const serviceNavItems = [
  { name: 'GitLab', href: '/services/gitlab', icon: GitBranch, status: 'healthy' },
  { name: 'Harbor', href: '/services/harbor', icon: Server, status: 'healthy' },
  { name: 'Confluence', href: '/services/confluence', icon: FileText, status: 'warning' },
];

export default function EnterpriseLayout({ children }: EnterpriseLayoutProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Command palette shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Top Bar */}
      <header className="enterprise-topbar">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/command-center" className="enterprise-logo">
            <div className="enterprise-logo-mark">O</div>
            <span>OPTIMAL</span>
          </Link>

          {/* Environment Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-surface)] rounded-md border border-[var(--border-subtle)]">
            <span className="status-dot healthy"></span>
            <span className="text-xs font-medium text-[var(--text-primary)]">Production</span>
            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="enterprise-search">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search vulnerabilities, assets, CVEs... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={() => setIsCommandPaletteOpen(true)}
              className="enterprise-input text-sm"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* System Status */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Activity className="w-3 h-3 text-[var(--status-success)]" />
            <span>All Systems Operational</span>
          </div>

          {/* Time */}
          <div className="text-xs font-mono text-[var(--text-muted)]">
            {currentTime.toLocaleTimeString('en-US', { hour12: false })} UTC
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--status-error)] rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <Settings className="w-4 h-4" />
          </button>

          {/* User */}
          <div className="flex items-center gap-2 pl-4 border-l border-[var(--border-subtle)]">
            <div className="w-7 h-7 bg-[var(--accent-cyan)] rounded-md flex items-center justify-center text-xs font-semibold text-[var(--bg-void)]">
              RG
            </div>
            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="enterprise-sidebar">
          {/* Main Navigation */}
          <div className="enterprise-nav-section">
            <div className="enterprise-nav-label">Main</div>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`enterprise-nav-item ${isActive(item.href) ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="badge">{item.badge.toLocaleString()}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Compliance */}
          <div className="enterprise-nav-section">
            <div className="enterprise-nav-label">Compliance</div>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`enterprise-nav-item ${isActive(item.href) ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Integrations */}
          <div className="enterprise-nav-section">
            <div className="enterprise-nav-label">Integrations</div>
            {serviceNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`enterprise-nav-item ${isActive(item.href) ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  <span className={`status-dot ${item.status}`}></span>
                </Link>
              );
            })}
          </div>

          {/* Bottom Section */}
          <div className="mt-auto enterprise-nav-section border-t border-[var(--border-subtle)]">
            <Link href="/onboarding" className="enterprise-nav-item">
              <Zap className="w-4 h-4" />
              <span>Quick Start</span>
            </Link>
            <Link href="/settings" className="enterprise-nav-item">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
            <a 
              href="https://docs.gooptimal.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="enterprise-nav-item"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Documentation</span>
            </a>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-48px)] overflow-auto">
          {children}
        </main>
      </div>

      {/* Command Palette Modal */}
      {isCommandPaletteOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          <div 
            className="command-palette animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
              <Search className="w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search for anything..."
                className="command-palette-input"
                autoFocus
              />
              <kbd className="text-xs px-2 py-1 bg-[var(--bg-active)] rounded text-[var(--text-muted)]">
                ESC
              </kbd>
            </div>
            <div className="command-palette-results">
              <div className="p-2">
                <div className="enterprise-nav-label px-3 py-2">Quick Actions</div>
                <div className="command-palette-item">
                  <Search className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Search CVEs...</span>
                  <kbd className="ml-auto text-xs px-2 py-0.5 bg-[var(--bg-active)] rounded text-[var(--text-muted)]">/cve</kbd>
                </div>
                <div className="command-palette-item">
                  <Shield className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-secondary)]">View Vulnerabilities</span>
                  <kbd className="ml-auto text-xs px-2 py-0.5 bg-[var(--bg-active)] rounded text-[var(--text-muted)]">G V</kbd>
                </div>
                <div className="command-palette-item">
                  <Package className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-secondary)]">View SBOM</span>
                  <kbd className="ml-auto text-xs px-2 py-0.5 bg-[var(--bg-active)] rounded text-[var(--text-muted)]">G S</kbd>
                </div>
                <div className="command-palette-item">
                  <Target className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Command Center</span>
                  <kbd className="ml-auto text-xs px-2 py-0.5 bg-[var(--bg-active)] rounded text-[var(--text-muted)]">G C</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

