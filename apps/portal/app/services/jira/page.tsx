"use client";

import { useState } from "react";
import { Ticket, CheckCircle, Clock, AlertCircle, Settings, RefreshCw, Play, Plus, ExternalLink, Search } from "lucide-react";

export default function JiraIntegrationPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toISOString());

  const tickets = [
    { id: "SEC-1234", title: "Remediate CVE-2024-1234 in production", priority: "high", status: "In Progress", assignee: "John Doe" },
    { id: "SEC-1235", title: "Update SSL certificates before expiry", priority: "medium", status: "To Do", assignee: "Jane Smith" },
    { id: "SEC-1236", title: "Review IAM permissions for service accounts", priority: "low", status: "Done", assignee: "Bob Johnson" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done": return "bg-green-500/20 text-green-400";
      case "In Progress": return "bg-blue-500/20 text-blue-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    setTimeout(() => { setIsSyncing(false); setLastSync(new Date().toISOString()); }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Jira Integration</h1>
          <p className="text-muted-foreground">Issue tracking and vulnerability remediation workflow</p>
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
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Open Issues</p><p className="text-2xl font-bold text-foreground">47</p></div><Ticket className="h-8 w-8 text-primary" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">High Priority</p><p className="text-2xl font-bold text-red-400">12</p></div><AlertCircle className="h-8 w-8 text-red-500" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Resolved This Week</p><p className="text-2xl font-bold text-green-400">23</p></div><CheckCircle className="h-8 w-8 text-green-500" /></div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Last Sync</p><p className="text-sm font-medium text-foreground">{new Date(lastSync).toLocaleString()}</p></div><Clock className="h-8 w-8 text-muted-foreground" /></div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium text-muted-foreground mb-2">Jira URL</label><input type="text" placeholder="https://your-org.atlassian.net" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground" /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-2">API Token</label><input type="password" placeholder="Enter API token" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground" /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-2">Project Key</label><input type="text" placeholder="SEC" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground" /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-2">Email</label><input type="email" placeholder="user@example.com" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground" /></div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">Test Connection</button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Save Configuration</button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Actions</h2>
          <div className="flex gap-3">
            <button className="inline-flex items-center px-4 py-2 bg-gray-700 text-foreground rounded-lg hover:bg-gray-600 transition-colors">
              <Plus className="h-4 w-4 mr-2" /> Create Issue
            </button>
            <button onClick={triggerSync} disabled={isSyncing} className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
              {isSyncing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {isSyncing ? "Syncing..." : "Sync Issues"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border"><h2 className="text-xl font-semibold text-foreground">Security Issues</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Summary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Assignee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4"><span className="text-sm font-medium text-primary">{t.id}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-foreground">{t.title}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(t.priority)}`}>{t.priority}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(t.status)}`}>{t.status}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{t.assignee}</span></td>
                  <td className="px-6 py-4"><button className="text-primary hover:text-primary/80"><ExternalLink className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
