export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

// Use internal URL for backend calls (K8s service), fallback to public URL
const KEYCLOAK_INTERNAL_URL = process.env.KEYCLOAK_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_KEYCLOAK_URL ||
  'http://keycloak.keycloak.svc.cluster.local:8080';
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'optimal';
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'optimal-portal';
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const { code, code_verifier } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    // Exchange code for token with Keycloak
    const tokenUrl = `${KEYCLOAK_INTERNAL_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

    // Build form data - use PKCE code_verifier if provided, otherwise use client_secret
    const formParams: Record<string, string> = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost'}/auth/callback`,
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
