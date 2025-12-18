// AI Model Security Assessment Types
// Supports OWASP AISVS, NIST AI RMF, and MITRE ATLAS frameworks

// ============================================================================
// Model Types
// ============================================================================

export type AIModelSource = 'huggingface' | 'local' | 'openai' | 'anthropic' | 'ollama' | 'azure' | 'aws';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export type AssessmentStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AIModel {
  id: string;
  name: string;
  source: AIModelSource;
  modelType: string; // text-generation, classification, embedding, etc.
  version: string;
  framework: string; // pytorch, tensorflow, transformers, etc.
  endpoint?: string;
  huggingfaceId?: string;
  author?: string;
  license?: string;
  downloads?: number;
  tags?: string[];
  lastAssessed?: string;
  overallScore: number; // 0-100
  riskLevel: RiskLevel;
  createdAt?: string;
  updatedAt?: string;
}

export interface HuggingFaceModelInfo {
  modelId: string;
  author: string;
  sha: string;
  lastModified: string;
  private: boolean;
  downloads: number;
  likes: number;
  tags: string[];
  pipelineTag: string;
  library: string;
  license: string;
  modelCard?: string;
  securityScan?: {
    hasPickle: boolean;
    hasPotentialIssues: boolean;
    issues: string[];
  };
}

export interface LocalModelInfo {
  id: string;
  name: string;
  endpoint: string;
  type: 'ollama' | 'vllm' | 'triton' | 'tensorflow-serving' | 'custom';
  version?: string;
  status: 'online' | 'offline' | 'unknown';
  lastChecked?: string;
}

// ============================================================================
// OWASP AISVS Types
// ============================================================================

export type AISVSCategory =
  | 'data_security'
  | 'model_security'
  | 'input_validation'
  | 'output_security'
  | 'access_control'
  | 'model_explainability'
  | 'privacy_protection'
  | 'adversarial_robustness'
  | 'monitoring_logging'
  | 'compliance_governance';

export interface AISVSControl {
  id: string;
  name: string;
  description: string;
  category: AISVSCategory;
  level: 1 | 2 | 3; // Verification levels
  status: 'pass' | 'partial' | 'fail' | 'not_applicable';
  evidence?: string;
  notes?: string;
}

export interface AISVSScore {
  category: AISVSCategory;
  categoryName: string;
  score: number; // 0-10
  maxScore: number; // typically 10
  percentage: number; // 0-100
  status: 'pass' | 'partial' | 'fail';
  details: string;
  controlsMet: string[];
  controlsFailed: string[];
  recommendations: string[];
}

export const AISVS_CATEGORIES: Record<AISVSCategory, { name: string; description: string }> = {
  data_security: {
    name: 'Data Security',
    description: 'Protection of training data, model inputs, and outputs'
  },
  model_security: {
    name: 'Model Security',
    description: 'Integrity verification, secure storage, and versioning controls'
  },
  input_validation: {
    name: 'Input Validation',
    description: 'Sanitization, adversarial input detection, and schema validation'
  },
  output_security: {
    name: 'Output Security',
    description: 'Filtering, PII redaction, and response validation'
  },
  access_control: {
    name: 'Access Control',
    description: 'RBAC, API authentication, and audit logging'
  },
  model_explainability: {
    name: 'Model Explainability',
    description: 'SHAP/LIME integration, decision transparency, and bias detection'
  },
  privacy_protection: {
    name: 'Privacy Protection',
    description: 'Differential privacy, data anonymization, and consent management'
  },
  adversarial_robustness: {
    name: 'Adversarial Robustness',
    description: 'Adversarial training, robustness testing, and attack detection'
  },
  monitoring_logging: {
    name: 'Monitoring & Logging',
    description: 'Drift detection, anomaly monitoring, and comprehensive logging'
  },
  compliance_governance: {
    name: 'Compliance & Governance',
    description: 'Governance framework, documentation, and ethical guidelines'
  }
};

