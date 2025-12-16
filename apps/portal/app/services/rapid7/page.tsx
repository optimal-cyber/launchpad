"use client";

import { useState } from "react";
import { Shield, CheckCircle, Clock, AlertTriangle, Settings, RefreshCw, Play, Target, Activity, Search } from "lucide-react";

export default function Rapid7IntegrationPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toISOString());

  const vulnerabilities = [
    { id: "1", title: "CVE-2024-1234 - OpenSSL Buffer Overflow", severity: "critical", asset: "server-01", exploitable: true },
    { id: "2", title: "CVE-2024-5678 - Apache Log4j RCE", severity: "critical", asset: "app-server-02", exploitable: true },
    { id: "3", title: "CVE-2024-9012 - MySQL Auth Bypass", severity: "high", asset: "db-server-01", exploitable: false },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const triggerScan = async () => {
    setIsScanning(true);
    setTimeout(() => { setIsScanning(false); setLastSync(new Date().toISOString()); }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Rapid7 InsightVM Integration</h1>
          <p className="text-muted-foreground">Vulnerability risk management and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-400" : "bg-red-400"}`}></span>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors"><Settings className="h-5 w-5 text-muted-foreground" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Sites</p><p className="text-2xl font-bold text-foreground">8</p></div><Target className="h-8 w-8 text-primary" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Vulnerabilities</p><p className="text-2xl font-bold text-red-400">342</p></div><AlertTriangle className="h-8 w-8 text-red-500" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Risk Score</p><p className="text-2xl font-bold text-yellow-400">68.5</p></div><Activity className="h-8 w-8 text-yellow-500" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Last Sync</p><p className="text-sm font-medium text-foreground">{new Date(lastSync).toLocaleString()}</p></div><Clock className="h-8 w-8 text-muted-foreground" /></div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium text-muted-foreground mb-2">InsightVM Console URL</label><input type="text" placeholder="https://insightvm.example.com:3780" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground" /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-2">API Key</label><input type="password" placeholder="Enter API key" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground" /></div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">Test Connection</button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Save Configuration</button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Actions</h2>
          <button onClick={triggerScan} disabled={isScanning} className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            {isScanning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            {isScanning ? "Syncing..." : "Sync Vulnerabilities"}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border"><h2 className="text-xl font-semibold text-foreground">Critical Vulnerabilities</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vulnerability</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Exploitable</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {vulnerabilities.map((v) => (
                <tr key={v.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4"><span className="text-sm font-medium text-foreground">{v.title}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(v.severity)}`}>{v.severity}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-muted-foreground font-mono">{v.asset}</span></td>
                  <td className="px-6 py-4">{v.exploitable ? <span className="text-red-400 text-sm font-medium">Yes</span> : <span className="text-muted-foreground text-sm">No</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
