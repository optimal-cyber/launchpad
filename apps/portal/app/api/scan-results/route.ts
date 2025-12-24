import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE}/api/scan-results`, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`API Gateway error: ${response.status} ${response.statusText}`);
      // Return empty array if API is not available
      return NextResponse.json({
        scan_results: [],
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching scan results:', error);
    return NextResponse.json({
      scan_results: [],
      error: 'Failed to fetch scan results',
    });
  }
}


