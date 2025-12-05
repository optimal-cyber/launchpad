import { NextResponse } from 'next/server';

// In-memory storage for demo (use database in production)
const registeredAgents: Map<string, any> = new Map();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      agent_id,
      hostname,
      os,
      os_version,
      scanner_type,
      version,
      capabilities,
      registered_at
    } = body;

    if (!agent_id) {
      return NextResponse.json(
        { error: 'agent_id is required' },
        { status: 400 }
      );
    }

    // Store agent registration
    const agent = {
      agent_id,
      hostname: hostname || 'unknown',
      os: os || 'unknown',
      os_version: os_version || 'unknown',
      scanner_type: scanner_type || 'unknown',
      version: version || '1.0.0',
      capabilities: capabilities || [],
      registered_at: registered_at || new Date().toISOString(),
      last_heartbeat: new Date().toISOString(),
      status: 'active'
    };

    registeredAgents.set(agent_id, agent);

    console.log(`Agent registered: ${agent_id} (${hostname})`);

    return NextResponse.json({
      success: true,
      agent_id,
      message: 'Agent registered successfully',
      registered_at: agent.registered_at
    });

  } catch (error) {
    console.error('Error registering agent:', error);
    return NextResponse.json(
      { error: 'Failed to register agent' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const agents = Array.from(registeredAgents.values());
    
    return NextResponse.json({
      success: true,
      count: agents.length,
      agents
    });

  } catch (error) {
    console.error('Error listing agents:', error);
    return NextResponse.json(
      { error: 'Failed to list agents' },
      { status: 500 }
    );
  }
}

