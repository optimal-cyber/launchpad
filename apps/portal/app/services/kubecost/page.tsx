"use client";

import { useState } from "react";
import { DollarSign, Boxes, Clock, TrendingDown, Settings, RefreshCw, BarChart3, Cpu, HardDrive } from "lucide-react";

export default function KubecostIntegrationPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toISOString());

  const namespaces = [
    { name: "production", cost: 2450, cpu: 45, memory: 62, pods: 24 },
    { name: "staging", cost: 890, cpu: 23, memory: 35, pods: 12 },
    { name: "development", cost: 450, cpu: 15, memory: 28, pods: 8 },
    { name: "monitoring", cost: 320, cpu: 12, memory: 18, pods: 6 },
  ];

  const triggerSync = async () => {
    setIsSyncing(true);
    setTimeout(() => { setIsSyncing(false); setLastSync(new Date().toISOString()); }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Kubecost Integration</h1>
          <p className="text-muted-foreground">Kubernetes cost monitoring and optimization</p>
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
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Monthly Cost</p><p className="text-2xl font-bold text-foreground">$4,110</p></div><DollarSign className="h-8 w-8 text-green-500" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Pods</p><p className="text-2xl font-bold text-foreground">50</p></div><Boxes className="h-8 w-8 text-blue-500" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Savings Opportunity</p><p className="text-2xl font-bold text-green-400">$820</p></div><TrendingDown className="h-8 w-8 text-green-500" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Last Sync</p><p className="text-sm font-medium text-foreground">{new Date(lastSync).toLocaleString()}</p></div><Clock className="h-8 w-8 text-muted-foreground" /></div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium text-muted-foreground mb-2">Kubecost URL</label><input type="text" placeholder="http://kubecost.monitoring.svc:9090" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground" /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-2">API Key (optional)</label><input type="password" placeholder="Enter API key" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground" /></div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">Test Connection</button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Save Configuration</button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Actions</h2>
          <button onClick={triggerSync} disabled={isSyncing} className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            {isSyncing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isSyncing ? "Syncing..." : "Sync Costs"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <BarChart3 className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Cost Report</h3>
            <p className="text-sm text-muted-foreground">Generate detailed cost report</p>
          </button>
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <TrendingDown className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Optimization</h3>
            <p className="text-sm text-muted-foreground">View savings recommendations</p>
          </button>
          <button className="p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors text-left border border-border">
            <DollarSign className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Set Budgets</h3>
            <p className="text-sm text-muted-foreground">Configure namespace budgets</p>
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border"><h2 className="text-xl font-semibold text-foreground">Namespace Costs</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Namespace</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Monthly Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">CPU %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Memory %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Pods</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {namespaces.map((ns) => (
                <tr key={ns.name} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4"><span className="text-sm font-medium text-foreground font-mono">{ns.name}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-foreground">${ns.cost.toLocaleString()}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${ns.cpu}%` }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">{ns.cpu}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${ns.memory}%` }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">{ns.memory}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{ns.pods}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
