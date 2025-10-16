'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SBOMComponent {
  id: string;
  name: string;
  version: string;
  type: string;
  purl: string;
  license: string;
  description: string;
  vulnerabilities: number;
  risk_level: string;
  last_updated: string;
}

interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  last_scan: {
    total_scans: number;
    vulnerabilities_count: number;
    secrets_count: number;
    timestamp: string;
  };
}

export default function SBOMPage() {
  const [components, setComponents] = useState<SBOMComponent[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<SBOMComponent[]>([]);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    id: '65646370',
    name: 'flask-container-test',
    path: 'r.gutwein/flask-container-test',
    last_scan: {
      total_scans: 3,
      vulnerabilities_count: 24,
      secrets_count: 0,
      timestamp: '2025-08-18T15:46:56'
    }
  });
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedComponent, setSelectedComponent] = useState<SBOMComponent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadSBOMComponents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [components, searchTerm, typeFilter, riskFilter]);

  const loadSBOMComponents = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      console.log('Loading SBOM components from:', `${apiBase}/api/sboms`);
      const response = await fetch(`${apiBase}/api/sboms`);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.components && Array.isArray(data.components)) {
        setComponents(data.components);
      }
      
      if (data.scan_results && data.scan_results.projects && data.scan_results.projects.length > 0) {
        const project = data.scan_results.projects[0];
        setProjectInfo(prev => ({
          ...prev,
          last_scan: {
            total_scans: data.scan_results.total_scans || 0,
            vulnerabilities_count: data.scan_results.projects.reduce((acc: number, p: any) => 
              acc + (p.scans?.reduce((sacc: number, s: any) => sacc + (s.vulnerabilities_found || 0), 0) || 0), 0),
            secrets_count: data.scan_results.projects.reduce((acc: number, p: any) => 
              acc + (p.scans?.reduce((sacc: number, s: any) => sacc + (s.secrets_found || 0), 0) || 0), 0),
            timestamp: data.scan_results.last_scan || new Date().toISOString()
          }
        }));
      }
    } catch (error) {
      console.error('Error loading SBOM components:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = components;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(component => 
        component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.version.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(component => component.type.toLowerCase() === typeFilter.toLowerCase());
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(component => component.risk_level.toLowerCase() === riskFilter.toLowerCase());
    }

    setFilteredComponents(filtered);
  };

  const handleViewComponent = (component: SBOMComponent) => {
    setSelectedComponent(component);
    setShowDetailsModal(true);
  };

  const handleUpdateComponent = (component: SBOMComponent) => {
    // Open update modal or navigate to update page
    alert(`Update workflow initiated for ${component.name} ${component.version}`);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getUniqueTypes = () => {
    const types = Array.from(new Set(components.map(c => c.type)));
    return types;
  };

  const getUniqueRiskLevels = () => {
    const riskLevels = Array.from(new Set(components.map(c => c.risk_level)));
    return riskLevels;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Software Bill of Materials</h1>
              <p className="text-sm text-gray-600">Track and manage software components</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadSBOMComponents}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Scan Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{projectInfo.last_scan.total_scans}</div>
              <div className="text-sm text-gray-600">Total Scans</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{projectInfo.last_scan.vulnerabilities_count}</div>
              <div className="text-sm text-gray-600">Vulnerabilities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{projectInfo.last_scan.secrets_count}</div>
              <div className="text-sm text-gray-600">Secrets Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatDate(projectInfo.last_scan.timestamp)}</div>
              <div className="text-sm text-gray-600">Last Scan</div>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{projectInfo.name}</h3>
              <p className="text-sm text-gray-600">{projectInfo.path}</p>
            </div>
            <Link
              href={`https://gitlab.com/${projectInfo.path}`}
              target="_blank"
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View in GitLab
            </Link>
          </div>
        </div>

        {/* Software Components Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{components.length}</div>
              <div className="text-sm text-gray-600">Total Components</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{components.filter(c => c.type === 'package').length}</div>
              <div className="text-sm text-gray-600">Packages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{components.filter(c => c.type === 'library').length}</div>
              <div className="text-sm text-gray-600">Libraries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{components.reduce((acc, c) => acc + c.vulnerabilities, 0)}</div>
              <div className="text-sm text-gray-600">Security Risks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{components.filter(c => c.vulnerabilities === 0).length}</div>
              <div className="text-sm text-gray-600">Up to Date</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{formatDate(projectInfo.last_scan.timestamp)}</div>
              <div className="text-sm text-gray-600">Last Updated</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {getUniqueTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            {/* Risk Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Risk Levels</option>
                {getUniqueRiskLevels().map(risk => (
                  <option key={risk} value={risk}>{risk}</option>
                ))}
              </select>
            </div>
            
            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {filteredComponents.length} of {components.length} components
              </div>
            </div>
          </div>
        </div>

        {/* Components Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Software Components ({filteredComponents.length})
              </h3>
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
          
          {filteredComponents.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No SBOM components found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Component
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredComponents.map((component) => (
                    <tr key={component.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{component.name}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{component.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {component.version}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {component.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{component.license}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getRiskLevelColor(component.risk_level)}`}>
                          {component.risk_level}
                        </span>
                        {component.vulnerabilities > 0 && (
                          <div className="text-xs text-gray-500 mt-1">{component.vulnerabilities} vulnerabilities</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewComponent(component)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium cursor-pointer"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleUpdateComponent(component)}
                            className="text-green-600 hover:text-green-900 text-sm font-medium cursor-pointer"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Component Details Modal */}
      {showDetailsModal && selectedComponent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Component Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedComponent.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Version</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedComponent.version}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedComponent.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {selectedComponent.type}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getRiskLevelColor(selectedComponent.risk_level)}`}>
                      {selectedComponent.risk_level}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedComponent.license}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vulnerabilities</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedComponent.vulnerabilities}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">PURL</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedComponent.purl}</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => handleUpdateComponent(selectedComponent)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Update
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
