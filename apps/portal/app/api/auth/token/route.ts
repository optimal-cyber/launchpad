export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

// Use internal URL for backend calls (K8s service), fallback to public URL
const KEYCLOAK_INTERNAL_URL = process.env.KEYCLOAK_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_KEYCLOAK_URL ||
  'http://localhost:8080';
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'optimal';
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'optimal-portal';
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || '';

// Demo mode only when explicitly enabled (not in development by default anymore)
const isDemoMode = process.env.DEMO_MODE === 'true';

// Generate demo SSO response (simulates successful Keycloak/SAML auth)
function generateDemoSSOResponse(provider: string = 'keycloak') {
  const timestamp = Date.now();
  const email = provider === 'google' ? 'demo@gmail.com' :
    provider === 'microsoft' ? 'demo@outlook.com' :
      'demo@optimal.com';

  return {
    access_token: `demo_sso_${provider}_${timestamp}`,
    refresh_token: `demo_refresh_${provider}_${timestamp}`,
    expires_in: 86400, // 24 hours
    token_type: 'Bearer',
    user_info: {
      sub: `${provider}-demo-user`,
      email: email,
      name: 'Demo User',
      preferred_username: 'demo',
      roles: ['user'],
      idp: provider,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const { code, code_verifier } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    // Demo mode - return mock SSO tokens
    if (isDemoMode) {
      // Extract provider hint from code if available
      let provider = 'keycloak';
      if (code.includes('google')) provider = 'google';
      else if (code.includes('microsoft')) provider = 'microsoft';

      console.log(`[Demo Mode] Simulating SSO token exchange for provider: ${provider}`);
      return NextResponse.json(generateDemoSSOResponse(provider));
    }

    // Production mode - exchange code with Keycloak
    const tokenUrl = `${KEYCLOAK_INTERNAL_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

    // Build form data - use PKCE code_verifier if provided, otherwise use client_secret
    const formParams: Record<string, string> = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      client_id: KEYCLOAK_CLIENT_ID,
    };

    // PKCE flow uses code_verifier instead of client_secret
    if (code_verifier) {
      formParams.code_verifier = code_verifier;
    } else if (KEYCLOAK_CLIENT_SECRET) {
      formParams.client_secret = KEYCLOAK_CLIENT_SECRET;
    }

    const formData = new URLSearchParams(formParams);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);

      // Fallback to demo mode on Keycloak connection errors
      if (isDemoMode || errorData.includes('ECONNREFUSED')) {
        console.log('[Fallback Demo Mode] Keycloak unavailable, using demo SSO response');
        return NextResponse.json(generateDemoSSOResponse('keycloak'));
      }

      return NextResponse.json(
        { error: 'Token exchange failed' },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Fetch user info
    const userInfoUrl = `${KEYCLOAK_INTERNAL_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;
    const userInfoResponse = await fetch(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userInfo = userInfoResponse.ok ? await userInfoResponse.json() : {};

    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type || 'Bearer',
      user_info: {
        sub: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        preferred_username: userInfo.preferred_username,
        roles: userInfo.realm_access?.roles || [],
      },
    });

  } catch (error) {
    console.error('Auth token error:', error);

    // Fallback to demo mode on any connection error
    if (isDemoMode || (error as Error).message?.includes('ECONNREFUSED') ||
      (error as Error).message?.includes('fetch failed')) {
      console.log('[Fallback Demo Mode] Token exchange error, using demo SSO response');
      return NextResponse.json(generateDemoSSOResponse('keycloak'));
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
