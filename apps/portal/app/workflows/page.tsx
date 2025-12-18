'use client';

import { useState } from 'react';
import { Layers, Network, RefreshCw, Plus, Download, Filter } from 'lucide-react';
import WorkflowBuilder from '@/components/workflows/WorkflowBuilder';
import KnowledgeGraphViewer from '@/components/knowledge-graph/KnowledgeGraphViewer';

export default function WorkflowsPage() {
  const [activeView, setActiveView] = useState<'workflows' | 'knowledge-graph'>('workflows');

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="enterprise-header px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {activeView === 'workflows' ? 'Workflow Orchestration' : 'Knowledge Graph'}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {activeView === 'workflows'
                ? 'Automate security workflows with agent orchestration'
                : 'Explore entity relationships and security intelligence'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-[var(--bg-surface)] rounded-lg p-1">
              <button
                onClick={() => setActiveView('workflows')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-all ${
                  activeView === 'workflows'
                    ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Layers className="w-4 h-4" />
                Workflows
              </button>
              <button
                onClick={() => setActiveView('knowledge-graph')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-all ${
                  activeView === 'knowledge-graph'
                    ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Network className="w-4 h-4" />
                Knowledge Graph
              </button>
            </div>

            {activeView === 'workflows' && (
              <button className="enterprise-btn enterprise-btn-primary">
                <Plus className="w-4 h-4" />
                New Workflow
              </button>
            )}
            <button className="enterprise-btn enterprise-btn-secondary">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeView === 'workflows' ? (
          <WorkflowBuilder />
        ) : (
          <KnowledgeGraphViewer
            showSearch={true}
            showFilters={true}
            height="calc(100vh - 250px)"
          />
        )}
      </div>
    </div>
  );
}
