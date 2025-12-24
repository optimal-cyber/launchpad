export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAgentCredentials,
  updateTokenRefresh,
} from '@/lib/db/agent-repository';
import { generateAgentToken } from '@/lib/auth/token-utils';

// Demo mode tokens (when database unavailable)
const demoTokens = new Map<string, { agent_id: string; expires_at: number }>();

/**
 * OAuth 2.0 Client Credentials Grant for Agents
 * POST /api/auth/agent/token
 * Body: { grant_type: 'client_credentials', client_id: '...', client_secret: '...' }
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let clientId: string | null = null;
    let clientSecret: string | null = null;
    let grantType: string | null = null;

    // Support both form-urlencoded and JSON
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      clientId = formData.get('client_id') as string | null;
      clientSecret = formData.get('client_secret') as string | null;
      grantType = formData.get('grant_type') as string | null;
    } else {
      const body = await request.json();
      clientId = body.client_id;
      clientSecret = body.client_secret;
      grantType = body.grant_type;
    }

    // Validate grant type
    if (grantType !== 'client_credentials') {
      return NextResponse.json(
        {
          error: 'unsupported_grant_type',
          error_description: 'Only client_credentials grant is supported',
        },
        { status: 400 }
      );
    }

    // Validate required parameters
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'client_id and client_secret are required',
        },
        { status: 400 }
      );
    }

    // Handle demo mode credentials
    if (clientId.startsWith('demo_agent_')) {
      const agentId = clientId.replace('demo_agent_', '');
      console.log(`[Demo] Agent token issued for: ${agentId}`);

      const token = generateAgentToken(agentId, clientId);
      demoTokens.set(token.access_token, {
        agent_id: agentId,
        expires_at: Date.now() + token.expires_in * 1000,
      });

      return NextResponse.json(token);
    }

    // Verify credentials against database
    const agent = await verifyAgentCredentials(clientId, clientSecret);

    if (!agent) {
      return NextResponse.json(
        {
          error: 'invalid_client',
          error_description: 'Invalid client credentials',
        },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateAgentToken(agent.agent_id, clientId);

    // Update last token refresh timestamp
    await updateTokenRefresh(agent.agent_id);

    console.log(`[Auth] Agent token issued for: ${agent.agent_id}`);

    return NextResponse.json(token);
  } catch (error) {
    console.error('Agent token error:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        error_description: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Token introspection endpoint
 * POST /api/auth/agent/token with action=introspect
 */
export async function GET(request: NextRequest) {
  // Return token endpoint metadata
  return NextResponse.json({
    issuer: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    token_endpoint: '/api/auth/agent/token',
    grant_types_supported: ['client_credentials'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    scopes_supported: ['agent:read', 'agent:write', 'scan:submit'],
  });
}
