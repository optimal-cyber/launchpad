import { NextResponse } from 'next/server';

// In-memory storage for demo (use database in production)
const scanResults: any[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      scan_id,
      agent_id,
      timestamp,
      target_type,
      target,
      findings,
      summary,
      metadata,
      grype,
      project,
      source
    } = body;

    // Validate required fields
    if (!scan_id || !target) {
      return NextResponse.json(
        { error: 'scan_id and target are required' },
        { status: 400 }
      );
    }

    // Process and store the scan result
    const scanResult = {
      id: scan_id,
      scan_id,
      agent_id: agent_id || 'api-upload',
      timestamp: timestamp || new Date().toISOString(),
      target_type: target_type || 'image',
      target,
      findings: findings || [],
      summary: summary || {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: findings?.length || 0
      },
      metadata: metadata || {},
      project: project || {
        gitlab_project_id: Math.floor(Math.random() * 1000000),
        name: target.split('/').pop()?.split(':')[0] || target
      },
      source: source || {
        pipeline_id: Date.now(),
        job_id: Date.now() + 1,
        sha: 'manual-upload'
      },
      received_at: new Date().toISOString()
    };

    // Calculate summary if not provided
    if (!summary && findings) {
      scanResult.summary = {
        critical: findings.filter((f: any) => f.severity?.toLowerCase() === 'critical').length,
        high: findings.filter((f: any) => f.severity?.toLowerCase() === 'high').length,
        medium: findings.filter((f: any) => f.severity?.toLowerCase() === 'medium').length,
        low: findings.filter((f: any) => f.severity?.toLowerCase() === 'low').length,
        total: findings.length
      };
    }

    // Store the scan result
    scanResults.push(scanResult);

    // Keep only last 1000 results in memory (demo limitation)
    if (scanResults.length > 1000) {
      scanResults.shift();
    }

    console.log(`Scan ingested: ${scan_id} - ${target} (${scanResult.summary.total} findings)`);

    return NextResponse.json({
      success: true,
      scan_id,
      message: 'Scan results ingested successfully',
      summary: scanResult.summary,
      received_at: scanResult.received_at
    });

  } catch (error) {
    console.error('Error ingesting scan:', error);
    return NextResponse.json(
      { error: 'Failed to ingest scan results' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const target = searchParams.get('target');
    const agent_id = searchParams.get('agent_id');

    let results = [...scanResults];

    // Filter by target if provided
    if (target) {
      results = results.filter(r => r.target.includes(target));
    }

    // Filter by agent if provided
    if (agent_id) {
      results = results.filter(r => r.agent_id === agent_id);
    }

    // Sort by timestamp descending and limit
    results = results
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: results.length,
      total: scanResults.length,
      scans: results
    });

  } catch (error) {
    console.error('Error listing scans:', error);
    return NextResponse.json(
      { error: 'Failed to list scans' },
      { status: 500 }
    );
  }
}

