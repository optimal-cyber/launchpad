"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  Settings,
  RefreshCw,
  Play,
  Download,
  ExternalLink,
  Target,
  Activity
} from "lucide-react";

interface ScanResult {
  id: string;
  name: string;
  status: string;
  severity: string;
  host: string;
  plugin_id: string;
  discovered_at: string;
}

export default function NessusIntegrationPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toISOString());

  const mockScans: ScanResult[] = [
    {
      id: "nessus-001",
      name: "SSL Certificate Expiring",
      status: "active",
      severity: "medium",
      host: "192.168.1.100",
      plugin_id: "15901",
      discovered_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "nessus-002",
      name: "Apache HTTP Server Version Detection",
      status: "active",
      severity: "info",
      host: "192.168.1.101",
      plugin_id: "48204",
      discovered_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: "nessus-003",
      name: "SSH Weak Key Exchange Algorithms",
      status: "active",
      severity: "high",
      host: "192.168.1.102",
      plugin_id: "153953",
      discovered_at: new Date(Date.now() - 259200000).toISOString()
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const triggerScan = async () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastSync(new Date().toISOString());
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Nessus Integration</h1>
          <p className="text-muted-foreground">Vulnerability scanning and compliance assessment</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-400" : "bg-red-400"}`}></span>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Scans</p>
              <p className="text-2xl font-bold text-foreground">24</p>
            </div>
            <Target className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vulnerabilities</p>
              <p className="text-2xl font-bold text-foreground">156</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Hosts Scanned</p>
              <p className="text-2xl font-bold text-foreground">48</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Last Sync</p>
              <p className="text-sm font-medium text-foreground">{new Date(lastSync).toLocaleString()}</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Nessus Server URL</label>
            <input
              type="text"
              placeholder="https://nessus.example.com:8834"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">API Key</label>
            <input
              type="password"
              placeholder="Enter API key"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
            Test Connection
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Save Configuration
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Scan Actions</h2>
          <button
            onClick={triggerScan}
            disabled={isScanning}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isScanning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isScanning ? "Syncing..." : "Sync Now"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <Target className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Run Full Scan</h3>
            <p className="text-sm text-muted-foreground">Scan all configured targets</p>
          </button>
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <Download className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Import Results</h3>
            <p className="text-sm text-muted-foreground">Import scan results from file</p>
          </button>
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <ExternalLink className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Open Nessus</h3>
            <p className="text-sm text-muted-foreground">Launch Nessus console</p>
          </button>
        </div>
      </div>

      {/* Recent Findings */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Recent Findings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Finding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Host</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Plugin ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Discovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground">{scan.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(scan.severity)}`}>
                      {scan.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground font-mono">{scan.host}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{scan.plugin_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{new Date(scan.discovered_at).toLocaleDateString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
