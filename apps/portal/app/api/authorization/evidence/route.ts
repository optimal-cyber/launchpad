export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Real authorization evidence from flask-container-test pipelines
  const evidence = [
    {
      id: '2202794428',
      component: 'flask-container-test',
      project: 'r.gutwein/flask-container-test',
      pipeline_id: '2202794428',
      commit: 'd6a08cf1',
      status: 'authorized',
      compliance_score: 92,
      timestamp: new Date(Date.now() - 31 * 60 * 1000).toISOString(), // 31 minutes ago
      stages: [
        {
          name: 'build',
          status: 'passed',
          jobs: [
            { name: 'build', status: 'passed', duration: '9.87s' }
          ]
        },
        {
          name: 'test',
          status: 'passed',
          jobs: [
            { name: 'container_scanning', status: 'passed', duration: '182.13s', findings: 0 },
            { name: 'secret_detection', status: 'passed', duration: '6.45s', findings: 0 },
            { name: 'semgrep-sast', status: 'passed', duration: '13.95s', findings: 4 }
          ]
        },
        {
          name: 'sbom',
          status: 'passed',
          jobs: [
            { name: 'sbom_syft', status: 'passed', duration: '247.84s' }
          ]
        },
        {
          name: 'compliance',
          status: 'passed',
          jobs: [
            { name: 'compliance_trivy', status: 'passed', duration: '14.10s', findings: 2 }
          ]
        },
        {
          name: 'scorecard',
          status: 'warning',
          jobs: [
            { name: 'scorecard', status: 'warning', duration: '4.65s' }
          ]
        }
      ],
      artifacts: {
        sbom: true,
        vulnerabilities: true,
        secrets: true,
        compliance: true,
        scorecard: true
      }
    },
    {
      id: '1989745898',
      component: 'flask-container-test',
      project: 'r.gutwein/flask-container-test',
      pipeline_id: '1989745898',
      commit: '2f54fe0f',
      status: 'authorized',
      compliance_score: 94,
      timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months ago
      stages: [
        {
          name: 'build',
          status: 'passed',
          jobs: [
            { name: 'build', status: 'passed', duration: '08:02' }
          ]
        },
        {
          name: 'test',
          status: 'passed',
          jobs: [
            { name: 'container_scanning', status: 'passed', duration: '08:12', findings: 0 },
            { name: 'secret_detection', status: 'passed', duration: '08:01', findings: 0 },
            { name: 'semgrep-sast', status: 'passed', duration: '08:00', findings: 2 }
          ]
        },
        {
          name: 'sbom',
          status: 'passed',
          jobs: [
            { name: 'sbom_syft', status: 'passed', duration: '08:00' }
          ]
        },
        {
          name: 'compliance',
          status: 'warning',
          jobs: [
            { name: 'compliance_trivy', status: 'warning', duration: '08:01', findings: 3 }
          ]
        },
        {
          name: 'scorecard',
          status: 'warning',
          jobs: [
            { name: 'scorecard', status: 'warning', duration: '08:00' }
          ]
        }
      ],
      artifacts: {
        sbom: true,
        vulnerabilities: true,
        secrets: true,
        compliance: true,
        scorecard: true
      }
    }
  ];

  return NextResponse.json(evidence);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Store authorization evidence (in production, this would go to database)
    console.log('Received authorization evidence:', body);
    
    return NextResponse.json({
      status: 'success',
      message: 'Authorization evidence stored',
      id: body.pipeline_id
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to store authorization evidence' },
      { status: 500 }
    );
  }
}
