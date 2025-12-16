'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Fingerprint,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Boxes,
  Cpu,
  HardDrive,
  Network,
  Eye,
  Zap,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Plus,
  Download,
  Settings,
  Shield,
  Database,
  Info,
  Terminal,
  Send
} from 'lucide-react';

interface SecurityAgent {
  agent_id: string;
  agent_type: string;
  status: string;
  last_heartbeat: string;
  containers_monitored: number;
  scans_completed: number;
  scans_failed: number;
  uptime: number;
  resource_usage: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
  };
  // Extended fields
  node_name?: string;
  cluster_name?: string;
  namespace?: string;
  environment?: string;
  capabilities?: string[];
  version?: string;
  registered_at?: string;
  runtime?: string;
}

interface ScanResult {
  scan_id: string;
  agent_id: string;
  container_id: string;
  scan_type: string;
  severity: string;
  findings_count: number;
  timestamp: string;
}

interface ContainerInfo {
  container_id: string;
  name: string;
  image: string;
  status: string;
  memory_usage: number;
  cpu_usage: number;
  network_usage: {
    total_rx_bytes: number;
    total_tx_bytes: number;
  };
  file_system_usage: {
    read_bytes: number;
    write_bytes: number;
  };
}

export default function SecurityAgentsPage() {
  const [agents, setAgents] = useState<SecurityAgent[]>([]);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealData, setIsRealData] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<SecurityAgent | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [activeTab, setActiveTab] = useState('agents');
  const [runningScans, setRunningScans] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSecurityAgentsData();
    const interval = setInterval(loadSecurityAgentsData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSecurityAgentsData = async () => {
    try {
      setError(null);
      setIsRefreshing(true);

      // Load agents - use relative API route
      const agentsResponse = await fetch('/api/agents');
      if (!agentsResponse.ok) {
        throw new Error('Failed to fetch agents');
      }
      const agentsData = await agentsResponse.json();
      setAgents(agentsData.agents || []);

      // Determine if this is real data or demo data
      const hasRealAgents = agentsData.agents?.some((a: SecurityAgent) =>
        a.agent_id && !a.agent_id.startsWith('demo-') && a.registered_at
      );
      setIsRealData(hasRealAgents || false);
      setLastRefresh(new Date());

      // Load scan results - use relative API route
      const scanResponse = await fetch('/api/scan-results');
      if (!scanResponse.ok) {
        throw new Error('Failed to fetch scan results');
      }
      const scanData = await scanResponse.json();
      setScanResults(scanData.scan_results || []);

      // Load containers (mock data for now)
      setContainers([
        {
          container_id: 'abc123def456',
          name: 'optimal-platform-portal-1',
          image: 'optimal-platform-portal:latest',
          status: 'running',
          memory_usage: 256 * 1024 * 1024, // 256MB
          cpu_usage: 15.5,
          network_usage: {
            total_rx_bytes: 1024 * 1024 * 50, // 50MB
            total_tx_bytes: 1024 * 1024 * 25   // 25MB
          },
          file_system_usage: {
            read_bytes: 1024 * 1024 * 10,  // 10MB
            write_bytes: 1024 * 1024 * 5   // 5MB
          }
        },
        {
          container_id: 'def456ghi789',
          name: 'optimal-platform-api-gateway-1',
          image: 'optimal-platform-api-gateway:latest',
          status: 'running',
          memory_usage: 128 * 1024 * 1024, // 128MB
          cpu_usage: 8.2,
          network_usage: {
            total_rx_bytes: 1024 * 1024 * 30, // 30MB
            total_tx_bytes: 1024 * 1024 * 15   // 15MB
          },
          file_system_usage: {
            read_bytes: 1024 * 1024 * 5,   // 5MB
            write_bytes: 1024 * 1024 * 2   // 2MB
          }
        }
      ]);

      setLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      setError('Failed to load security agents data');
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const triggerScan = async (agentId: string) => {
    setRunningScans(prev => new Set(prev).add(agentId));
    // Simulate scan
    setTimeout(() => {
      setRunningScans(prev => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
      // Add new scan result
      const newScan: ScanResult = {
        scan_id: `scan-${Date.now()}`,
        agent_id: agentId,
        container_id: 'all-containers',
        scan_type: 'vulnerability',
        severity: 'low',
        findings_count: Math.floor(Math.random() * 10),
        timestamp: new Date().toISOString()
      };
      setScanResults(prev => [newScan, ...prev].slice(0, 10));
    }, 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'unhealthy': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-900/20';
      case 'high': return 'text-orange-500 bg-orange-900/20';
      case 'medium': return 'text-yellow-500 bg-yellow-900/20';
      case 'low': return 'text-blue-500 bg-blue-900/20';
      default: return 'text-gray-500 bg-gray-900/20';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Security Agents Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Security Platform Header */}
      <div className="apollo-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Security Agents Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time container security monitoring and scanning</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Data Source Indicator */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
              isRealData
                ? 'bg-green-900/20 border-green-700 text-green-400'
                : 'bg-yellow-900/20 border-yellow-700 text-yellow-400'
            }`}>
              <Database className="h-4 w-4" />
              <span className="text-xs font-medium">
                {isRealData ? 'Live Data' : 'Demo Data'}
              </span>
              {!isRealData && (
                <span title="Deploy agents to see real data">
                  <Info className="h-3 w-3 cursor-help" />
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updated: {lastRefresh.toLocaleTimeString()}</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${agents.filter(a => a.status === 'healthy').length > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-muted-foreground">{agents.filter(a => a.status === 'healthy').length} Active</span>
            </div>

            <button
              onClick={() => setShowDeployModal(true)}
              className="inline-flex items-center px-3 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted"
            >
              <Plus className="h-4 w-4 mr-2" />
              Deploy Agent
            </button>

            <button
              onClick={loadSecurityAgentsData}
              disabled={isRefreshing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Demo Data Banner */}
      {!isRealData && (
        <div className="bg-yellow-900/20 border-b border-yellow-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-300">Viewing Demo Data</p>
                <p className="text-xs text-yellow-400/80">Deploy security agents to your Kubernetes clusters to see real-time data</p>
              </div>
            </div>
            <button
              onClick={() => setShowDeployModal(true)}
              className="inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
            >
              <Terminal className="h-4 w-4 mr-2" />
              Get Started
            </button>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Security Platform Tabs */}
        <div className="apollo-tabs mb-6">
          <button
            className={`apollo-tab ${activeTab === 'agents' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            Agents ({agents.length})
          </button>
          <button
            className={`apollo-tab ${activeTab === 'containers' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('containers')}
          >
            Containers ({containers.length})
          </button>
          <button
            className={`apollo-tab ${activeTab === 'scans' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('scans')}
          >
            Scans ({scanResults.length})
          </button>
        </div>

        {/* Agent Status Cards */}
        {activeTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {agents.map((agent) => (
            <div key={agent.agent_id} className="apollo-card p-6 hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${agent.status === 'healthy' ? 'bg-green-500/20' : agent.status === 'degraded' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                    <Fingerprint className={`h-6 w-6 ${agent.status === 'healthy' ? 'text-green-400' : agent.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {agent.node_name || 'Security Agent'}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">{agent.agent_id.substring(0, 16)}...</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  agent.status === 'healthy' ? 'text-green-400 bg-green-900/20 border-green-700' :
                  agent.status === 'degraded' ? 'text-yellow-400 bg-yellow-900/20 border-yellow-700' :
                  'text-red-400 bg-red-900/20 border-red-700'
                }`}>
                  {agent.status}
                </div>
              </div>

              {/* Cluster/Environment Info */}
              {(agent.cluster_name || agent.environment) && (
                <div className="flex gap-2 mb-3">
                  {agent.cluster_name && (
                    <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                      {agent.cluster_name}
                    </span>
                  )}
                  {agent.environment && (
                    <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded">
                      {agent.environment}
                    </span>
                  )}
                  {agent.runtime && (
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      {agent.runtime}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Containers Monitored</span>
                  <span className="text-foreground font-medium">{agent.containers_monitored}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Scans Completed</span>
                  <span className="text-foreground font-medium">{agent.scans_completed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="text-foreground font-medium">{formatUptime(agent.uptime)}</span>
                </div>

                {/* Capabilities */}
                {agent.capabilities && agent.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.map((cap: string) => (
                      <span key={cap} className="text-xs bg-green-900/20 text-green-400 px-2 py-0.5 rounded">
                        {cap.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}

                {/* Resource Usage */}
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">CPU Usage</span>
                    <span className="text-foreground font-medium">{agent.resource_usage.cpu_percent.toFixed(1)}%</span>
                  </div>
                  <div className="apollo-progress-bar">
                    <div
                      className="apollo-progress-fill bg-primary"
                      style={{ width: `${Math.min(agent.resource_usage.cpu_percent, 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-sm mb-2 mt-3">
                    <span className="text-muted-foreground">Memory Usage</span>
                    <span className="text-foreground font-medium">{agent.resource_usage.memory_percent.toFixed(1)}%</span>
                  </div>
                  <div className="apollo-progress-bar">
                    <div
                      className="apollo-progress-fill bg-yellow-500"
                      style={{ width: `${Math.min(agent.resource_usage.memory_percent, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Version */}
                {agent.version && (
                  <div className="text-xs text-muted-foreground text-right">
                    v{agent.version}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-border flex items-center justify-between mt-3">
                  <button
                    onClick={() => triggerScan(agent.agent_id)}
                    disabled={runningScans.has(agent.agent_id)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
                  >
                    {runningScans.has(agent.agent_id) ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1.5" />
                        Run Scan
                      </>
                    )}
                  </button>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setSelectedAgent(agent);
                        setShowAgentModal(true);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
                      title="Terminal"
                    >
                      <Terminal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Container Monitoring */}
        {activeTab === 'containers' && (
        <div className="apollo-card mb-8">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">Container Monitoring</h3>
            <p className="text-sm text-muted-foreground">Real-time container security and performance monitoring</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="apollo-table">
              <thead>
                <tr>
                  <th>Container</th>
                  <th>Image</th>
                  <th>Status</th>
                  <th>Memory</th>
                  <th>CPU</th>
                  <th>Network</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {containers.map((container) => (
                  <tr key={container.container_id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium text-foreground">{container.name}</div>
                          <div className="text-xs text-muted-foreground">{container.container_id.substring(0, 12)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-foreground">{container.image}</div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        container.status === 'running' ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'
                      }`}>
                        {container.status}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm text-foreground">{formatBytes(container.memory_usage)}</div>
                    </td>
                    <td>
                      <div className="text-sm text-foreground">{container.cpu_usage.toFixed(1)}%</div>
                    </td>
                    <td>
                      <div className="text-sm text-foreground">
                        <div>↓ {formatBytes(container.network_usage.total_rx_bytes)}</div>
                        <div>↑ {formatBytes(container.network_usage.total_tx_bytes)}</div>
                      </div>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button className="text-primary hover:text-primary/80 text-sm">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-yellow-500 hover:text-yellow-400 text-sm">
                          <Zap className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Recent Scan Results */}
        {activeTab === 'scans' && (
        <div className="apollo-card">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">Recent Scan Results</h3>
            <p className="text-sm text-muted-foreground">Latest security scan findings and alerts</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="apollo-table">
              <thead>
                <tr>
                  <th>Scan ID</th>
                  <th>Agent</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Findings</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scanResults.map((result) => (
                  <tr key={result.scan_id}>
                    <td>
                      <div className="text-sm font-medium text-foreground">{result.scan_id.substring(0, 16)}...</div>
                    </td>
                    <td>
                      <div className="text-sm text-foreground">{result.agent_id.substring(0, 16)}...</div>
                    </td>
                    <td>
                      <div className="text-sm text-foreground capitalize">{result.scan_type}</div>
                    </td>
                    <td>
                      <span className={`apollo-badge ${getSeverityColor(result.severity)}`}>
                        {result.severity}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm text-foreground">{result.findings_count}</div>
                    </td>
                    <td>
                      <div className="text-sm text-muted-foreground">
                        {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-foreground">Completed</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* Agent Details Modal */}
      {showAgentModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${selectedAgent.status === 'healthy' ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                    <Fingerprint className={`h-6 w-6 ${selectedAgent.status === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedAgent.node_name || 'Security Agent'}</h3>
                    <p className="text-sm text-gray-400 font-mono">{selectedAgent.agent_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAgentModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <span className="text-xs text-gray-500 uppercase">Status</span>
                  <p className={`text-lg font-medium ${selectedAgent.status === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {selectedAgent.status}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <span className="text-xs text-gray-500 uppercase">Uptime</span>
                  <p className="text-lg font-medium text-white">{formatUptime(selectedAgent.uptime)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <span className="text-xs text-gray-500 uppercase">Containers Monitored</span>
                  <p className="text-lg font-medium text-white">{selectedAgent.containers_monitored}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <span className="text-xs text-gray-500 uppercase">Scans Completed</span>
                  <p className="text-lg font-medium text-white">{selectedAgent.scans_completed}</p>
                </div>
              </div>

              {/* Environment Info */}
              {(selectedAgent.cluster_name || selectedAgent.environment) && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Environment</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.cluster_name && (
                      <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded text-sm">
                        Cluster: {selectedAgent.cluster_name}
                      </span>
                    )}
                    {selectedAgent.environment && (
                      <span className="px-3 py-1 bg-purple-900/30 text-purple-400 rounded text-sm">
                        Env: {selectedAgent.environment}
                      </span>
                    )}
                    {selectedAgent.namespace && (
                      <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                        Namespace: {selectedAgent.namespace}
                      </span>
                    )}
                    {selectedAgent.runtime && (
                      <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                        Runtime: {selectedAgent.runtime}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Resource Usage */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">Resource Usage</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">CPU</span>
                      <span className="text-white">{selectedAgent.resource_usage.cpu_percent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${selectedAgent.resource_usage.cpu_percent}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Memory</span>
                      <span className="text-white">{selectedAgent.resource_usage.memory_percent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500" style={{ width: `${selectedAgent.resource_usage.memory_percent}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Disk</span>
                      <span className="text-white">{selectedAgent.resource_usage.disk_percent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${selectedAgent.resource_usage.disk_percent}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowAgentModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    triggerScan(selectedAgent.agent_id);
                    setShowAgentModal(false);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Agent Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">Deploy Security Agent</h3>
                  <p className="text-sm text-gray-400">Install the Optimal security agent in your Kubernetes cluster</p>
                </div>
                <button
                  onClick={() => setShowDeployModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-300">
                      The Optimal Security Agent runs as a DaemonSet in your Kubernetes cluster, providing real-time container security monitoring, vulnerability scanning, and SBOM generation.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Installation Steps</h4>
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">1. Add the Helm repository:</p>
                    <pre className="bg-gray-900 p-3 rounded text-sm text-green-400 font-mono overflow-x-auto">
                      helm repo add optimal https://charts.optimal-platform.io
                    </pre>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">2. Install the agent with your API key:</p>
                    <pre className="bg-gray-900 p-3 rounded text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
{`helm install optimal-agent optimal/security-agent \\
  --namespace optimal-system --create-namespace \\
  --set apiKey=YOUR_API_KEY \\
  --set clusterName=my-cluster`}
                    </pre>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">3. Verify installation:</p>
                    <pre className="bg-gray-900 p-3 rounded text-sm text-green-400 font-mono overflow-x-auto">
                      kubectl get pods -n optimal-system
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-2">Your API Key</h4>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-sm text-gray-300 font-mono">
                    opt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                  </code>
                  <button className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm">
                    Copy
                  </button>
                  <button className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm">
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Download YAML
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}