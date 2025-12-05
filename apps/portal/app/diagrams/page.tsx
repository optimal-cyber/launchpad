'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Download, RefreshCw, Copy, Zap, Network, GitBranch, Box, Workflow, Database } from 'lucide-react';

interface DiagramTemplate {
  id: string;
  name: string;
  icon: any;
  description: string;
  example: string;
}

interface GeneratedDiagram {
  id: string;
  prompt: string;
  type: string;
  mermaidCode: string;
  timestamp: Date;
}

export default function DiagramsPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('architecture');
  const [generatedDiagrams, setGeneratedDiagrams] = useState<GeneratedDiagram[]>([]);
  const [currentDiagram, setCurrentDiagram] = useState<GeneratedDiagram | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const templates: DiagramTemplate[] = [
    {
      id: 'architecture',
      name: 'System Architecture',
      icon: Box,
      description: 'Cloud architecture, microservices, system design',
      example: 'Create a microservices architecture with API gateway, authentication service, and PostgreSQL database'
    },
    {
      id: 'sequence',
      name: 'Sequence Diagram',
      icon: GitBranch,
      description: 'User flows, API interactions, authentication flows',
      example: 'Create an OAuth 2.0 authentication flow with user, client app, auth server, and resource server'
    },
    {
      id: 'flowchart',
      name: 'Flowchart',
      icon: Workflow,
      description: 'Business processes, decision trees, workflows',
      example: 'Create a CI/CD pipeline flowchart with build, test, security scan, and deployment stages'
    },
    {
      id: 'network',
      name: 'Network Diagram',
      icon: Network,
      description: 'Network topology, infrastructure, connections',
      example: 'Create a secure network architecture with DMZ, internal network, and database tier'
    },
    {
      id: 'database',
      name: 'Entity Relationship',
      icon: Database,
      description: 'Database schema, data models, relationships',
      example: 'Create an e-commerce database schema with users, orders, products, and payments tables'
    }
  ];

  // Load saved diagrams from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_diagrams');
    if (saved) {
      const diagrams = JSON.parse(saved);
      setGeneratedDiagrams(diagrams.map((d: any) => ({
        ...d,
        timestamp: new Date(d.timestamp)
      })));
    }
  }, []);

  const generateDiagram = () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    // Simulate AI generation with example diagrams based on template
    setTimeout(() => {
      let mermaidCode = '';

      switch (selectedTemplate) {
        case 'architecture':
          mermaidCode = `graph TB
    subgraph "Client Layer"
        A[Web Application]
        B[Mobile App]
    end
    
    subgraph "API Gateway"
        C[API Gateway]
        D[Load Balancer]
    end
    
    subgraph "Services"
        E[Auth Service]
        F[User Service]
        G[Order Service]
        H[Payment Service]
    end
    
    subgraph "Data Layer"
        I[(PostgreSQL)]
        J[(Redis Cache)]
        K[(S3 Storage)]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    E --> I
    F --> I
    G --> I
    H --> I
    F --> J
    G --> K`;
          break;

        case 'sequence':
          mermaidCode = `sequenceDiagram
    participant User
    participant Client
    participant AuthServer
    participant ResourceServer
    
    User->>Client: 1. Click "Login"
    Client->>AuthServer: 2. Authorization Request
    AuthServer->>User: 3. Login Page
    User->>AuthServer: 4. Credentials
    AuthServer->>AuthServer: 5. Validate Credentials
    AuthServer->>Client: 6. Authorization Code
    Client->>AuthServer: 7. Token Request + Code
    AuthServer->>Client: 8. Access Token + Refresh Token
    Client->>ResourceServer: 9. API Request + Access Token
    ResourceServer->>ResourceServer: 10. Validate Token
    ResourceServer->>Client: 11. Protected Resource
    Client->>User: 12. Display Data`;
          break;

        case 'flowchart':
          mermaidCode = `flowchart TD
    A[Developer Push] --> B{Run Tests}
    B -->|Pass| C[Build Docker Image]
    B -->|Fail| D[Notify Developer]
    C --> E[Security Scan]
    E --> F{Vulnerabilities?}
    F -->|Critical| G[Block Deployment]
    F -->|None/Low| H[Push to Registry]
    G --> D
    H --> I{Environment}
    I -->|Dev| J[Deploy to Dev]
    I -->|Staging| K[Deploy to Staging]
    I -->|Production| L{Manual Approval?}
    L -->|Approved| M[Deploy to Production]
    L -->|Rejected| D
    J --> N[Run Integration Tests]
    K --> N
    M --> O[Health Check]
    O --> P{Status}
    P -->|Healthy| Q[Deployment Complete]
    P -->|Unhealthy| R[Rollback]
    R --> D`;
          break;

        case 'network':
          mermaidCode = `graph TB
    subgraph "Internet"
        INT[Public Internet]
    end
    
    subgraph "DMZ"
        FW1[Firewall]
        LB[Load Balancer]
        WAF[Web Application Firewall]
    end
    
    subgraph "Application Tier"
        WEB1[Web Server 1]
        WEB2[Web Server 2]
        APP1[App Server 1]
        APP2[App Server 2]
    end
    
    subgraph "Database Tier"
        DB1[(Primary DB)]
        DB2[(Replica DB)]
        CACHE[(Redis)]
    end
    
    INT --> FW1
    FW1 --> WAF
    WAF --> LB
    LB --> WEB1
    LB --> WEB2
    WEB1 --> APP1
    WEB2 --> APP2
    APP1 --> DB1
    APP2 --> DB1
    DB1 -.->|Replication| DB2
    APP1 --> CACHE
    APP2 --> CACHE`;
          break;

        case 'database':
          mermaidCode = `erDiagram
    USERS ||--o{ ORDERS : places
    USERS {
        int id PK
        string email
        string username
        string password_hash
        datetime created_at
    }
    
    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS {
        int id PK
        int user_id FK
        decimal total_amount
        string status
        datetime created_at
    }
    
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered in"
    PRODUCTS {
        int id PK
        string name
        text description
        decimal price
        int stock_quantity
        int category_id FK
    }
    
    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price
    }
    
    CATEGORIES ||--o{ PRODUCTS : contains
    CATEGORIES {
        int id PK
        string name
        text description
    }
    
    ORDERS ||--o| PAYMENTS : "paid by"
    PAYMENTS {
        int id PK
        int order_id FK
        decimal amount
        string payment_method
        string status
        datetime processed_at
    }`;
          break;
      }

      const newDiagram: GeneratedDiagram = {
        id: Date.now().toString(),
        prompt: prompt,
        type: selectedTemplate,
        mermaidCode: mermaidCode,
        timestamp: new Date()
      };

      const updatedDiagrams = [newDiagram, ...generatedDiagrams];
      setGeneratedDiagrams(updatedDiagrams);
      setCurrentDiagram(newDiagram);
      localStorage.setItem('ai_diagrams', JSON.stringify(updatedDiagrams));

      setIsGenerating(false);
    }, 2000);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Diagram code copied to clipboard!');
  };

  const exportDiagram = (diagram: GeneratedDiagram) => {
    const blob = new Blob([diagram.mermaidCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram-${diagram.id}.mmd`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="apollo-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">AI Diagram Generator</h1>
            <p className="text-sm text-muted-foreground">Generate technical diagrams using AI prompts</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Templates & Prompt */}
          <div className="lg:col-span-1 space-y-6">
            {/* Templates */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Diagram Templates</h3>
              <div className="space-y-2">
                {templates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setPrompt(template.example);
                      }}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        selectedTemplate === template.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${selectedTemplate === template.id ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">{template.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Prompt */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">AI Prompt</h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your diagram in plain language..."
                rows={6}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={generateDiagram}
                disabled={isGenerating || !prompt.trim()}
                className="w-full mt-4 inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Diagram
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Diagram Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Diagram Preview */}
            {currentDiagram ? (
              <div className="bg-card rounded-lg border border-border">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-foreground">Generated Diagram</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(currentDiagram.mermaidCode)}
                        className="inline-flex items-center px-3 py-1.5 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </button>
                      <button
                        onClick={() => exportDiagram(currentDiagram)}
                        className="inline-flex items-center px-3 py-1.5 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{currentDiagram.prompt}</p>
                </div>
                
                {/* Mermaid Preview */}
                <div className="p-6 bg-muted/50">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">Diagram Preview</p>
                      <p className="text-xs text-muted-foreground">
                        Copy the Mermaid code below and paste it into{' '}
                        <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          mermaid.live
                        </a>
                        {' '}to view
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mermaid Code */}
                <div className="p-6 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-foreground">Mermaid Code</h4>
                  </div>
                  <pre className="bg-background border border-border rounded-md p-4 text-xs text-foreground overflow-x-auto">
                    <code>{currentDiagram.mermaidCode}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No diagram generated yet</h3>
                <p className="text-sm text-muted-foreground">
                  Select a template, describe your diagram, and click "Generate Diagram"
                </p>
              </div>
            )}

            {/* History */}
            {generatedDiagrams.length > 0 && (
              <div className="bg-card rounded-lg border border-border">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-medium text-foreground">Recent Diagrams</h3>
                </div>
                <div className="divide-y divide-border">
                  {generatedDiagrams.slice(0, 5).map((diagram) => (
                    <div
                      key={diagram.id}
                      className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setCurrentDiagram(diagram)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{diagram.prompt}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                              {templates.find(t => t.id === diagram.type)?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {diagram.timestamp.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportDiagram(diagram);
                          }}
                          className="ml-4 text-muted-foreground hover:text-foreground"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



