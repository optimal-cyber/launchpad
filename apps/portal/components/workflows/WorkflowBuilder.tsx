'use client';

import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Edit3,
  Copy,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Loader2,
  GitBranch,
  Layers,
  Zap,
  Timer,
  Webhook,
  Calendar,
  ArrowRight
} from 'lucide-react';
import type {
  Workflow,
  WorkflowStep,
  WorkflowExecution,
  WorkflowStatus,
  StepStatus
} from '@/lib/agent-orchestration-types';

interface WorkflowBuilderProps {
  workflowId?: string;
  onSave?: (workflow: Workflow) => void;
  readOnly?: boolean;
}

const stepTypeConfig = {
  agent: { icon: Zap, color: '#06b6d4', label: 'Agent Action' },
  condition: { icon: GitBranch, color: '#f59e0b', label: 'Condition' },
  parallel: { icon: Layers, color: '#8b5cf6', label: 'Parallel' },
  loop: { icon: RefreshCw, color: '#10b981', label: 'Loop' },
  delay: { icon: Timer, color: '#6366f1', label: 'Delay' },
  webhook: { icon: Webhook, color: '#ec4899', label: 'Webhook' }
};

const statusConfig: Record<StepStatus | WorkflowStatus, { icon: typeof CheckCircle2; color: string }> = {
  pending: { icon: Clock, color: '#64748b' },
  running: { icon: Loader2, color: '#06b6d4' },
  completed: { icon: CheckCircle2, color: '#10b981' },
  failed: { icon: XCircle, color: '#ef4444' },
  skipped: { icon: ChevronRight, color: '#64748b' },
  draft: { icon: Edit3, color: '#64748b' },
  active: { icon: CheckCircle2, color: '#10b981' },
  paused: { icon: Pause, color: '#f59e0b' }
};

