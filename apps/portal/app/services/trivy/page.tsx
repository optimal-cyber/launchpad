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
  Boxes,
  FileCode,
  Lock
} from "lucide-react";

export default function TrivyIntegrationPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toISOString());

  const recentScans = [
    { id: "1", image: "nginx:1.25.0", vulns: { critical: 0, high: 2, medium: 5, low: 12 }, scannedAt: "10 min ago" },
    { id: "2", image: "python:3.11-slim", vulns: { critical: 1, high: 3, medium: 8, low: 15 }, scannedAt: "25 min ago" },
    { id: "3", image: "node:20-alpine", vulns: { critical: 0, high: 1, medium: 3, low: 7 }, scannedAt: "1 hour ago" },
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Trivy Integration</h1>
          <p className="text-muted-foreground">Container image and filesystem vulnerability scanning</p>
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
              <p className="text-sm text-muted-foreground">Images Scanned</p>
              <p className="text-2xl font-bold text-foreground">156</p>
            </div>
            <Boxes className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Vulns</p>
              <p className="text-2xl font-bold text-red-400">8</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Secrets Found</p>
              <p className="text-2xl font-bold text-yellow-400">3</p>
            </div>
            <Lock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Last Scan</p>
              <p className="text-sm font-medium text-foreground">{new Date(lastSync).toLocaleString()}</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Scan Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Trivy Server URL (optional)</label>
            <input
              type="text"
              placeholder="http://trivy-server:8080"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Severity Threshold</label>
            <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground">
              <option value="critical">Critical Only</option>
              <option value="high">High and Above</option>
              <option value="medium">Medium and Above</option>
              <option value="low">All Severities</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded border-border" />
              <span className="text-sm text-foreground">Scan for vulnerabilities</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded border-border" />
              <span className="text-sm text-foreground">Scan for secrets</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded border-border" />
              <span className="text-sm text-foreground">Scan for misconfigurations</span>
            </label>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
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
            {isScanning ? "Scanning..." : "Scan All Images"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <Boxes className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Scan Image</h3>
            <p className="text-sm text-muted-foreground">Scan a specific container image</p>
          </button>
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <FileCode className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Scan Repository</h3>
            <p className="text-sm text-muted-foreground">Scan a git repository for IaC issues</p>
          </button>
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <Download className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Export SBOM</h3>
            <p className="text-sm text-muted-foreground">Generate SBOM from scan results</p>
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Recent Scans</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Critical</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">High</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Medium</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Low</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Scanned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4"><span className="text-sm font-medium text-foreground font-mono">{scan.image}</span></td>
                  <td className="px-6 py-4"><span className={`text-sm font-bold ${scan.vulns.critical > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>{scan.vulns.critical}</span></td>
                  <td className="px-6 py-4"><span className={`text-sm font-bold ${scan.vulns.high > 0 ? 'text-orange-400' : 'text-muted-foreground'}`}>{scan.vulns.high}</span></td>
                  <td className="px-6 py-4"><span className={`text-sm ${scan.vulns.medium > 0 ? 'text-yellow-400' : 'text-muted-foreground'}`}>{scan.vulns.medium}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{scan.vulns.low}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{scan.scannedAt}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
