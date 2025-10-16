import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    const projectId = searchParams.get('project_id');

    if (!jobId) {
      return NextResponse.json(
        { error: 'job_id parameter is required' },
        { status: 400 }
      );
    }

    // Forward request to the backend API Gateway
    const params = new URLSearchParams({ job_id: jobId });
    if (projectId) {
      params.append('project_id', projectId);
    }

    const response = await fetch(`http://api-gateway:8000/gitlab/test/fetch?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GitLab test fetch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from GitLab' },
      { status: 500 }
    );
  }
}
