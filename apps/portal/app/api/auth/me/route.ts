export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

// Auth service URL - defaults to internal K8s service
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:8004';

// Demo mode enabled when no auth service is configured or in development
const isDemoMode = process.env.NODE_ENV === 'development' ||
  process.env.DEMO_MODE === 'true' ||
  !process.env.AUTH_SERVICE_URL;

// Parse demo token to extract user info
function parseDemoToken(token: string): { email: string; name: string } | null {
  // Demo tokens are in format: demo_token_<timestamp> or Bearer demo_token_<timestamp>
  if (token.includes('demo_token') || token.includes('demo')) {
    return {
      email: 'demo@optimal.com',
      name: 'Demo User',
    };
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { detail: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Demo mode - validate demo tokens locally
    if (isDemoMode) {
      const demoUser = parseDemoToken(token);

      if (demoUser || token.startsWith('demo')) {
        // Return demo user info
        return NextResponse.json({
          sub: 'demo-user',
          email: demoUser?.email || 'demo@optimal.com',
          name: demoUser?.name || 'Demo User',
          preferred_username: 'demo',
          roles: ['user'],
          email_verified: true,
        });
      }

      // In demo mode, accept any token as valid
      console.log('[Demo Mode] Accepting token for /me endpoint');
      return NextResponse.json({
        sub: 'demo-user',
        email: 'demo@optimal.com',
        name: 'Demo User',
        preferred_username: 'demo',
        roles: ['user'],
        email_verified: true,
      });
    }

    // Production mode - forward to auth service
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/me`, {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { detail: errorData.detail || 'Authentication failed' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Auth /me error:', error);

    // Fallback to demo mode on connection errors
    if (isDemoMode || (error as Error).message?.includes('ECONNREFUSED')) {
      console.log('[Fallback Demo Mode] Auth service unavailable, returning demo user');
      return NextResponse.json({
        sub: 'demo-user',
        email: 'demo@optimal.com',
        name: 'Demo User',
        preferred_username: 'demo',
        roles: ['user'],
        email_verified: true,
      });
    }

    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