export default function WorkflowBuilder({
  workflowId,
  onSave,
  readOnly = false
}: WorkflowBuilderProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'workflows' | 'executions'>('workflows');

  useEffect(() => {
    fetchWorkflows();
    fetchExecutions();
  }, []);

  useEffect(() => {
    if (workflowId && workflows.length > 0) {
      const workflow = workflows.find(w => w.id === workflowId);
      if (workflow) setSelectedWorkflow(workflow);
    }
  }, [workflowId, workflows]);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows?action=list');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      setWorkflows(data.workflows || []);
      if (!selectedWorkflow && data.workflows?.length > 0) {
        setSelectedWorkflow(data.workflows[0]);
      }
    } catch (err) {
      console.error('Fetch workflows error:', err);
      setError('Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/workflows?action=executions');
      if (!response.ok) throw new Error('Failed to fetch executions');
      const data = await response.json();
      setExecutions(data.executions || []);
    } catch (err) {
      console.error('Fetch executions error:', err);
    }
  };

  const executeWorkflow = async (workflow: Workflow) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          data: { workflowId: workflow.id }
        })
      });

      if (!response.ok) throw new Error('Failed to execute workflow');
      const result = await response.json();
      setExecutions(prev => [result.execution, ...prev]);
    } catch (err) {
      console.error('Execute workflow error:', err);
      setError('Failed to execute workflow');
    }
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const renderStep = (step: WorkflowStep, depth = 0) => {
    const config = stepTypeConfig[step.type];
    const Icon = config?.icon || Zap;
    const isExpanded = expandedSteps.has(step.id);
    const statusConf = statusConfig[step.status];
    const StatusIcon = statusConf?.icon || Clock;

    return (
      <div
        key={step.id}
        className={`relative ${depth > 0 ? 'ml-8' : ''}`}
      >
        {/* Connection line */}
        {depth > 0 && (
          <div className="absolute left-[-20px] top-0 bottom-0 w-px bg-[var(--border-subtle)]" />
        )}

        <div
          className={`p-4 rounded-lg border transition-all cursor-pointer ${
            step.status === 'running'
              ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5'
              : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-default)]'
          }`}
          onClick={() => toggleStep(step.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${config?.color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: config?.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--text-primary)]">{step.name}</span>
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded">
                    {config?.label || step.type}
                  </span>
                </div>
                {step.agentId && (
                  <span className="text-xs text-[var(--text-muted)]">Agent: {step.agentId}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon
                className={`w-4 h-4 ${step.status === 'running' ? 'animate-spin' : ''}`}
                style={{ color: statusConf?.color }}
              />
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
              {/* Inputs */}
              {Object.keys(step.inputs).length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-[var(--text-muted)] uppercase mb-2 block">Inputs</span>
                  <div className="space-y-1">
                    {Object.entries(step.inputs).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <span className="text-[var(--text-muted)]">{key}:</span>
                        <code className="text-xs bg-[var(--bg-surface)] px-2 py-0.5 rounded text-[var(--accent-cyan)]">
                          {String(value)}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outputs */}
              {step.outputs.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-[var(--text-muted)] uppercase mb-2 block">Outputs</span>
                  <div className="flex flex-wrap gap-2">
                    {step.outputs.map(output => (
                      <span
                        key={output}
                        className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded"
                      >
                        {output}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Condition */}
              {step.condition && (
                <div className="mb-3">
                  <span className="text-xs text-[var(--text-muted)] uppercase mb-2 block">Condition</span>
                  <code className="text-xs bg-[var(--bg-surface)] px-2 py-1 rounded text-[var(--text-primary)] block">
                    {step.condition.left} {step.condition.type} {step.condition.right}
                  </code>
                </div>
              )}

              {/* Result */}
              {step.result && (
                <div>
                  <span className="text-xs text-[var(--text-muted)] uppercase mb-2 block">Result</span>
                  <pre className="text-xs bg-[var(--bg-surface)] p-2 rounded text-[var(--text-primary)] overflow-x-auto">
                    {JSON.stringify(step.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Arrow to next step */}
        {step.order < (selectedWorkflow?.steps.length || 0) && (
          <div className="flex justify-center py-2">
            <ArrowRight className="w-4 h-4 text-[var(--border-subtle)] rotate-90" />
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Workflow List */}
      <div className="col-span-4">
        <div className="enterprise-card">
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-[var(--text-primary)]">Workflows</h3>
              {!readOnly && (
                <button className="enterprise-btn enterprise-btn-secondary text-sm">
                  <Plus className="w-4 h-4" />
                  New
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('workflows')}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  activeTab === 'workflows'
                    ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'
                }`}
              >
                Workflows ({workflows.length})
              </button>
              <button
                onClick={() => setActiveTab('executions')}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  activeTab === 'executions'
                    ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'
                }`}
              >
                Executions ({executions.length})
              </button>
            </div>
          </div>

          <div className="divide-y divide-[var(--border-subtle)] max-h-[600px] overflow-y-auto">
            {activeTab === 'workflows' ? (
              workflows.map(workflow => (
                <button
                  key={workflow.id}
                  onClick={() => setSelectedWorkflow(workflow)}
                  className={`w-full p-4 text-left hover:bg-[var(--bg-surface)] transition-colors ${
                    selectedWorkflow?.id === workflow.id ? 'bg-[var(--bg-surface)]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-[var(--text-primary)]">{workflow.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        workflow.status === 'active'
                          ? 'bg-green-500/10 text-green-400'
                          : workflow.status === 'running'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {workflow.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                    {workflow.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                    <span>{workflow.steps.length} steps</span>
                    <span>{workflow.triggers.length} triggers</span>
                  </div>
                </button>
              ))
            ) : (
              executions.map(execution => {
                const workflow = workflows.find(w => w.id === execution.workflowId);
                const StatusIcon = statusConfig[execution.status]?.icon || Clock;
                return (
                  <div key={execution.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-[var(--text-primary)]">
                        {workflow?.name || execution.workflowId}
                      </span>
                      <StatusIcon
                        className={`w-4 h-4 ${execution.status === 'running' ? 'animate-spin' : ''}`}
                        style={{ color: statusConfig[execution.status]?.color }}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                      <span>Started: {new Date(execution.startedAt).toLocaleString()}</span>
                      {execution.completedAt && (
                        <span>
                          Duration: {Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Workflow Detail */}
      <div className="col-span-8">
        {selectedWorkflow ? (
          <div className="enterprise-card">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {selectedWorkflow.name}
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    {selectedWorkflow.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!readOnly && (
                    <>
                      <button className="enterprise-btn enterprise-btn-secondary">
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                      <button className="enterprise-btn enterprise-btn-secondary">
                        <Copy className="w-4 h-4" />
                        Clone
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => executeWorkflow(selectedWorkflow)}
                    className="enterprise-btn enterprise-btn-primary"
                  >
                    <Play className="w-4 h-4" />
                    Execute
                  </button>
                </div>
              </div>

              {/* Triggers */}
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-[var(--text-muted)]">Triggers:</span>
                {selectedWorkflow.triggers.map((trigger, idx) => {
                  const Icon = trigger.type === 'schedule' ? Calendar
                    : trigger.type === 'webhook' ? Webhook
                    : trigger.type === 'event' ? Zap
                    : Play;
                  return (
                    <span
                      key={idx}
                      className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-surface)] rounded text-xs text-[var(--text-primary)]"
                    >
                      <Icon className="w-3 h-3" />
                      {trigger.type}
                      {trigger.config.schedule && `: ${trigger.config.schedule}`}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Steps */}
            <div className="p-4">
              <h3 className="text-sm font-medium text-[var(--text-muted)] mb-4">
                Workflow Steps ({selectedWorkflow.steps.length})
              </h3>
              <div className="space-y-2">
                {selectedWorkflow.steps
                  .filter(s => !s.id.includes('step-2a') && !s.id.includes('step-2b') && !s.id.includes('step-2c'))
                  .sort((a, b) => a.order - b.order)
                  .map(step => renderStep(step))}
              </div>
            </div>

            {/* Metadata */}
            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Created by: {selectedWorkflow.createdBy}</span>
                <span>Last updated: {new Date(selectedWorkflow.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="enterprise-card p-12 text-center">
            <Layers className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              No Workflow Selected
            </h3>
            <p className="text-[var(--text-muted)]">
              Select a workflow from the list or create a new one
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
