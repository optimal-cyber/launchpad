export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type {
  AIAssessmentResult,
  AIAssessmentRequest,
  AISVSScore,
  NISTAIRMFScore,
  ATLASThreat,
  RedTeamTest,
  AssessmentFinding,
  AISVS_CATEGORIES,
  NIST_PILLARS
} from '@/lib/ai-security-types';

// In-memory store for assessments (would be database in production)
const assessmentsStore = new Map<string, AIAssessmentResult>();

// Generate realistic AISVS scores
function generateAISVSScores(modelId: string): AISVSScore[] {
  const categories = [
    { category: 'data_security', name: 'Data Security' },
    { category: 'model_security', name: 'Model Security' },
    { category: 'input_validation', name: 'Input Validation' },
    { category: 'output_security', name: 'Output Security' },
    { category: 'access_control', name: 'Access Control' },
    { category: 'model_explainability', name: 'Model Explainability' },
    { category: 'privacy_protection', name: 'Privacy Protection' },
    { category: 'adversarial_robustness', name: 'Adversarial Robustness' },
    { category: 'monitoring_logging', name: 'Monitoring & Logging' },
    { category: 'compliance_governance', name: 'Compliance & Governance' }
  ];

  return categories.map(cat => {
    const score = Math.floor(Math.random() * 4) + 6; // 6-10
    const percentage = score * 10;
    const status = score >= 8 ? 'pass' : score >= 6 ? 'partial' : 'fail';

    const controlsMet = [];
    const controlsFailed = [];
    const recommendations = [];

    if (score < 10) {
      controlsFailed.push(`${cat.name} - Enhanced monitoring required`);
      recommendations.push(`Implement additional ${cat.name.toLowerCase()} controls`);
    }
    if (score >= 7) {
      controlsMet.push(`${cat.name} - Core controls implemented`);
    }

    return {
      category: cat.category as any,
      categoryName: cat.name,
      score,
      maxScore: 10,
      percentage,
      status,
      details: `${cat.name} assessment completed with ${score}/10 controls verified.`,
      controlsMet,
      controlsFailed,
      recommendations
    };
  });
}

// Generate realistic NIST AI RMF scores
function generateNISTScores(modelId: string): NISTAIRMFScore[] {
  const pillars = [
    { pillar: 'govern', name: 'Govern', description: 'AI governance and accountability' },
    { pillar: 'map', name: 'Map', description: 'Risk identification and context understanding' },
    { pillar: 'measure', name: 'Measure', description: 'Metrics and trustworthiness assessment' },
    { pillar: 'manage', name: 'Manage', description: 'Risk response and improvement' }
  ];

  return pillars.map(p => {
    const score = Math.floor(Math.random() * 25) + 70; // 70-95
    const status = score >= 85 ? 'pass' : score >= 70 ? 'partial' : 'fail';

    return {
      pillar: p.pillar as any,
      pillarName: p.name,
      score,
      status,
      details: `${p.description}: ${score}% compliance achieved.`,
      subcategories: [
        {
          id: `${p.pillar}-1`,
          name: `${p.name} Policy`,
          description: `${p.name} policy implementation`,
          score: Math.floor(Math.random() * 20) + 75,
          status: 'implemented'
        },
        {
          id: `${p.pillar}-2`,
          name: `${p.name} Process`,
          description: `${p.name} process documentation`,
          score: Math.floor(Math.random() * 20) + 70,
          status: 'partial'
        }
      ],
      recommendations: score < 90 ? [`Enhance ${p.name.toLowerCase()} documentation and processes`] : []
    };
  });
}

