"use client";

import { useState } from "react";
import { 
  GitBranch, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Download,
  AlertTriangle,
  Settings,
  RefreshCw,
  Play,
  Eye
} from "lucide-react";

interface GitLabJob {
  id: string;
  name: string;
  status: string;
  pipeline_id: string;
  created_at: string;
  duration: number;
}

export default function GitLabServicesPage() {
  const [selectedJobId, setSelectedJobId] = useState("");
  const [ingestionResult, setIngestionResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  // Mock GitLab jobs from your pipeline
  const gitlabJobs: GitLabJob[] = [
    { 
      id: "10911221650", 
      name: "sbom syft", 
      status: "success", 
      pipeline_id: "1060221298",
      created_at: "2024-01-15T10:30:00Z",
      duration: 45
    },
    { 
      id: "10911221849", 
      name: "container_scanning", 
      status: "success", 
      pipeline_id: "1960221388",
      created_at: "2024-01-15T09:15:00Z",
      duration: 120
    },
    { 
      id: "10911221648", 
      name: "aast", 
      status: "success", 
      pipeline_id: "1966221388",
      created_at: "2024-01-15T08:45:00Z",
      duration: 30
    },
    { 
      id: "10911221642", 
      name: "build", 
      status: "success", 
      pipeline_id: "1966221398",
      created_at: "2024-01-15T08:00:00Z",
      duration: 180
    }
  ];

  const triggerGitLabIngestion = async () => {
    if (!selectedJobId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/gitlab/test/fetch?job_id=${selectedJobId}`);
      const result = await response.json();
      setIngestionResult(result);
    } catch (error) {
      console.error("Error triggering GitLab ingestion:", error);
      setIngestionResult({ error: "Failed to trigger ingestion" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">GitLab Integration</h1>
          <p className="text-muted">Configure and manage GitLab CI/CD pipeline integration</p>
        </div>
        <button
          onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
          className="inline-flex items-center px-4 py-2 bg-gray-700 text-text font-medium rounded-lg hover:bg-gray-600 transition-colors"
        >
          <Settings className="h-4 w-4 mr-2" />
          {showAdvancedConfig ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      {/* Configuration Card */}
      <div className="bg-card rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold text-text mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              GitLab Base URL
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value="https://gitlab.com"
                disabled
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-text"
              />
              <span className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-green-100 text-green-800 border border-green-200">
                <CheckCircle className="h-4 w-4 mr-2" />
                ACTIVE
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Project ID
            </label>
            <input
              type="text"
              value="65646370"
              disabled
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-text"
            />
          </div>

          {showAdvancedConfig && (
            <>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Last Sync
                </label>
                <div className="flex items-center space-x-2 text-sm text-text">
                  <Clock className="h-4 w-4 text-muted" />
                  <span>8/12/2025, 10:25:16 AM</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Integration Health
                </label>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-text">Connected and healthy</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Manual Artifact Ingestion Card */}
      <div className="bg-card rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold text-text mb-4">Manual Artifact Ingestion</h2>
        <p className="text-muted mb-4">
          Select a GitLab job to manually trigger artifact ingestion for testing purposes.
        </p>
        
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted mb-2">
              Select GitLab Job
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Choose a job...</option>
              {gitlabJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  #{job.id} - {job.name} ({job.pipeline_id})
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={triggerGitLabIngestion}
            disabled={!selectedJobId || loading}
            className={`inline-flex items-center px-6 py-2 font-medium rounded-lg transition-colors ${
              !selectedJobId || loading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-accent text-card hover:bg-accent/90'
            }`}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Ingesting...' : '+ Ingest from GitLab'}
          </button>
        </div>

        {ingestionResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            ingestionResult.error 
              ? 'bg-red-100 text-red-800 border border-red-200' 
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}>
            <div className="flex items-center">
              {ingestionResult.error ? (
                <AlertTriangle className="h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm font-medium">
                {ingestionResult.error || 'Ingestion completed successfully!'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Pipeline Information Card */}
      <div className="bg-card rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-text">Recent Pipeline Information</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  Job ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  Job Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  Pipeline ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {gitlabJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-text font-mono">#{job.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <GitBranch className="h-4 w-4 text-muted" />
                      <span className="text-sm text-text">{job.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted font-mono">#{job.pipeline_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted">{formatDuration(job.duration)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted">
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button className="text-accent hover:text-accent/80 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-accent hover:text-accent/80 transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                      <a
                        href={`https://gitlab.com/optimal-platform/optimal-platform/-/jobs/${job.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accent/80 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold text-text mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-6 w-6 text-accent" />
              <div>
                <h3 className="font-medium text-text">Sync Now</h3>
                <p className="text-sm text-muted">Force immediate sync with GitLab</p>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left">
            <div className="flex items-center space-x-3">
              <Download className="h-6 w-6 text-accent" />
              <div>
                <h3 className="font-medium text-text">Export Config</h3>
                <p className="text-sm text-muted">Download current configuration</p>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-accent" />
              <div>
                <h3 className="font-medium text-text">Advanced Settings</h3>
                <p className="text-sm text-muted">Configure webhooks and tokens</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
