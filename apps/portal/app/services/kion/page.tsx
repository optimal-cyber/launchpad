"use client";

import { useState } from "react";
import { DollarSign, Cloud, Clock, TrendingUp, Settings, RefreshCw, AlertTriangle, Building, CreditCard } from "lucide-react";

export default function KionIntegrationPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toISOString());

  const accounts = [
    { id: "1", name: "Production", provider: "AWS", spend: 45230, budget: 50000, compliance: 94 },
    { id: "2", name: "Development", provider: "AWS", spend: 12450, budget: 15000, compliance: 98 },
    { id: "3", name: "Staging", provider: "Azure", spend: 8900, budget: 10000, compliance: 91 },
  ];

  const triggerSync = async () => {
    setIsSyncing(true);
    setTimeout(() => { setIsSyncing(false); setLastSync(new Date().toISOString()); }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Kion Integration</h1>
          <p className="text-muted-foreground">Cloud governance and cost management</p>
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
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Spend (MTD)</p><p className="text-2xl font-bold text-foreground">$66,580</p></div><DollarSign className="h-8 w-8 text-green-500" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Cloud Accounts</p><p className="text-2xl font-bold text-foreground">12</p></div><Cloud className="h-8 w-8 text-blue-500" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Compliance Score</p><p className="text-2xl font-bold text-green-400">94%</p></div><TrendingUp className="h-8 w-8 text-green-500" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Last Sync</p><p className="text-sm font-medium text-foreground">{new Date(lastSync).toLocaleString()}</p></div><Clock className="h-8 w-8 text-muted-foreground" /></div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium text-muted-foreground mb-2">Kion URL</label><input type="text" placeholder="https://your-org.kion.io" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground" /></div>
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
          <button onClick={triggerSync} disabled={isSyncing} className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            {isSyncing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isSyncing ? "Syncing..." : "Sync Accounts"}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border"><h2 className="text-xl font-semibold text-foreground">Cloud Accounts</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Spend</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Compliance</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {accounts.map((a) => (
                <tr key={a.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4"><span className="text-sm font-medium text-foreground">{a.name}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{a.provider}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-foreground">${a.spend.toLocaleString()}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-muted-foreground">${a.budget.toLocaleString()}</span></td>
                  <td className="px-6 py-4"><span className={`text-sm font-medium ${a.compliance >= 95 ? 'text-green-400' : a.compliance >= 90 ? 'text-yellow-400' : 'text-red-400'}`}>{a.compliance}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
