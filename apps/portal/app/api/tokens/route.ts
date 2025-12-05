import { NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory storage for demo (use database in production)
const apiTokens: Map<string, any> = new Map();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      name,
      description,
      scopes,
      expires_in_days
    } = body;

    // Generate a secure token
    const tokenValue = `opt_${crypto.randomBytes(24).toString('hex')}`;
    const tokenId = crypto.randomUUID();
    
    // Calculate expiration
    const expiresAt = expires_in_days 
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Store token metadata (hash the actual token for security)
    const tokenHash = crypto.createHash('sha256').update(tokenValue).digest('hex');
    
    const token = {
      id: tokenId,
      name: name || 'API Token',
      description: description || '',
      token_prefix: tokenValue.substring(0, 12) + '...',
      token_hash: tokenHash,
      scopes: scopes || ['read', 'write', 'scan'],
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      last_used: null,
      status: 'active'
    };

    apiTokens.set(tokenId, token);

    console.log(`API token created: ${tokenId} (${name})`);

    // Return the full token only on creation
    return NextResponse.json({
      success: true,
      token: {
        id: tokenId,
        value: tokenValue, // Only returned on creation!
        name: token.name,
        scopes: token.scopes,
        created_at: token.created_at,
        expires_at: token.expires_at
      },
      message: 'Token created successfully. Save this token - it will not be shown again.'
    });

  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const tokens = Array.from(apiTokens.values()).map(token => ({
      id: token.id,
      name: token.name,
      description: token.description,
      token_prefix: token.token_prefix,
      scopes: token.scopes,
      created_at: token.created_at,
      expires_at: token.expires_at,
      last_used: token.last_used,
      status: token.status
    }));

    return NextResponse.json({
      success: true,
      count: tokens.length,
      tokens
    });

  } catch (error) {
    console.error('Error listing tokens:', error);
    return NextResponse.json(
      { error: 'Failed to list tokens' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('id');

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    if (!apiTokens.has(tokenId)) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    apiTokens.delete(tokenId);

    return NextResponse.json({
      success: true,
      message: 'Token revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking token:', error);
    return NextResponse.json(
      { error: 'Failed to revoke token' },
      { status: 500 }
    );
  }
}

