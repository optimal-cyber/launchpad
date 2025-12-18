export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAgentRun } from '@/lib/agent-runs-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params;

    // Get from shared store
    const run = getAgentRun(runId);

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(run);

  } catch (error) {
    console.error('Error fetching agent run:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent run' },
      { status: 500 }
    );
  }
}