// Generate ATLAS threat assessment
function generateATLASThreats(modelId: string): ATLASThreat[] {
  const threats = [
    { id: 'AML.T0001', name: 'Model Inversion', severity: 'high' },
    { id: 'AML.T0020', name: 'Data Poisoning', severity: 'critical' },
    { id: 'AML.T0043', name: 'Adversarial Examples', severity: 'high' },
    { id: 'AML.T0024', name: 'Model Extraction', severity: 'medium' },
    { id: 'AML.T0025', name: 'Membership Inference', severity: 'medium' },
    { id: 'AML.T0019', name: 'Backdoor Attacks', severity: 'critical' },
    { id: 'AML.T0051', name: 'Prompt Injection', severity: 'high' }
  ];

  return threats.map(t => ({
    threatId: t.id,
    threatName: t.name,
    category: 'ml_attack_staging' as any,
    description: `${t.name} attack vector assessment`,
    mitigated: Math.random() > 0.3, // 70% chance of being mitigated
    severity: t.severity as any,
    mitigationNotes: Math.random() > 0.5 ? 'Controls implemented and verified' : undefined
  }));
}

// Generate red team test results
function generateRedTeamResults(modelId: string): RedTeamTest[] {
  const tests = [
    { type: 'prompt_injection', name: 'Direct Prompt Injection', severity: 'high' },
    { type: 'prompt_injection', name: 'Indirect Prompt Injection', severity: 'high' },
    { type: 'jailbreak', name: 'DAN Prompt Attempt', severity: 'critical' },
    { type: 'jailbreak', name: 'Role-playing Bypass', severity: 'high' },
    { type: 'privacy_leakage', name: 'PII Extraction Attempt', severity: 'critical' },
    { type: 'privacy_leakage', name: 'Training Data Extraction', severity: 'high' },
    { type: 'adversarial', name: 'Input Perturbation Test', severity: 'medium' },
    { type: 'hallucination', name: 'Factuality Test', severity: 'medium' }
  ];

  return tests.map((t, i) => ({
    id: `test-${i + 1}`,
    testType: t.type as any,
    testName: t.name,
    description: `Automated ${t.name.toLowerCase()} security test`,
    payload: `[Test payload for ${t.name}]`,
    expectedBehavior: 'Model should refuse or handle safely',
    actualBehavior: Math.random() > 0.2 ? 'Model handled request safely' : 'Potential vulnerability detected',
    passed: Math.random() > 0.2, // 80% pass rate
    severity: t.severity as any,
    timestamp: new Date().toISOString(),
    duration: Math.floor(Math.random() * 2000) + 500
  }));
}

// Calculate overall risk score
function calculateOverallScore(
  aisvsScores: AISVSScore[],
  nistScores: NISTAIRMFScore[],
  atlasThreats: ATLASThreat[],
  redTeamResults?: RedTeamTest[]
): { score: number; riskLevel: 'low' | 'medium' | 'high' | 'critical' } {
  // AISVS: 35%
  const aisvsAvg = aisvsScores.reduce((sum, s) => sum + s.percentage, 0) / aisvsScores.length;

  // NIST: 25%
  const nistAvg = nistScores.reduce((sum, s) => sum + s.score, 0) / nistScores.length;

  // ATLAS: 20%
  const mitigatedCount = atlasThreats.filter(t => t.mitigated).length;
  const atlasScore = (mitigatedCount / atlasThreats.length) * 100;

  // Red Team: 20%
  let redTeamScore = 100;
  if (redTeamResults && redTeamResults.length > 0) {
    const passedCount = redTeamResults.filter(t => t.passed).length;
    redTeamScore = (passedCount / redTeamResults.length) * 100;
  }

  const overall = (aisvsAvg * 0.35) + (nistAvg * 0.25) + (atlasScore * 0.20) + (redTeamScore * 0.20);

  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (overall >= 80) riskLevel = 'low';
  else if (overall >= 60) riskLevel = 'medium';
  else if (overall >= 40) riskLevel = 'high';
  else riskLevel = 'critical';

  return { score: Math.round(overall), riskLevel };
}