// ============================================================================
// NIST AI RMF Types
// ============================================================================

export type NISTAIRMFPillar = 'govern' | 'map' | 'measure' | 'manage';

export interface NISTSubcategory {
  id: string;
  name: string;
  description: string;
  score: number; // 0-100
  status: 'implemented' | 'partial' | 'planned' | 'not_implemented';
  evidence?: string;
}

export interface NISTAIRMFScore {
  pillar: NISTAIRMFPillar;
  pillarName: string;
  score: number; // 0-100
  status: 'pass' | 'partial' | 'fail';
  details: string;
  subcategories: NISTSubcategory[];
  recommendations: string[];
}

export const NIST_PILLARS: Record<NISTAIRMFPillar, { name: string; description: string }> = {
  govern: {
    name: 'Govern',
    description: 'Cultivate culture of risk management, establish AI governance structure'
  },
  map: {
    name: 'Map',
    description: 'Context understanding, risk identification, stakeholder mapping'
  },
  measure: {
    name: 'Measure',
    description: 'Metrics definition, trustworthiness assessment, bias measurement'
  },
  manage: {
    name: 'Manage',
    description: 'Risk response, incident management, continuous improvement'
  }
};

// ============================================================================
// MITRE ATLAS Types
// ============================================================================

export type ATLASThreatCategory =
  | 'reconnaissance'
  | 'resource_development'
  | 'initial_access'
  | 'ml_attack_staging'
  | 'model_access'
  | 'exfiltration'
  | 'impact';

export interface ATLASThreat {
  threatId: string; // e.g., AML.T0000
  threatName: string;
  category: ATLASThreatCategory;
  description: string;
  mitigated: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  mitigationNotes?: string;
  techniques?: string[];
  references?: string[];
}

export const ATLAS_THREAT_TYPES: Record<string, { id: string; name: string; description: string }> = {
  model_inversion: {
    id: 'AML.T0001',
    name: 'Model Inversion',
    description: 'Extracting training data from model responses'
  },
  data_poisoning: {
    id: 'AML.T0020',
    name: 'Data Poisoning',
    description: 'Corrupting training data to influence model behavior'
  },
  adversarial_examples: {
    id: 'AML.T0043',
    name: 'Adversarial Examples',
    description: 'Crafted inputs designed to cause misclassification'
  },
  model_extraction: {
    id: 'AML.T0024',
    name: 'Model Extraction',
    description: 'Stealing model parameters through queries'
  },
  membership_inference: {
    id: 'AML.T0025',
    name: 'Membership Inference',
    description: 'Determining if data was used in training'
  },
  backdoor_attacks: {
    id: 'AML.T0019',
    name: 'Backdoor Attacks',
    description: 'Hidden triggers that cause malicious behavior'
  },
  prompt_injection: {
    id: 'AML.T0051',
    name: 'Prompt Injection',
    description: 'Manipulating LLM behavior through crafted prompts'
  }
};

// ============================================================================
// Red Team Testing Types
// ============================================================================

export type RedTeamTestType =
  | 'prompt_injection'
  | 'jailbreak'
  | 'adversarial'
  | 'privacy_leakage'
  | 'model_extraction'
  | 'bias_detection'
  | 'hallucination';

export interface RedTeamTest {
  id: string;
  testType: RedTeamTestType;
  testName: string;
  description: string;
  payload: string;
  expectedBehavior: string;
  actualBehavior?: string;
  passed: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp: string;
  duration?: number; // ms
  notes?: string;
}

export interface RedTeamConfig {
  enabled: boolean;
  testCategories: RedTeamTestType[];
  maxTestsPerCategory: number;
  timeout: number; // seconds
  customPayloads?: Record<RedTeamTestType, string[]>;
}

