export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Scan Ingestion Endpoint
 * Receives security scan results from GitLab pipelines
 */

interface ScanIngestion {
  scan_id?: string;
  agent_id?: string;
  timestamp?: string;
  target_type?: string;
  target?: string;
  findings?: any[];
  summary?: any;
  metadata?: any;
  grype?: any;
  project?: any;
  source?: any;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const apiToken = request.headers.get('x-optimal-token');
    
    if (!authHeader && !apiToken) {
      return NextResponse.json(
        { error: 'Unauthorized - missing API token' },
        { status: 401 }
      );
    }

    const body: ScanIngestion = await request.json();
    
    // Log the ingestion
    console.log('📥 Scan ingestion received:', {
      scan_id: body.scan_id,
      target: body.target,
      findings: body.findings?.length || 0,
      project: body.project?.name || 'unknown'
    });

    // Store scan results (in production, this would go to database)
    const scan_id = body.scan_id || `scan_${Date.now()}`;
    const timestamp = body.timestamp || new Date().toISOString();
    
    // Calculate metrics
    const summary = body.summary || {
      critical: body.findings?.filter((f: any) => f.severity === 'CRITICAL').length || 0,
      high: body.findings?.filter((f: any) => f.severity === 'HIGH').length || 0,
      medium: body.findings?.filter((f: any) => f.severity === 'MEDIUM').length || 0,
      low: body.findings?.filter((f: any) => f.severity === 'LOW').length || 0,
      total: body.findings?.length || 0
    };

    // Store in database (PostgreSQL)
    // In production: await storeInDatabase(body);
    
    // Update metrics for Prometheus
    // In production: await updatePrometheusMetrics(summary);
    
    // Send to Elasticsearch for logging
    // In production: await sendToElasticsearch(body);
    
    // Check if this triggers any alerts
    if (summary.critical > 0) {
      console.log('🚨 CRITICAL vulnerabilities detected!');
      // In production: await sendAlert('critical', summary);
    }

    // Update authorization status if this is a pipeline scan
    if (body.source?.pipeline_id) {
      console.log('🔐 Updating authorization status for pipeline:', body.source.pipeline_id);
      // In production: await updateAuthorizationStatus(body);
    }

    return NextResponse.json({
      status: 'success',
      message: 'Scan results ingested successfully',
      scan_id: scan_id,
      timestamp: timestamp,
      summary: summary,
      authorization: {
        status: summary.critical > 0 ? 'rejected' : summary.high > 5 ? 'pending' : 'authorized',
        compliance_score: calculateComplianceScore(summary),
        message: getAuthorizationMessage(summary)
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Scan ingestion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to ingest scan results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function calculateComplianceScore(summary: any): number {
  const total = summary.total || 0;
  if (total === 0) return 100;
  
  const weighted = 
    (summary.critical || 0) * 10 +
    (summary.high || 0) * 5 +
    (summary.medium || 0) * 2 +
    (summary.low || 0) * 1;
  
  const maxScore = 100;
  const deduction = Math.min(weighted, maxScore);
  
  return Math.max(0, maxScore - deduction);
}

function getAuthorizationMessage(summary: any): string {
  if (summary.critical > 0) {
    return `Deployment blocked: ${summary.critical} critical vulnerabilities must be resolved`;
  }
  if (summary.high > 5) {
    return `Manual review required: ${summary.high} high severity vulnerabilities detected`;
  }
  if (summary.high > 0 || summary.medium > 0) {
    return `Authorized with findings: remediation recommended for ${summary.high} high and ${summary.medium} medium severity issues`;
  }
  return 'Component fully authorized for deployment';
}

export async function GET(request: NextRequest) {
  // Return recent scans
  return NextResponse.json({
    message: 'Scan ingestion endpoint',
    status: 'operational',
    recent_scans: []
  });
}


