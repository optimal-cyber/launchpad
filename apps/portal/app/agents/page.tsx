'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Container,
  Cpu,
  HardDrive,
  Network,
  Eye,
  Zap
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

  useEffect(() => {
    loadSecurityAgentsData();
    const interval = setInterval(loadSecurityAgentsData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSecurityAgentsData = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      
      // Load agents
      const agentsResponse = await fetch(`${apiBase}/api/agents`);
      const agentsData = await agentsResponse.json();
      setAgents(agentsData.agents || []);

      // Load scan results
      const scanResponse = await fetch(`${apiBase}/api/scan-results`);
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
    } catch (err) {
      setError('Failed to load security agents data');
      setLoading(false);
    }
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
            <div className="flex items-center space-x-2">
              <div className="apollo-status-indicator apollo-status-healthy"></div>
              <span className="text-sm text-muted-foreground">Agents Active</span>
            </div>
            <button
              onClick={loadSecurityAgentsData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Security Platform Tabs */}
        <div className="apollo-tabs mb-6">
          <button className="apollo-tab apollo-tab-active">Agents</button>
          <button className="apollo-tab">Containers</button>
          <button className="apollo-tab">Scans</button>
          <button className="apollo-tab">Alerts</button>
          <button className="apollo-tab">Compliance</button>
        </div>

        {/* Agent Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {agents.map((agent) => (
            <div key={agent.agent_id} className="apollo-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Security Agent</h3>
                    <p className="text-sm text-muted-foreground">{agent.agent_id}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                  {agent.status}
                </div>
              </div>
              
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
                
                {/* Resource Usage */}
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">CPU Usage</span>
                    <span className="text-foreground font-medium">{agent.resource_usage.cpu_percent.toFixed(1)}%</span>
                  </div>
                  <div className="apollo-progress-bar">
                    <div 
                      className="apollo-progress-fill bg-primary" 
                      style={{ width: `${agent.resource_usage.cpu_percent}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm mb-2 mt-3">
                    <span className="text-muted-foreground">Memory Usage</span>
                    <span className="text-foreground font-medium">{agent.resource_usage.memory_percent.toFixed(1)}%</span>
                  </div>
                  <div className="apollo-progress-bar">
                    <div 
                      className="apollo-progress-fill bg-yellow-500" 
                      style={{ width: `${agent.resource_usage.memory_percent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Container Monitoring */}
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
                        <Container className="h-4 w-4 text-muted-foreground" />
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

        {/* Recent Scan Results */}
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
      </div>
    </div>
  );
}