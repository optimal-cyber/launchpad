"use client";

import { useState } from "react";
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
  Activity,
  Server
} from "lucide-react";

export default function TenableIntegrationPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toISOString());

  const assets = [
    { id: "1", hostname: "web-server-01", ip: "10.0.1.50", os: "Ubuntu 22.04", vulns: 12, lastSeen: "2 hours ago" },
    { id: "2", hostname: "db-server-01", ip: "10.0.1.51", os: "RHEL 8", vulns: 5, lastSeen: "4 hours ago" },
    { id: "3", hostname: "api-gateway", ip: "10.0.1.52", os: "Alpine Linux", vulns: 3, lastSeen: "1 hour ago" },
  ];

  const triggerScan = async () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastSync(new Date().toISOString());
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tenable Integration</h1>
          <p className="text-muted-foreground">Vulnerability management and asset discovery</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Assets</p>
              <p className="text-2xl font-bold text-foreground">127</p>
            </div>
            <Server className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Vulns</p>
              <p className="text-2xl font-bold text-red-400">23</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Scans</p>
              <p className="text-2xl font-bold text-foreground">3</p>
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

      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Tenable.io URL</label>
            <input
              type="text"
              placeholder="https://cloud.tenable.com"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Access Key</label>
            <input
              type="password"
              placeholder="Enter access key"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Secret Key</label>
            <input
              type="password"
              placeholder="Enter secret key"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">Test Connection</button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Save Configuration</button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Actions</h2>
          <button
            onClick={triggerScan}
            disabled={isScanning}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isScanning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            {isScanning ? "Syncing..." : "Sync Now"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <Target className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Run Asset Discovery</h3>
            <p className="text-sm text-muted-foreground">Discover new assets on network</p>
          </button>
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <Download className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Export Report</h3>
            <p className="text-sm text-muted-foreground">Download vulnerability report</p>
          </button>
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <ExternalLink className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Open Tenable.io</h3>
            <p className="text-sm text-muted-foreground">Launch Tenable console</p>
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Recent Assets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Hostname</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">OS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vulnerabilities</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4"><span className="text-sm font-medium text-foreground">{asset.hostname}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-muted-foreground font-mono">{asset.ip}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{asset.os}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-foreground font-medium">{asset.vulns}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{asset.lastSeen}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
