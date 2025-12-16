/**
 * API v1 Metrics Proxy
 * Proxies requests to the backend /api/v1/metrics aggregation endpoint
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE}/api/v1/metrics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API Gateway returned ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching metrics from API v1:', error);
    
    // Return fallback/empty metrics on error
    return NextResponse.json(
      {
        vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
        agents: { total: 0, active: 0, inactive: 0, error: 0 },
        sboms: { total: 0, components: 0, projects: 0 },
        scans: { total: 0, last_24h: 0, last_scan: null },
        last_updated: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

