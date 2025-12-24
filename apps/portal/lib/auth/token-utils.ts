/**
 * Token Utilities
 * Shared functions for agent token generation and verification
 */
import crypto from 'crypto';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'optimal-agent-jwt-secret-change-in-production';
const TOKEN_TTL = parseInt(process.env.AGENT_TOKEN_TTL || '300', 10); // 5 minutes default

/**
 * Simple JWT-like token generation
 * In production, use a proper JWT library or delegate to Keycloak
 */
export function generateAgentToken(agentId: string, clientId: string): {
  access_token: string;
  token_type: string;
  expires_in: number;
} {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + TOKEN_TTL;

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: agentId,
      client_id: clientId,
      type: 'agent',
      iat: issuedAt,
      exp: expiresAt,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const accessToken = `${header}.${payload}.${signature}`;

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: TOKEN_TTL,
  };
}

/**
 * Verify a JWT-like token
 */
export function verifyAgentToken(token: string): {
  valid: boolean;
  agent_id?: string;
  client_id?: string;
  error?: string;
} {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [header, payload, signature] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Decode payload
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());

    // Check expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }

    // Check token type
    if (decoded.type !== 'agent') {
      return { valid: false, error: 'Invalid token type' };
    }

    return {
      valid: true,
      agent_id: decoded.sub,
      client_id: decoded.client_id,
    };
  } catch {
    return { valid: false, error: 'Token parsing failed' };
  }
}
