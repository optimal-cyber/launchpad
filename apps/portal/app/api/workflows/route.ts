import { NextRequest, NextResponse } from 'next/server';
import type {
  Workflow,
  WorkflowStep,
  WorkflowExecution,
  WorkflowStatus,
  StepStatus
} from '@/lib/agent-orchestration-types';

// Demo workflows
const demoWorkflows: Workflow[] = [
  {
    id: 'wf-vuln-scan',
    name: 'Comprehensive Vulnerability Scan',
    description: 'Multi-stage vulnerability scanning workflow with SBOM generation and reporting',
    status: 'active',
    steps: [
      {
        id: 'step-1',
        name: 'Generate SBOM',
        type: 'agent',
        agentId: 'agent-sbom-scanner',
        action: 'generate_sbom',
        inputs: { target: '{{trigger.repository}}' },
        outputs: ['sbom_data'],
        status: 'pending',
        order: 1
      },
      {
        id: 'step-2',
        name: 'Scan for Vulnerabilities',
        type: 'agent',
        agentId: 'agent-vuln-scanner',
        action: 'vulnerability_scan',
        inputs: { sbom: '{{step_1.sbom_data}}' },
        outputs: ['vulnerabilities'],
        status: 'pending',
        order: 2
      },
      {
        id: 'step-3',
        name: 'Check Severity',
        type: 'condition',
        condition: {
          type: 'greater_than',
          left: '{{step_2.vulnerabilities.critical_count}}',
          right: '0'
        },
        inputs: {},
        outputs: ['has_critical'],
        status: 'pending',
        order: 3
      },
      {
        id: 'step-4',
        name: 'Generate Report',
        type: 'agent',
        agentId: 'agent-reporter',
        action: 'generate_report',
        inputs: {
          sbom: '{{step_1.sbom_data}}',
          vulnerabilities: '{{step_2.vulnerabilities}}',
          critical_alert: '{{step_3.has_critical}}'
        },
        outputs: ['report_url'],
        status: 'pending',
        order: 4
      }
    ],
    variables: {},
    triggers: [
      { type: 'manual', config: {} },
      { type: 'schedule', config: { schedule: '0 2 * * *' } },
      { type: 'webhook', config: { webhookPath: '/api/webhooks/scan' } }
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin@optimal.com'
  },
  {
    id: 'wf-ai-assessment',
    name: 'AI Model Security Assessment',
    description: 'Automated assessment of AI models against OWASP AISVS and NIST AI RMF frameworks',
    status: 'active',
    steps: [
      {
        id: 'step-1',
        name: 'Discover AI Models',
        type: 'agent',
        agentId: 'agent-ai-discovery',
        action: 'discover_models',
        inputs: { sources: ['huggingface', 'local', 'ollama'] },
        outputs: ['models'],
        status: 'pending',
        order: 1
      },
      {
        id: 'step-2',
        name: 'Parallel Assessments',
        type: 'parallel',
        parallelSteps: ['step-2a', 'step-2b', 'step-2c'],
        inputs: {},
        outputs: [],
        status: 'pending',
        order: 2
      },
      {
        id: 'step-2a',
        name: 'AISVS Compliance Check',
        type: 'agent',
        agentId: 'agent-ai-security',
        action: 'aisvs_assessment',
        inputs: { models: '{{step_1.models}}' },
        outputs: ['aisvs_scores'],
        status: 'pending',
        order: 2
      },
      {
        id: 'step-2b',
        name: 'NIST AI RMF Evaluation',
        type: 'agent',
        agentId: 'agent-ai-security',
        action: 'nist_assessment',
        inputs: { models: '{{step_1.models}}' },
        outputs: ['nist_scores'],
        status: 'pending',
        order: 2
      },
      {
        id: 'step-2c',
        name: 'Red Team Testing',
        type: 'agent',
        agentId: 'agent-ai-redteam',
        action: 'run_redteam',
        inputs: { models: '{{step_1.models}}' },
        outputs: ['redteam_results'],
        status: 'pending',
        order: 2
      },
      {
        id: 'step-3',
        name: 'Compile Assessment Report',
        type: 'agent',
        agentId: 'agent-reporter',
        action: 'compile_ai_report',
        inputs: {
          models: '{{step_1.models}}',
          aisvs: '{{step_2a.aisvs_scores}}',
          nist: '{{step_2b.nist_scores}}',
          redteam: '{{step_2c.redteam_results}}'
        },
        outputs: ['assessment_report'],
        status: 'pending',
        order: 3
      }
    ],
    variables: {},
    triggers: [
      { type: 'manual', config: {} },
      { type: 'schedule', config: { schedule: '0 0 * * 0' } }
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'security@optimal.com'
  },
  {
    id: 'wf-container-security',
    name: 'Container Security Pipeline',
    description: 'CI/CD integrated container security scanning and compliance validation',
    status: 'active',
    steps: [
      {
        id: 'step-1',
        name: 'Pull Container Image',
        type: 'agent',
        agentId: 'agent-container-scanner',
        action: 'pull_image',
        inputs: { image: '{{trigger.image_ref}}' },
        outputs: ['image_digest'],
        status: 'pending',
        order: 1
      },
      {
        id: 'step-2',
        name: 'Scan Image Layers',
        type: 'agent',
        agentId: 'agent-container-scanner',
        action: 'scan_layers',
        inputs: { digest: '{{step_1.image_digest}}' },
        outputs: ['layer_analysis'],
        status: 'pending',
        order: 2
      },
      {
        id: 'step-3',
        name: 'Check Compliance',
        type: 'agent',
        agentId: 'agent-compliance',
        action: 'validate_compliance',
        inputs: {
          analysis: '{{step_2.layer_analysis}}',
          policies: ['CIS', 'NIST-800-53', 'FedRAMP']
        },
        outputs: ['compliance_status'],
        status: 'pending',
        order: 3
      },
      {
        id: 'step-4',
        name: 'Create POAM if Non-Compliant',
        type: 'condition',
        condition: {
          type: 'equals',
          left: '{{step_3.compliance_status.passed}}',
          right: 'false'
        },
        inputs: {},
        outputs: ['needs_poam'],
        status: 'pending',
        order: 4
      },
      {
        id: 'step-5',
        name: 'Generate POAM',
        type: 'agent',
        agentId: 'agent-poam',
        action: 'create_poam',
        inputs: { findings: '{{step_3.compliance_status.findings}}' },
        outputs: ['poam_id'],
        status: 'pending',
        order: 5
      }
    ],
    variables: {},
    triggers: [
      { type: 'webhook', config: { webhookPath: '/api/webhooks/container-push' } },
      { type: 'event', config: { eventType: 'container.pushed', eventFilter: { registry: 'production' } } }
    ],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin@optimal.com'
  },
  {
    id: 'wf-incident-response',
    name: 'Automated Incident Response',
    description: 'Automated triage and initial response for security incidents',
    status: 'active',
    steps: [
      {
        id: 'step-1',
        name: 'Classify Incident',
        type: 'agent',
        agentId: 'agent-incident-triage',
        action: 'classify',
        inputs: { alert: '{{trigger.alert_data}}' },
        outputs: ['classification'],
        status: 'pending',
        order: 1
      },
      {
        id: 'step-2',
        name: 'Gather Context',
        type: 'agent',
        agentId: 'agent-context-collector',
        action: 'gather_context',
        inputs: {
          classification: '{{step_1.classification}}',
          affected_assets: '{{trigger.affected_assets}}'
        },
        outputs: ['context_data'],
        status: 'pending',
        order: 2
      },
      {
        id: 'step-3',
        name: 'Execute Playbook',
        type: 'agent',
        agentId: 'agent-playbook-executor',
        action: 'execute_playbook',
        inputs: {
          playbook: '{{step_1.classification.recommended_playbook}}',
          context: '{{step_2.context_data}}'
        },
        outputs: ['response_actions'],
        status: 'pending',
        order: 3
      },
      {
        id: 'step-4',
        name: 'Create Incident Report',
        type: 'agent',
        agentId: 'agent-reporter',
        action: 'create_incident_report',
        inputs: {
          classification: '{{step_1.classification}}',
          context: '{{step_2.context_data}}',
          actions: '{{step_3.response_actions}}'
        },
        outputs: ['incident_report'],
        status: 'pending',
        order: 4
      }
    ],
    variables: {},
    triggers: [
      { type: 'event', config: { eventType: 'security.alert', eventFilter: { severity: ['critical', 'high'] } } }
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'security@optimal.com'
  }
];

// Demo workflow executions
const demoExecutions: WorkflowExecution[] = [
  {
    id: 'exec-1',
    workflowId: 'wf-vuln-scan',
    status: 'completed',
    variables: { repository: 'optimal-platform/portal' },
    stepResults: {
      'step-1': { sbom_data: { packages: 245, ecosystems: ['npm', 'pip'] } },
      'step-2': { vulnerabilities: { total: 12, critical: 2, high: 4, medium: 6 } },
      'step-3': { has_critical: true },
      'step-4': { report_url: '/reports/scan-20241218-001.pdf' }
    },
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    logs: [
      { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), level: 'info', message: 'Workflow started' },
      { timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), level: 'info', stepId: 'step-1', message: 'SBOM generation completed' },
      { timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), level: 'info', message: 'Workflow completed successfully' }
    ]
  },
  {
    id: 'exec-2',
    workflowId: 'wf-ai-assessment',
    status: 'running',
    currentStepId: 'step-2a',
    variables: {},
    stepResults: {
      'step-1': { models: [{ id: 'model-1', name: 'GPT-4-Clone' }, { id: 'model-2', name: 'CodeLlama-7B' }] }
    },
    startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    logs: [
      { timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), level: 'info', message: 'Workflow started' },
      { timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), level: 'info', stepId: 'step-1', message: 'Discovered 2 AI models' },
      { timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), level: 'info', stepId: 'step-2', message: 'Starting parallel assessments' }
    ]
  }
];

