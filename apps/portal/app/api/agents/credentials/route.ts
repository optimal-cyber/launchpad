export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import {
  generateAgentCredentials,
  setAgentOAuthCredentials,
  getAgentByAgentId,
} from '@/lib/db/agent-repository';
import { checkConnection } from '@/lib/db/client';

/**
 * POST /api/agents/credentials
 * Generate new OAuth credentials for an agent
 *
 * Body: { agent_id?: string }
 * If agent_id is provided, credentials are associated with existing agent
 * If not provided, generates standalone credentials for a new agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { agent_id } = body;

    // Check database connection
    const dbAvailable = await checkConnection();

    if (dbAvailable && agent_id) {
      // Verify agent exists
      const agent = await getAgentByAgentId(agent_id);
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }

      // Generate new credentials
      const { clientId, clientSecret, clientSecretHash } = generateAgentCredentials();

      // Store in database
      await setAgentOAuthCredentials(agent_id, clientId, clientSecretHash);

      console.log(`[Auth] Generated new credentials for agent: ${agent_id}`);

      return NextResponse.json({
        success: true,
        client_id: clientId,
        client_secret: clientSecret,
        agent_id: agent_id,
        message: 'Credentials generated successfully. Store the client_secret securely - it cannot be retrieved later.',
      });
    } else {
      // Demo mode or no agent_id - generate standalone credentials
      const { clientId, clientSecret } = generateAgentCredentials();

      console.log(`[Demo] Generated standalone credentials`);

      return NextResponse.json({
        success: true,
        client_id: clientId,
        client_secret: clientSecret,
        demo_mode: !dbAvailable,
        message: 'Credentials generated. Use these when deploying your agent.',
      });
    }
  } catch (error) {
    console.error('Error generating credentials:', error);
    return NextResponse.json(
      { error: 'Failed to generate credentials', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/credentials
 * Revoke/rotate credentials for an agent
 *
 * Body: { agent_id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id } = body;

    if (!agent_id) {
      return NextResponse.json(
        { error: 'agent_id is required' },
        { status: 400 }
      );
    }

    const dbAvailable = await checkConnection();

    if (!dbAvailable) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 503 }
      );
    }

    const agent = await getAgentByAgentId(agent_id);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Generate new credentials (effectively revoking old ones)
    const { clientId, clientSecret, clientSecretHash } = generateAgentCredentials();
    await setAgentOAuthCredentials(agent_id, clientId, clientSecretHash);

    console.log(`[Auth] Rotated credentials for agent: ${agent_id}`);

    return NextResponse.json({
      success: true,
      client_id: clientId,
      client_secret: clientSecret,
      agent_id: agent_id,
      message: 'Credentials rotated successfully. Previous credentials are now invalid.',
    });
  } catch (error) {
    console.error('Error rotating credentials:', error);
    return NextResponse.json(
      { error: 'Failed to rotate credentials', details: String(error) },
      { status: 500 }
    );
  }
}
