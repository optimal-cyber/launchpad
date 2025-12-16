"use client";

import { useState } from "react";
import { Cloud, CheckCircle, Clock, AlertTriangle, Settings, RefreshCw, Play, Download, Server, Shield } from "lucide-react";

export default function AWSInspectorIntegrationPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toISOString());

  const findings = [
    { id: "1", title: "Outdated EC2 AMI", severity: "high", resourceType: "EC2", resourceId: "i-0abc123def456", region: "us-east-1" },
    { id: "2", title: "Lambda function using deprecated runtime", severity: "medium", resourceType: "Lambda", resourceId: "my-function", region: "us-west-2" },
    { id: "3", title: "ECR image vulnerability", severity: "critical", resourceType: "ECR", resourceId: "my-repo:latest", region: "us-east-1" },
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
          <h1 className="text-3xl font-bold text-foreground mb-2">AWS Inspector Integration</h1>
          <p className="text-muted-foreground">Automated vulnerability management for AWS workloads</p>
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
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">AWS Accounts</p><p className="text-2xl font-bold text-foreground">4</p></div><Cloud className="h-8 w-8 text-primary" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active Findings</p><p className="text-2xl font-bold text-red-400">67</p></div><AlertTriangle className="h-8 w-8 text-red-500" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Resources Scanned</p><p className="text-2xl font-bold text-foreground">1,234</p></div><Server className="h-8 w-8 text-blue-500" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Last Sync</p><p className="text-sm font-medium text-foreground">{new Date(lastSync).toLocaleString()}</p></div><Clock className="h-8 w-8 text-muted-foreground" /></div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium text-muted-foreground mb-2">AWS Region</label><select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"><option>us-east-1</option><option>us-west-2</option><option>eu-west-1</option></select></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-2">IAM Role ARN</label><input type="text" placeholder="arn:aws:iam::123456789:role/InspectorRole" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground" /></div>
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
            {isScanning ? "Syncing..." : "Sync Findings"}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border"><h2 className="text-xl font-semibold text-foreground">Recent Findings</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Finding</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Resource</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Region</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {findings.map((f) => (
                <tr key={f.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4"><span className="text-sm font-medium text-foreground">{f.title}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(f.severity)}`}>{f.severity}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{f.resourceType}: {f.resourceId}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{f.region}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
