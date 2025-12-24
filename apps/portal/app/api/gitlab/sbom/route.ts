import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GITLAB_BASE_URL = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
const GITLAB_TOKEN = process.env.GITLAB_TOKEN || process.env.GITLAB_API_TOKEN;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const jobId = searchParams.get('job_id');
    const pipelineId = searchParams.get('pipeline_id');

    if (!projectId || !jobId) {
      return NextResponse.json(
        { error: 'Missing project_id or job_id' },
        { status: 400 }
      );
    }

    // Try multiple SBOM artifact paths
    const artifactPaths = [
      'gl-sbom.cdx.json',
      'gl-sbom.cdx.json.gz',
      'gl-sbom-report.cdx.json',
      'sbom.cdx.json',
      'artifacts/gl-sbom.cdx.json',
    ];

    let sbomData = null;
    let usedPath = '';

    for (const path of artifactPaths) {
      try {
        const artifactUrl = `${GITLAB_BASE_URL}/api/v4/projects/${projectId}/jobs/${jobId}/artifacts/${path}`;
        
        const response = await fetch(artifactUrl, {
          headers: {
            'PRIVATE-TOKEN': GITLAB_TOKEN || '',
          },
        });

        if (response.ok) {
          let content = await response.text();
          
          // Handle gzip compression
          if (path.endsWith('.gz')) {
            // In browser, we'd need to decompress, but for now return the path
            // Backend should handle decompression
            return NextResponse.json({
              success: true,
              compressed: true,
              path: path,
              message: 'SBOM artifact found (compressed). Backend will decompress.',
            });
          }
          
          try {
            sbomData = JSON.parse(content);
            usedPath = path;
            break;
          } catch (e) {
            // Not JSON, continue to next path
            continue;
          }
        }
      } catch (error) {
        // Continue to next path
        continue;
      }
    }

    if (!sbomData) {
      return NextResponse.json(
        { error: 'SBOM artifact not found in any expected location' },
        { status: 404 }
      );
    }

    // Extract components from CycloneDX format
    const components = sbomData.components || [];
    
    return NextResponse.json({
      success: true,
      data: sbomData,
      components: components,
      component_count: components.length,
      artifact_path: usedPath,
    });
  } catch (error: any) {
    console.error('Error fetching SBOM:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch SBOM',
      },
      { status: 500 }
    );
  }
}


