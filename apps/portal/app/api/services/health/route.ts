import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceKey = searchParams.get('key');
    
    if (!serviceKey) {
      return NextResponse.json(
        { error: 'Service key is required' },
        { status: 400 }
      );
    }

    // For MVP, return mock health status
    // In production, this would check actual service health
    const mockHealthStatus: { [key: string]: string } = {
      'gitlab': 'ACTIVE',
      'harbor': 'ACTIVE', 
      'grafana': 'ACTIVE',
      'argo': 'ACTIVE',
      'superset': 'DEGRADED',
      'kubecost': 'OFFLINE',
      'jira': 'ACTIVE',
      'confluence': 'ACTIVE',
      'rocketchat': 'ACTIVE',
      'slack': 'ACTIVE',
      'kion': 'ACTIVE',
      'drawio': 'ACTIVE'
    };

    const status = mockHealthStatus[serviceKey] || 'UNKNOWN';
    const message = status === 'ACTIVE' ? 'Service is responding normally' : 
                   status === 'DEGRADED' ? 'Service has performance issues' :
                   status === 'OFFLINE' ? 'Service is not responding' : 'Status unknown';

    return NextResponse.json({
      service: serviceKey,
      status,
      message,
      timestamp: new Date().toISOString(),
      note: 'Mock health status - external health checks not implemented in MVP'
    });

  } catch (error) {
    console.error('Service health check error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
