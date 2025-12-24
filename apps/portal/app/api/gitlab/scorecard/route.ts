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

    // Fetch scorecard artifact from GitLab
    const artifactUrl = `${GITLAB_BASE_URL}/api/v4/projects/${projectId}/jobs/${jobId}/artifacts/scorecard.json`;
    
    const response = await fetch(artifactUrl, {
      headers: {
        'PRIVATE-TOKEN': GITLAB_TOKEN || '',
      },
    });

    if (!response.ok) {
      // Try alternative paths
      const altUrl = `${GITLAB_BASE_URL}/api/v4/projects/${projectId}/jobs/${jobId}/artifacts/artifacts/scorecard.json`;
      const altResponse = await fetch(altUrl, {
        headers: {
          'PRIVATE-TOKEN': GITLAB_TOKEN || '',
        },
      });

      if (!altResponse.ok) {
        return NextResponse.json(
          { error: 'Scorecard artifact not found' },
          { status: 404 }
        );
      }

      const scorecardData = await altResponse.json();
      return NextResponse.json({
        success: true,
        data: scorecardData,
      });
    }

    const scorecardData = await response.json();
    
    return NextResponse.json({
      success: true,
      data: scorecardData,
    });
  } catch (error: any) {
    console.error('Error fetching scorecard:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch scorecard',
      },
      { status: 500 }
    );
  }
}