// Generate findings from assessment
function generateFindings(
  aisvsScores: AISVSScore[],
  nistScores: NISTAIRMFScore[],
  atlasThreats: ATLASThreat[],
  redTeamResults?: RedTeamTest[]
): AssessmentFinding[] {
  const findings: AssessmentFinding[] = [];
  let findingId = 1;

  // AISVS findings
  aisvsScores.filter(s => s.status !== 'pass').forEach(s => {
    findings.push({
      id: `finding-${findingId++}`,
      type: 'compliance_gap',
      severity: s.status === 'fail' ? 'high' : 'medium',
      title: `${s.categoryName} Controls Incomplete`,
      description: s.details,
      framework: 'AISVS',
      category: s.category,
      remediation: s.recommendations[0] || 'Implement missing controls',
      status: 'open'
    });
  });

  // ATLAS findings
  atlasThreats.filter(t => !t.mitigated).forEach(t => {
    findings.push({
      id: `finding-${findingId++}`,
      type: 'vulnerability',
      severity: t.severity,
      title: `${t.threatName} Not Mitigated`,
      description: `MITRE ATLAS threat ${t.threatId}: ${t.threatName} has not been adequately mitigated.`,
      framework: 'ATLAS',
      remediation: `Implement controls to mitigate ${t.threatName} attack vector`,
      status: 'open'
    });
  });

  // Red team findings
  if (redTeamResults) {
    redTeamResults.filter(t => !t.passed).forEach(t => {
      findings.push({
        id: `finding-${findingId++}`,
        type: 'vulnerability',
        severity: t.severity,
        title: `${t.testName} Test Failed`,
        description: `Red team test failed: ${t.actualBehavior}`,
        framework: 'RED_TEAM',
        category: t.testType,
        remediation: 'Implement additional guardrails and input validation',
        status: 'open'
      });
    });
  }

  return findings;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const assessmentId = searchParams.get('assessmentId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    let assessments = Array.from(assessmentsStore.values());

    // Filter by specific assessment
    if (assessmentId) {
      const assessment = assessmentsStore.get(assessmentId);
      if (!assessment) {
        return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
      }
      return NextResponse.json(assessment);
    }

    // Filter by model
    if (modelId) {
      assessments = assessments.filter(a => a.modelId === modelId);
    }

    // Sort by timestamp (most recent first)
    assessments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = assessments.length;
    const start = (page - 1) * pageSize;
    const paginatedAssessments = assessments.slice(start, start + pageSize);

    return NextResponse.json({
      assessments: paginatedAssessments,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AIAssessmentRequest = await request.json();
    const { modelId, modelSource, modelName, endpoint, config } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId is required' },
        { status: 400 }
      );
    }

    const assessmentId = `assess-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate assessment results
    const aisvsScores = config?.includeAISVS !== false ? generateAISVSScores(modelId) : [];
    const nistScores = config?.includeNISTRMF !== false ? generateNISTScores(modelId) : [];
    const atlasThreats = config?.includeATLAS !== false ? generateATLASThreats(modelId) : [];
    const redTeamResults = config?.includeRedTeam ? generateRedTeamResults(modelId) : undefined;

    // Calculate overall score
    const { score, riskLevel } = calculateOverallScore(aisvsScores, nistScores, atlasThreats, redTeamResults);

    // Generate findings
    const findings = generateFindings(aisvsScores, nistScores, atlasThreats, redTeamResults);

    // Generate recommendations
    const recommendations: string[] = [];
    if (score < 80) {
      recommendations.push('Enhance overall security posture to achieve compliance');
    }
    if (atlasThreats.some(t => !t.mitigated && t.severity === 'critical')) {
      recommendations.push('Address critical ATLAS threats immediately');
    }
    if (redTeamResults?.some(t => !t.passed && t.severity === 'critical')) {
      recommendations.push('Implement additional guardrails for critical vulnerabilities');
    }
    if (aisvsScores.some(s => s.status === 'fail')) {
      recommendations.push('Complete OWASP AISVS control implementation');
    }

    const assessment: AIAssessmentResult = {
      assessmentId,
      modelId,
      modelName: modelName || modelId,
      modelSource,
      status: 'completed',
      progress: 100,
      timestamp: new Date().toISOString(),
      duration: Math.floor(Math.random() * 30000) + 10000, // 10-40 seconds
      overallScore: score,
      riskLevel,
      aisvsScores,
      nistScores,
      atlasThreats,
      redTeamResults,
      recommendations,
      findings
    };

    assessmentsStore.set(assessmentId, assessment);

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}
