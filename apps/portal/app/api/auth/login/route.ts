export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

// Auth service URL - defaults to internal K8s service
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:8004';

// Demo mode enabled when no auth service is configured or in development
const isDemoMode = process.env.NODE_ENV === 'development' ||
  process.env.DEMO_MODE === 'true' ||
  !process.env.AUTH_SERVICE_URL;

// Demo users for development
const DEMO_USERS: Record<string, { password: string; name: string; roles: string[] }> = {
  'admin@optimal.com': { password: 'admin123', name: 'Admin User', roles: ['admin', 'user'] },
  'demo@optimal.com': { password: 'demo123', name: 'Demo User', roles: ['user'] },
  'security@optimal.com': { password: 'security123', name: 'Security Analyst', roles: ['security', 'user'] },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Demo mode - authenticate against local demo users
    if (isDemoMode) {
      // Accept any email/password in demo mode for convenience
      const demoUser = DEMO_USERS[email?.toLowerCase()];

      if (demoUser && demoUser.password === password) {
        // Correct demo credentials
        return NextResponse.json({
          access_token: `demo_token_${Date.now()}`,
          refresh_token: `demo_refresh_${Date.now()}`,
          expires_in: 86400, // 24 hours
          token_type: 'Bearer',
          user: {
            sub: `demo-${email}`,
            email: email,
            name: demoUser.name,
            preferred_username: email.split('@')[0],
            roles: demoUser.roles,
          },
        });
      }

      // In demo mode, allow any credentials with warning
      console.log('[Demo Mode] Allowing login for:', email);
      return NextResponse.json({
        access_token: `demo_token_${Date.now()}`,
        refresh_token: `demo_refresh_${Date.now()}`,
        expires_in: 86400,
        token_type: 'Bearer',
        user: {
          sub: `demo-${email}`,
          email: email || 'demo@optimal.com',
          name: email ? email.split('@')[0] : 'Demo User',
          preferred_username: email ? email.split('@')[0] : 'demo',
          roles: ['user'],
        },
      });
    }

    // Production mode - forward to auth service
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { detail: errorData.detail || 'Login failed' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Login error:', error);

    // Fallback to demo mode on connection errors
    if (isDemoMode || (error as Error).message?.includes('ECONNREFUSED')) {
      const body = await request.clone().json().catch(() => ({}));
      console.log('[Fallback Demo Mode] Auth service unavailable, using demo auth');
      return NextResponse.json({
        access_token: `demo_token_${Date.now()}`,
        refresh_token: `demo_refresh_${Date.now()}`,
        expires_in: 86400,
        token_type: 'Bearer',
        user: {
          sub: 'demo-user',
          email: body.email || 'demo@optimal.com',
          name: 'Demo User',
          preferred_username: 'demo',
          roles: ['user'],
        },
      });
    }

    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

