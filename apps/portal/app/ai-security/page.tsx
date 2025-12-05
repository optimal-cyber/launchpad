'use client';

import { useState } from 'react';
import { Shield, Brain, CheckCircle2, AlertTriangle, TrendingUp, FileText, Download, ExternalLink, Award, Target, Lock, Zap } from 'lucide-react';

interface BenchmarkScore {
  category: string;
  score: number;
  maxScore: number;
  status: 'pass' | 'partial' | 'fail';
  details: string;
}

interface AIModel {
  id: string;
  name: string;
  version: string;
  framework: string;
  lastScanned: string;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export default function AISecurityPage() {
  const [selectedModel, setSelectedModel] = useState<string>('model-1');

  const aiModels: AIModel[] = [
    {
      id: 'model-1',
      name: 'Fraud Detection Model',
      version: 'v2.3.1',
      framework: 'TensorFlow 2.14',
      lastScanned: '2024-12-02',
      overallScore: 87,
      riskLevel: 'low'
    },
    {
      id: 'model-2',
      name: 'Customer Sentiment Analysis',
      version: 'v1.8.0',
      framework: 'PyTorch 2.1',
      lastScanned: '2024-12-01',
      overallScore: 72,
      riskLevel: 'medium'
    },
    {
      id: 'model-3',
      name: 'Document Classification',
      version: 'v3.0.2',
      framework: 'HuggingFace Transformers',
      lastScanned: '2024-11-30',
      overallScore: 94,
      riskLevel: 'low'
    }
  ];

  // OWASP AI Security and Privacy Guide (AISVS) benchmarks
  const aisvsScores: BenchmarkScore[] = [
    {
      category: 'Data Security',
      score: 9,
      maxScore: 10,
      status: 'pass',
      details: 'Strong data protection, encryption at rest and in transit, secure data pipelines'
    },
    {
      category: 'Model Security',
      score: 8,
      maxScore: 10,
      status: 'pass',
      details: 'Model integrity verification, secure model storage, versioning controls'
    },
    {
      category: 'Input Validation',
      score: 7,
      maxScore: 10,
      status: 'partial',
      details: 'Input sanitization implemented, needs additional adversarial input testing'
    },
    {
      category: 'Output Security',
      score: 9,
      maxScore: 10,
      status: 'pass',
      details: 'Output filtering and validation, PII detection and redaction'
    },
    {
      category: 'Access Control',
      score: 10,
      maxScore: 10,
      status: 'pass',
      details: 'Role-based access control, API authentication, audit logging'
    },
    {
      category: 'Model Explainability',
      score: 6,
      maxScore: 10,
      status: 'partial',
      details: 'Basic explainability features, recommend implementing SHAP or LIME'
    },
    {
      category: 'Privacy Protection',
      score: 8,
      maxScore: 10,
      status: 'pass',
      details: 'Differential privacy implemented, data anonymization in place'
    },
    {
      category: 'Adversarial Robustness',
      score: 7,
      maxScore: 10,
      status: 'partial',
      details: 'Basic adversarial testing performed, recommend ongoing red team exercises'
    },
    {
      category: 'Monitoring & Logging',
      score: 9,
      maxScore: 10,
      status: 'pass',
      details: 'Comprehensive logging, drift detection, anomaly monitoring'
    },
    {
      category: 'Compliance & Governance',
      score: 8,
      maxScore: 10,
      status: 'pass',
      details: 'Model governance framework, documentation, ethical guidelines'
    }
  ];

  // NIST AI Risk Management Framework scores
  const nistScores: BenchmarkScore[] = [
    {
      category: 'Govern',
      score: 85,
      maxScore: 100,
      status: 'pass',
      details: 'AI governance structure, policies, and accountability mechanisms'
    },
    {
      category: 'Map',
      score: 78,
      maxScore: 100,
      status: 'partial',
      details: 'Risk mapping and context assessment for AI systems'
    },
    {
      category: 'Measure',
      score: 90,
      maxScore: 100,
      status: 'pass',
      details: 'Metrics for AI trustworthiness and performance monitoring'
    },
    {
      category: 'Manage',
      score: 82,
      maxScore: 100,
      status: 'pass',
      details: 'Risk response strategies and incident management'
    }
  ];

  // MITRE ATLAS (Adversarial Threat Landscape for AI Systems)
  const atlasThreats = [
    { threat: 'Model Inversion', mitigated: true, severity: 'high' },
    { threat: 'Data Poisoning', mitigated: true, severity: 'critical' },
    { threat: 'Adversarial Examples', mitigated: false, severity: 'medium' },
    { threat: 'Model Extraction', mitigated: true, severity: 'high' },
    { threat: 'Membership Inference', mitigated: true, severity: 'medium' },
    { threat: 'Backdoor Attacks', mitigated: true, severity: 'critical' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'partial':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'fail':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const selectedModelData = aiModels.find(m => m.id === selectedModel);
  const overallAISVSScore = Math.round((aisvsScores.reduce((acc, s) => acc + s.score, 0) / aisvsScores.reduce((acc, s) => acc + s.maxScore, 0)) * 100);
  const overallNISTScore = Math.round((nistScores.reduce((acc, s) => acc + s.score, 0) / nistScores.reduce((acc, s) => acc + s.maxScore, 0)) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="apollo-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">AI Security & Benchmarks</h1>
            <p className="text-sm text-muted-foreground">Comprehensive security assessment for AI/ML models</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Model Selector */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiModels.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedModel === model.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{model.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{model.framework} • {model.version}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(model.riskLevel)}`}>
                  {model.riskLevel.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-2xl font-bold text-foreground">{model.overallScore}</span>
                <span className="text-xs text-muted-foreground">Last scan: {model.lastScanned}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Overall Scores */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="apollo-metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="text-3xl font-bold text-foreground mt-1">{selectedModelData?.overallScore}</p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getRiskColor(selectedModelData?.riskLevel || 'low')}`}>
                <Award className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="apollo-metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AISVS Score</p>
                <p className="text-3xl font-bold text-foreground mt-1">{overallAISVSScore}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="apollo-metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">NIST AI RMF</p>
                <p className="text-3xl font-bold text-foreground mt-1">{overallNISTScore}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="apollo-metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Threats Mitigated</p>
                <p className="text-3xl font-bold text-foreground mt-1">{atlasThreats.filter(t => t.mitigated).length}/{atlasThreats.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <Lock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OWASP AISVS Benchmarks */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    OWASP AISVS Compliance
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">AI Security Verification Standard</p>
                </div>
                <a href="https://owasp.org/www-project-ai-security-and-privacy-guide/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center">
                  Learn More <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {aisvsScores.map((benchmark, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-foreground">{benchmark.category}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(benchmark.status)}`}>
                            {benchmark.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{benchmark.details}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-lg font-bold text-foreground">{benchmark.score}/{benchmark.maxScore}</div>
                        <div className="text-xs text-muted-foreground">{Math.round((benchmark.score / benchmark.maxScore) * 100)}%</div>
                      </div>
                    </div>
                    <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                        style={{ width: `${(benchmark.score / benchmark.maxScore) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NIST AI RMF + MITRE ATLAS */}
          <div className="space-y-6">
            {/* NIST AI RMF */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center">
                      <Target className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                      NIST AI RMF
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">AI Risk Management Framework</p>
                  </div>
                  <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center">
                    Learn More <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {nistScores.map((benchmark, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-foreground">{benchmark.category}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(benchmark.status)}`}>
                              {benchmark.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{benchmark.details}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-lg font-bold text-foreground">{benchmark.score}%</div>
                        </div>
                      </div>
                      <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                          style={{ width: `${benchmark.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* MITRE ATLAS */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
                      MITRE ATLAS Threats
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Adversarial Threat Landscape</p>
                  </div>
                  <a href="https://atlas.mitre.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center">
                    Learn More <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {atlasThreats.map((threat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50">
                      <div className="flex items-center space-x-3">
                        {threat.mitigated ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        )}
                        <div>
                          <div className="font-medium text-foreground">{threat.threat}</div>
                          <div className="text-xs text-muted-foreground">
                            {threat.mitigated ? 'Mitigated' : 'Requires attention'}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(threat.severity)}`}>
                        {threat.severity.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-6 bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
              Recommended Actions
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Improve Adversarial Robustness</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Implement adversarial training and conduct regular red team exercises to improve model resilience against adversarial examples.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-start space-x-3">
                  <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Enhance Explainability</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Integrate SHAP or LIME libraries to provide better model interpretability and transparency for stakeholders.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