export const RED_TEAM_CATEGORIES: Record<RedTeamTestType, { name: string; description: string }> = {
  prompt_injection: {
    name: 'Prompt Injection',
    description: 'Direct and indirect prompt injection attacks'
  },
  jailbreak: {
    name: 'Jailbreaking',
    description: 'Attempts to bypass safety guardrails'
  },
  adversarial: {
    name: 'Adversarial Attacks',
    description: 'Input perturbation and feature manipulation'
  },
  privacy_leakage: {
    name: 'Privacy Leakage',
    description: 'Data extraction and PII disclosure'
  },
  model_extraction: {
    name: 'Model Extraction',
    description: 'Parameter and behavior extraction attempts'
  },
  bias_detection: {
    name: 'Bias Detection',
    description: 'Testing for demographic and content biases'
  },
  hallucination: {
    name: 'Hallucination Testing',
    description: 'Factuality and grounding verification'
  }
};

// ============================================================================
// Assessment Types
// ============================================================================

export interface AssessmentConfig {
  includeAISVS: boolean;
  includeNISTRMF: boolean;
  includeATLAS: boolean;
  includeRedTeam: boolean;
  redTeamConfig?: RedTeamConfig;
  customEndpoint?: string;
  timeout?: number;
}

export interface AIAssessmentRequest {
  modelId: string;
  modelSource: AIModelSource;
  modelName?: string;
  endpoint?: string;
  config: AssessmentConfig;
}

export interface AIAssessmentResult {
  assessmentId: string;
  modelId: string;
  modelName: string;
  modelSource: AIModelSource;
  status: AssessmentStatus;
  progress: number; // 0-100
  timestamp: string;
  duration?: number; // ms

  // Scores
  overallScore: number; // 0-100
  riskLevel: RiskLevel;

  // Framework results
  aisvsScores: AISVSScore[];
  nistScores: NISTAIRMFScore[];
  atlasThreats: ATLASThreat[];
  redTeamResults?: RedTeamTest[];

  // Summary
  recommendations: string[];
  findings: AssessmentFinding[];

  // Metadata
  assessedBy?: string;
  approvedBy?: string;
  notes?: string;
}

export interface AssessmentFinding {
  id: string;
  type: 'vulnerability' | 'misconfiguration' | 'compliance_gap' | 'risk';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  framework: 'AISVS' | 'NIST_AI_RMF' | 'ATLAS' | 'RED_TEAM';
  category?: string;
  remediation: string;
  references?: string[];
  status: 'open' | 'in_progress' | 'remediated' | 'accepted';
}

// ============================================================================
// Discovery Types
// ============================================================================

export interface ModelDiscoveryRequest {
  source: AIModelSource;
  query?: string;
  organization?: string;
  localEndpoints?: string[];
  filters?: {
    modelType?: string[];
    framework?: string[];
    minDownloads?: number;
    license?: string[];
  };
}

export interface ModelDiscoveryResult {
  source: AIModelSource;
  models: AIModel[];
  total: number;
  timestamp: string;
}

// ============================================================================
// Agent Types
// ============================================================================

export interface AISecurityAgentConfig {
  enabled: boolean;
  scanInterval: number; // seconds
  discoveryEnabled: boolean;
  discoveryInterval: number; // seconds
  autoAssess: boolean;
  assessmentConfig: AssessmentConfig;
  localEndpoints: string[];
  huggingfaceOrgs?: string[];
}

export interface AISecurityAgentStatus {
  agentId: string;
  status: 'running' | 'stopped' | 'error';
  lastScan?: string;
  lastDiscovery?: string;
  modelsMonitored: number;
  assessmentsCompleted: number;
  issuesFound: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AIModelsResponse {
  models: AIModel[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AIAssessmentsResponse {
  assessments: AIAssessmentResult[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AISecurityDashboard {
  totalModels: number;
  modelsAssessed: number;
  averageScore: number;
  riskDistribution: Record<RiskLevel, number>;
  recentAssessments: AIAssessmentResult[];
  criticalFindings: AssessmentFinding[];
  complianceSummary: {
    aisvs: { passed: number; total: number };
    nist: { passed: number; total: number };
    atlas: { mitigated: number; total: number };
  };
}
