export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import {
  registerAgent,
  getAgentByAgentId,
  listAgents,
  generateAgentCredentials,
  setAgentOAuthCredentials,
  type AgentRegistration,
} from '@/lib/db/agent-repository';
import { checkConnection } from '@/lib/db/client';

// In-memory fallback for demo mode (when database unavailable)
const demoAgents: Map<string, unknown> = new Map();
let useDatabase = true;

async function ensureDatabaseConnection(): Promise<boolean> {
  if (!useDatabase) return false;

  try {
    const connected = await checkConnection();
    if (!connected) {
      console.log('[Agents] Database unavailable, using demo mode');
      useDatabase = false;
    }
    return connected;
  } catch {
    console.log('[Agents] Database check failed, using demo mode');
    useDatabase = false;
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      agent_id,
      hostname,
      name,
      os,
      os_version,
      scanner_type,
      agent_type,
      version,
      capabilities,
      environment,
      cluster_name,
      node_name,
      namespace,
      labels,
      annotations,
      config,
      generate_credentials,
    } = body;

    if (!agent_id) {
      return NextResponse.json(
        { error: 'agent_id is required' },
        { status: 400 }
      );
    }

    const dbAvailable = await ensureDatabaseConnection();

    if (dbAvailable) {
      // Use PostgreSQL database
      const registrationData: AgentRegistration = {
        agent_id,
        name: name || hostname || null,
        agent_type: agent_type || scanner_type || 'scanner',
        version: version || null,
        environment: environment || null,
        cluster_name: cluster_name || null,
        node_name: node_name || null,
        namespace: namespace || null,
        capabilities: capabilities || [],
        labels: labels || {},
        annotations: annotations || {},
        config: config || {},
      };

      const agent = await registerAgent(registrationData);

      // Generate OAuth credentials if requested
      let credentials = null;
      if (generate_credentials) {
        const { clientId, clientSecret, clientSecretHash } =
          generateAgentCredentials();
        await setAgentOAuthCredentials(agent_id, clientId, clientSecretHash);
        credentials = { client_id: clientId, client_secret: clientSecret };
      }

      console.log(`[DB] Agent registered: ${agent_id} (${agent.name || hostname})`);

      return NextResponse.json({
        success: true,
        agent_id: agent.agent_id,
        id: agent.id,
        message: 'Agent registered successfully',
        registered_at: agent.created_at,
        status: agent.status,
        ...(credentials && { credentials }),
      });
    } else {
      // Demo mode fallback
      const agent = {
        id: `demo-${Date.now()}`,
        agent_id,
        name: name || hostname || 'unknown',
        agent_type: agent_type || scanner_type || 'scanner',
        version: version || '1.0.0',
        capabilities: capabilities || [],
        environment: environment || 'development',
        cluster_name,
        node_name,
        namespace,
        registered_at: new Date().toISOString(),
        last_heartbeat: new Date().toISOString(),
        status: 'active',
        labels: labels || {},
        annotations: annotations || {},
      };

      demoAgents.set(agent_id, agent);

      // Generate demo credentials if requested
      let credentials = null;
      if (generate_credentials) {
        credentials = {
          client_id: `demo_agent_${agent_id}`,
          client_secret: `demo_secret_${Date.now()}`,
        };
      }

      console.log(`[Demo] Agent registered: ${agent_id} (${agent.name})`);

      return NextResponse.json({
        success: true,
        agent_id,
        id: agent.id,
        message: 'Agent registered successfully (demo mode)',
        registered_at: agent.registered_at,
        status: agent.status,
        demo_mode: true,
        ...(credentials && { credentials }),
      });
    }
  } catch (error) {
    console.error('Error registering agent:', error);
    return NextResponse.json(
      { error: 'Failed to register agent', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const environment = searchParams.get('environment') || undefined;
    const agent_type = searchParams.get('agent_type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const dbAvailable = await ensureDatabaseConnection();

    if (dbAvailable) {
      const agents = await listAgents({
        status,
        environment,
        agent_type,
        limit,
        offset,
      });

      return NextResponse.json({
        success: true,
        count: agents.length,
        agents,
      });
    } else {
      // Demo mode fallback
      let agents = Array.from(demoAgents.values());

      // Apply filters
      if (status) {
        agents = agents.filter((a: unknown) => (a as { status: string }).status === status);
      }
      if (environment) {
        agents = agents.filter((a: unknown) => (a as { environment: string }).environment === environment);
      }
      if (agent_type) {
        agents = agents.filter((a: unknown) => (a as { agent_type: string }).agent_type === agent_type);
      }

      // Apply pagination
      agents = agents.slice(offset, offset + limit);

      return NextResponse.json({
        success: true,
        count: agents.length,
        agents,
        demo_mode: true,
      });
    }
  } catch (error) {
    console.error('Error listing agents:', error);
    return NextResponse.json(
      { error: 'Failed to list agents' },
      { status: 500 }
    );
  }
}

