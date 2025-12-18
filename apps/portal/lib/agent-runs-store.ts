// Shared in-memory store for agent runs
// In production, this would be backed by a database or Redis

export interface AgentRun {
  run_id: string;
  task_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  parameters: Record<string, any>;
  result?: any;
  error?: string;
  progress_percent: number;
  created_at: string;
  updated_at: string;
}

// Global store - survives across module reloads in development
declare global {
  var agentRunsStore: Map<string, AgentRun> | undefined;
}

// Use global store to persist across module reloads
if (!global.agentRunsStore) {
  global.agentRunsStore = new Map<string, AgentRun>();
}

export const agentRunsStore = global.agentRunsStore;

export function getAgentRun(runId: string): AgentRun | undefined {
  return agentRunsStore.get(runId);
}

export function setAgentRun(runId: string, run: AgentRun): void {
  agentRunsStore.set(runId, run);
}

export function getAllAgentRuns(): AgentRun[] {
  return Array.from(agentRunsStore.values());
}

// Generate POA&M content based on vulnerability data
export function generatePOAMContent(params: Record<string, any>): any {
  const { cve_id, severity, package: pkgName, version, asset } = params;

  // Calculate scheduled completion based on severity
  const daysToFix = {
    critical: 14,
    high: 30,
    medium: 90,
    low: 180,
  }[severity as string] || 90;

  const scheduledCompletion = new Date();
  scheduledCompletion.setDate(scheduledCompletion.getDate() + daysToFix);

  return {
    poam_id: `POAM-${Date.now().toString(36).toUpperCase()}`,
    weakness_name: `${cve_id}: Vulnerability in ${pkgName}`,
    weakness_description: `A ${severity} severity vulnerability (${cve_id}) has been identified in ${pkgName} version ${version} deployed on ${asset}. This vulnerability requires remediation within ${daysToFix} days per organizational policy.`,
    severity: severity,
    scheduled_completion: scheduledCompletion.toISOString(),
    milestones: [
      {
        id: 1,
        description: 'Identify affected systems and dependencies',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      },
      {
        id: 2,
        description: 'Test patch/update in staging environment',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      },
      {
        id: 3,
        description: 'Deploy remediation to production',
        due_date: scheduledCompletion.toISOString(),
        status: 'pending'
      }
    ],
    recommendations: [
      `Update ${pkgName} to the latest patched version`,
      'Verify no active exploitation by reviewing logs',
      'Document any compensating controls in place',
      'Update SBOM after remediation is complete'
    ],
    resources_required: 'Security team review, Development team for patching, QA for testing',
    risk_accepted: false,
    items_generated: 1
  };
}
