export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import {
  AgentRun,
  agentRunsStore,
  getAgentRun,
  setAgentRun,
  generatePOAMContent
} from '@/lib/agent-runs-store';

// Simulate agent processing with progress updates
async function processAgentTask(runId: string): Promise<void> {
  const run = getAgentRun(runId);
  if (!run) return;

  try {
    // Update to running
    run.status = 'running';
    run.progress_percent = 10;
    run.updated_at = new Date().toISOString();
    setAgentRun(runId, run);

    // Simulate processing steps
    await new Promise(resolve => setTimeout(resolve, 500));
    run.progress_percent = 30;
    run.updated_at = new Date().toISOString();
    setAgentRun(runId, run);

    await new Promise(resolve => setTimeout(resolve, 500));
    run.progress_percent = 60;
    run.updated_at = new Date().toISOString();
    setAgentRun(runId, run);

    await new Promise(resolve => setTimeout(resolve, 500));
    run.progress_percent = 90;
    run.updated_at = new Date().toISOString();
    setAgentRun(runId, run);

    // Generate result based on task type
    let result;
    switch (run.task_type) {
      case 'generate_poam':
        result = generatePOAMContent(run.parameters);
        break;
      case 'scan':
        result = {
          vulnerabilities_found: Math.floor(Math.random() * 10),
          scan_completed: new Date().toISOString()
        };
        break;
      case 'generate_sbom':
        result = {
          components_found: Math.floor(Math.random() * 100) + 20,
          format: 'CycloneDX',
          generated_at: new Date().toISOString()
        };
        break;
      default:
        result = { message: 'Task completed' };
    }

    // Complete
    run.status = 'completed';
    run.progress_percent = 100;
    run.result = result;
    run.updated_at = new Date().toISOString();
    setAgentRun(runId, run);

  } catch (error) {
    run.status = 'failed';
    run.error = error instanceof Error ? error.message : 'Unknown error';
    run.updated_at = new Date().toISOString();
    setAgentRun(runId, run);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task_type, parameters, environment_id } = body;

    if (!task_type) {
      return NextResponse.json(
        { error: 'Missing task_type' },
        { status: 400 }
      );
    }

    // Create new agent run
    const runId = `run-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const agentRun: AgentRun = {
      run_id: runId,
      task_type,
      status: 'pending',
      parameters: parameters || {},
      progress_percent: 0,
      created_at: now,
      updated_at: now,
    };

    setAgentRun(runId, agentRun);

    // Start processing in background (don't await)
    processAgentTask(runId);

    return NextResponse.json(agentRun);

  } catch (error) {
    console.error('Error creating agent run:', error);
    return NextResponse.json(
      { error: 'Failed to create agent run' },
      { status: 500 }
    );
  }
}

// GET all runs or a specific run
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('run_id');

  if (runId) {
    const run = getAgentRun(runId);
    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(run);
  }

  // Return all runs
  const runs = Array.from(agentRunsStore.values());
  return NextResponse.json({ runs });
}
