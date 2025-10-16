import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { detail: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Forward the request to the auth service
    const response = await fetch('http://auth-service:8004/auth/me', {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const errorData = await response.json();
      return NextResponse.json(
        { detail: errorData.detail || 'Authentication failed' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

