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
  Code,
  Package,
  GitBranch
} from "lucide-react";

export default function SnykIntegrationPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toISOString());

  const projects = [
    { id: "1", name: "optimal-platform/portal", type: "npm", issues: { critical: 0, high: 2, medium: 8 }, lastTest: "2 hours ago" },
    { id: "2", name: "optimal-platform/api", type: "pip", issues: { critical: 1, high: 4, medium: 12 }, lastTest: "4 hours ago" },
    { id: "3", name: "optimal-platform/agent", type: "pip", issues: { critical: 0, high: 1, medium: 3 }, lastTest: "1 hour ago" },
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Snyk Integration</h1>
          <p className="text-muted-foreground">Developer-first security for code, dependencies, containers, and IaC</p>
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
              <p className="text-sm text-muted-foreground">Projects</p>
              <p className="text-2xl font-bold text-foreground">12</p>
            </div>
            <Code className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Issues</p>
              <p className="text-2xl font-bold text-red-400">3</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Dependencies</p>
              <p className="text-2xl font-bold text-foreground">847</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
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
            <label className="block text-sm font-medium text-muted-foreground mb-2">Snyk Organization ID</label>
            <input
              type="text"
              placeholder="Enter organization ID"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">API Token</label>
            <input
              type="password"
              placeholder="Enter API token"
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
            {isScanning ? "Syncing..." : "Sync Projects"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <Code className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Test Code</h3>
            <p className="text-sm text-muted-foreground">Run SAST analysis on source code</p>
          </button>
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <Package className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Test Dependencies</h3>
            <p className="text-sm text-muted-foreground">Scan for vulnerable packages</p>
          </button>
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <GitBranch className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Import Project</h3>
            <p className="text-sm text-muted-foreground">Add a new repository to monitor</p>
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Monitored Projects</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Critical</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">High</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Medium</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Last Test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4"><span className="text-sm font-medium text-foreground">{project.name}</span></td>
                  <td className="px-6 py-4"><span className="text-xs bg-gray-700 px-2 py-1 rounded">{project.type}</span></td>
                  <td className="px-6 py-4"><span className={`text-sm font-bold ${project.issues.critical > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>{project.issues.critical}</span></td>
                  <td className="px-6 py-4"><span className={`text-sm font-bold ${project.issues.high > 0 ? 'text-orange-400' : 'text-muted-foreground'}`}>{project.issues.high}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-yellow-400">{project.issues.medium}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{project.lastTest}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
