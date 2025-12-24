/**
 * Agent Authentication Middleware
 * Validates agent tokens for protected API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentToken } from '@/lib/auth/token-utils';
import { getAgentByAgentId } from '@/lib/db/agent-repository';

export interface AgentAuthContext {
  agent_id: string;
  client_id: string;
  agent_type?: string;
  environment?: string;
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Authenticate an agent request
 * Returns the agent context if authenticated, null otherwise
 */
export async function authenticateAgent(
  request: NextRequest
): Promise<AgentAuthContext | null> {
  const token = extractBearerToken(request);

  if (!token) {
    return null;
  }

  // Verify the token
  const verification = verifyAgentToken(token);

  if (!verification.valid || !verification.agent_id) {
    console.log(`[AgentAuth] Token verification failed: ${verification.error}`);
    return null;
  }

  // Optionally fetch full agent info
  try {
    const agent = await getAgentByAgentId(verification.agent_id);
    if (agent) {
      return {
        agent_id: verification.agent_id,
        client_id: verification.client_id || '',
        agent_type: agent.agent_type,
        environment: agent.environment || undefined,
      };
    }
  } catch {
    // Agent not found in DB, but token is valid (demo mode)
  }

  return {
    agent_id: verification.agent_id,
    client_id: verification.client_id || '',
  };
}

/**
 * Higher-order function to protect API routes with agent authentication
 * Usage:
 *   export const POST = withAgentAuth(async (request, context) => {
 *     const { agent_id } = context;
 *     // ... handler logic
 *   });
 */
export function withAgentAuth<T>(
  handler: (
    request: NextRequest,
    context: AgentAuthContext
  ) => Promise<NextResponse<T>>
): (request: NextRequest) => Promise<NextResponse<T | { error: string }>> {
  return async (request: NextRequest) => {
    const agentContext = await authenticateAgent(request);

    if (!agentContext) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing agent token' },
        { status: 401 }
      ) as NextResponse<{ error: string }>;
    }

    return handler(request, agentContext);
  };
}

/**
 * Require specific agent capabilities for an endpoint
 */
export function requireCapabilities(
  capabilities: string[]
): (
  handler: (
    request: NextRequest,
    context: AgentAuthContext
  ) => Promise<NextResponse>
) => (request: NextRequest) => Promise<NextResponse> {
  return (handler) => {
    return withAgentAuth(async (request, context) => {
      // Fetch agent to check capabilities
      const agent = await getAgentByAgentId(context.agent_id);

      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }

      const hasAllCapabilities = capabilities.every((cap) =>
        agent.capabilities.includes(cap)
      );

      if (!hasAllCapabilities) {
        return NextResponse.json(
          {
            error: 'Forbidden: Agent lacks required capabilities',
            required: capabilities,
            has: agent.capabilities,
          },
          { status: 403 }
        );
      }

      return handler(request, context);
    });
  };
}

/**
 * Validate agent is from specific environment
 */
export function requireEnvironment(
  allowedEnvironments: string[]
): (
  handler: (
    request: NextRequest,
    context: AgentAuthContext
  ) => Promise<NextResponse>
) => (request: NextRequest) => Promise<NextResponse> {
  return (handler) => {
    return withAgentAuth(async (request, context) => {
      if (
        context.environment &&
        !allowedEnvironments.includes(context.environment)
      ) {
        return NextResponse.json(
          {
            error: 'Forbidden: Agent environment not allowed',
            allowed: allowedEnvironments,
            current: context.environment,
          },
          { status: 403 }
        );
      }

      return handler(request, context);
    });
  };
}

/**
 * Rate limiting for agent requests (simple in-memory implementation)
 * In production, use Redis or a proper rate limiter
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window

export function withRateLimit(
  maxRequests: number = RATE_LIMIT_MAX
): (
  handler: (
    request: NextRequest,
    context: AgentAuthContext
  ) => Promise<NextResponse>
) => (request: NextRequest) => Promise<NextResponse> {
  return (handler) => {
    return withAgentAuth(async (request, context) => {
      const key = context.agent_id;
      const now = Date.now();

      let record = rateLimitMap.get(key);

      if (!record || record.resetAt < now) {
        record = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
        rateLimitMap.set(key, record);
      }

      record.count++;

      if (record.count > maxRequests) {
        return NextResponse.json(
          {
            error: 'Too Many Requests',
            retry_after: Math.ceil((record.resetAt - now) / 1000),
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((record.resetAt - now) / 1000)),
              'X-RateLimit-Limit': String(maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.ceil(record.resetAt / 1000)),
            },
          }
        );
      }

      const response = await handler(request, context);

      // Add rate limit headers
      const headers = new Headers(response.headers);
      headers.set('X-RateLimit-Limit', String(maxRequests));
      headers.set('X-RateLimit-Remaining', String(maxRequests - record.count));
      headers.set('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    });
  };
}
