'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Settings } from 'lucide-react';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('Optimal Corp');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [selectedEnv, setSelectedEnv] = useState('Production');

  // Global search shortcut (⌘/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        // Focus search input
        const searchInput = document.getElementById('global-search');
        if (searchInput) searchInput.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement global search across CVE/project/component/job
    console.log('Searching for:', query);
  };

  const handleOrgChange = (org: string) => {
    setSelectedOrg(org);
    // TODO: Implement org switching
  };

  const handleProjectChange = (project: string) => {
    setSelectedProject(project);
    // TODO: Implement project switching
  };

  const handleEnvChange = (env: string) => {
    setSelectedEnv(env);
    // TODO: Implement environment switching
  };

  return (
    <header className="apollo-header sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">O</span>
            </div>
            <span className="text-xl font-semibold text-foreground">Optimal Platform</span>
          </div>
          
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>All deployments</span>
            <span>›</span>
            <span className="text-foreground">production</span>
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              id="global-search"
              type="text"
              placeholder="Search (+ K)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Right: Actions & User */}
        <div className="flex items-center space-x-4">
          {/* Status Indicators */}
          <div className="flex items-center space-x-2">
            <div className="apollo-status-indicator apollo-status-healthy"></div>
            <span className="text-sm text-muted-foreground">GitLab Connected</span>
          </div>

          {/* Settings */}
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="h-5 w-5" />
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-foreground">RG</span>
            </div>
            <span className="text-sm text-foreground">Ryan Gutwein</span>
          </div>
        </div>
      </div>
    </header>
  );
}