// GET - List workflows or get specific workflow
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workflowId = searchParams.get('id');
  const action = searchParams.get('action') || 'list';

  try {
    if (workflowId) {
      const workflow = demoWorkflows.find(w => w.id === workflowId);
      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }
      return NextResponse.json({ workflow });
    }

    switch (action) {
      case 'executions':
        return NextResponse.json({
          executions: demoExecutions,
          total: demoExecutions.length
        });

      case 'stats':
        return NextResponse.json({
          totalWorkflows: demoWorkflows.length,
          activeWorkflows: demoWorkflows.filter(w => w.status === 'active').length,
          runningExecutions: demoExecutions.filter(e => e.status === 'running').length,
          completedToday: demoExecutions.filter(e =>
            e.status === 'completed' &&
            new Date(e.completedAt!).toDateString() === new Date().toDateString()
          ).length
        });

      case 'list':
      default:
        return NextResponse.json({
          workflows: demoWorkflows,
          total: demoWorkflows.length
        });
    }
  } catch (error) {
    console.error('Workflow API error:', error);
    return NextResponse.json(
      { error: 'Failed to process workflow request' },
      { status: 500 }
    );
  }
}

// POST - Create workflow or trigger execution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create':
        const newWorkflow: Workflow = {
          id: `wf-${Date.now()}`,
          name: data.name,
          description: data.description,
          status: 'draft',
          steps: data.steps || [],
          variables: data.variables || {},
          triggers: data.triggers || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'demo@optimal.com'
        };
        return NextResponse.json({ workflow: newWorkflow, message: 'Workflow created (demo mode)' });

      case 'execute':
        const workflow = demoWorkflows.find(w => w.id === data.workflowId);
        if (!workflow) {
          return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }

        const newExecution: WorkflowExecution = {
          id: `exec-${Date.now()}`,
          workflowId: data.workflowId,
          status: 'running',
          currentStepId: workflow.steps[0]?.id,
          variables: data.variables || {},
          stepResults: {},
          startedAt: new Date().toISOString(),
          logs: [
            { timestamp: new Date().toISOString(), level: 'info', message: 'Workflow execution started' }
          ]
        };
        return NextResponse.json({ execution: newExecution, message: 'Workflow execution started (demo mode)' });

      case 'pause':
        return NextResponse.json({ message: 'Execution paused (demo mode)' });

      case 'resume':
        return NextResponse.json({ message: 'Execution resumed (demo mode)' });

      case 'cancel':
        return NextResponse.json({ message: 'Execution cancelled (demo mode)' });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Workflow POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process workflow request' },
      { status: 500 }
    );
  }
}

// PUT - Update workflow
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, updates } = body;

    const workflow = demoWorkflows.find(w => w.id === workflowId);
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const updatedWorkflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ workflow: updatedWorkflow, message: 'Workflow updated (demo mode)' });
  } catch (error) {
    console.error('Workflow PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

// DELETE - Delete workflow
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workflowId = searchParams.get('id');

  if (!workflowId) {
    return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 });
  }

  return NextResponse.json({ message: 'Workflow deleted (demo mode)' });
}

export const dynamic = 'force-dynamic';
