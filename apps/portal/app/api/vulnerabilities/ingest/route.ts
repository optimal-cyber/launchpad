import { NextRequest, NextResponse } from 'next/server';
import { ingestVulnerabilities, ScannerConfig } from '@/lib/vulnerability-ingestion';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scanner_type, data } = body;

    if (!scanner_type || !data) {
      return NextResponse.json(
        { error: 'Missing scanner_type or data' },
        { status: 400 }
      );
    }

    // Validate scanner type
    const validScanners = ['nessus', 'tenable', 'trivy', 'snyk', 'aws_inspector', 'azure_defender', 'rapid7', 'gitlab'];
    if (!validScanners.includes(scanner_type)) {
      return NextResponse.json(
        { error: `Invalid scanner type. Must be one of: ${validScanners.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse vulnerabilities
    const findings = await ingestVulnerabilities(scanner_type as ScannerConfig['type'], data);

    // Forward to backend API gateway for storage
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
    try {
      const response = await fetch(`${API_BASE}/api/vulnerabilities/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanner_type,
          findings,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error('Backend ingestion failed:', await response.text());
      }
    } catch (error) {
      console.error('Error forwarding to backend:', error);
      // Continue even if backend fails
    }

    return NextResponse.json({
      success: true,
      findings_count: findings.length,
      findings,
      scanner_type,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error ingesting vulnerabilities:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to ingest vulnerabilities',
      },
      { status: 500 }
    );
  }
}


