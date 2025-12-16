import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE}/api/vulns`, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`API Gateway error: ${response.status} ${response.statusText}`);
      return NextResponse.json({
        vulnerabilities: [],
        total: 0,
        hasMore: false,
      });
    }

    const data = await response.json();
    
    // Ensure vulnerabilities array exists
    const vulnerabilities = data.vulnerabilities || [];
    
    return NextResponse.json({
      vulnerabilities,
      total: vulnerabilities.length,
      hasMore: false,
      scan_results: data.scan_results || {},
    });
  } catch (error) {
    console.error('Error fetching vulnerabilities:', error);
    return NextResponse.json({
      vulnerabilities: [],
      total: 0,
      hasMore: false,
      error: 'Failed to fetch vulnerabilities',
    }, { status: 500 });
  }
}

