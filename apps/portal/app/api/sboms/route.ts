import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE}/api/sboms`, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`API Gateway error: ${response.status} ${response.statusText}`);
      // Return empty data structure if API is not available
      return NextResponse.json({
        components: [],
        total: 0,
        hasMore: false,
        scan_results: {
          total_scans: 0,
          projects: [],
          last_scan: null,
        },
      });
    }

    const data = await response.json();
    
    // Transform components to match frontend expectations
    if (data.components && Array.isArray(data.components)) {
      const transformedComponents = data.components.map((comp: any, idx: number) => {
        // Handle CycloneDX format
        if (comp.type && comp.name && comp.version) {
          return {
            id: comp.purl || comp.bomRef || `comp-${idx}`,
            name: comp.name,
            version: comp.version || 'unknown',
            type: comp.type.toLowerCase() || 'library',
            purl: comp.purl || '',
            license: comp.licenses?.[0]?.license?.id || comp.license || 'Unknown',
            description: comp.description || comp.name,
            vulnerabilities: comp.vulnerabilities?.length || 0,
            risk_level: comp.vulnerabilities?.length > 0 
              ? (comp.vulnerabilities.some((v: any) => v.ratings?.some((r: any) => r.severity === 'critical'))
                  ? 'critical'
                  : comp.vulnerabilities.some((v: any) => v.ratings?.some((r: any) => r.severity === 'high'))
                  ? 'high'
                  : 'medium')
              : 'low',
            last_updated: comp.updatedAt || new Date().toISOString(),
          };
        }
        // Handle already transformed format
        return comp;
      });

      return NextResponse.json({
        ...data,
        components: transformedComponents,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching SBOM data:', error);
    return NextResponse.json({
      components: [],
      total: 0,
      hasMore: false,
      scan_results: {
        total_scans: 0,
        projects: [],
        last_scan: null,
      },
      error: 'Failed to fetch SBOM data',
    }, { status: 500 });
  }
}


