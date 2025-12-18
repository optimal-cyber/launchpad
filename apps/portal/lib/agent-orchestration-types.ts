// Agent Orchestration Types - Inspired by JADE Platform
// Sub-agent orchestration, workflows, and MCP integration

export type AgentStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'waiting';
export type AgentType = 'security' | 'scanner' | 'analyzer' | 'reporter' | 'remediation' | 'coordinator';

// Core Agent Definition
export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  status: AgentStatus;
  instructions: string;
  capabilities: AgentCapability[];
  tools: AgentTool[];
  parentAgentId?: string;
  childAgentIds: string[];
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  lastHeartbeat?: string;
  metadata: Record<string, unknown>;
}

export type AgentCapability =
  | 'vulnerability_scan'
  | 'sbom_generation'
  | 'container_analysis'
  | 'code_review'
  | 'compliance_check'
  | 'threat_detection'
  | 'incident_response'
  | 'report_generation'
  | 'ai_model_scan'
  | 'ai_red_team'
  | 'graph_analysis'
  | 'pattern_detection';

// Agent Tools (MCP-style)
export interface AgentTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  isAsync: boolean;
  timeout?: number;
}

// Sub-Agent Delegation
export interface SubAgentDelegation {
  id: string;
  parentAgentId: string;
  subAgentId: string;
  task: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

// Agent Hierarchy
export interface AgentHierarchy {
  rootAgent: Agent;
  subAgents: AgentHierarchyNode[];
  totalAgents: number;
  activeAgents: number;
}

export interface AgentHierarchyNode {
  agent: Agent;
  children: AgentHierarchyNode[];
  depth: number;
}

// Workflow Definition
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  variables: Record<string, unknown>;
  triggers: WorkflowTrigger[];
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
}

export type WorkflowStatus = 'draft' | 'active' | 'running' | 'paused' | 'completed' | 'failed';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent' | 'condition' | 'parallel' | 'loop' | 'delay' | 'webhook';
  agentId?: string;
  action?: string;
  inputs: Record<string, unknown>; // Template variables like {{step_1.output}} or arrays
  outputs: string[];
  condition?: WorkflowCondition;
  parallelSteps?: string[];
  loopConfig?: LoopConfig;
  status: StepStatus;
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  order: number;
}

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowCondition {
  type: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'expression';
  left: string;
  right?: string;
  expression?: string;
}

export interface LoopConfig {
  iterateOver: string;
  maxIterations?: number;
  parallel?: boolean;
}

// Workflow Triggers
export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'event';
  config: TriggerConfig;
}

export interface TriggerConfig {
  schedule?: string; // Cron expression
  webhookPath?: string;
  eventType?: string;
  eventFilter?: Record<string, unknown>;
}

// Workflow Execution
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  currentStepId?: string;
  variables: Record<string, unknown>;
  stepResults: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
  error?: string;
  logs: WorkflowLog[];
}

export interface WorkflowLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  stepId?: string;
  message: string;
  data?: Record<string, unknown>;
}

// MCP (Model Context Protocol) Types
export interface MCPServer {
  name: string;
  description: string;
  version: string;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  transport: 'stdio' | 'http_sse';
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
  isTemplate: boolean;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: {
    name: string;
    description: string;
    required?: boolean;
  }[];
}

// Agent Session Management
export interface AgentSession {
  id: string;
  agentId: string;
  status: 'active' | 'inactive' | 'expired';
  conversationHistory: ConversationMessage[];
  memory: SessionMemory;
  artifacts: SessionArtifact[];
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

export interface SessionMemory {
  shortTerm: Record<string, unknown>;
  longTerm: Record<string, unknown>;
  embeddings: { text: string; vector: number[] }[];
}

export interface SessionArtifact {
  id: string;
  name: string;
  type: string;
  size: number;
  uri: string;
  createdAt: string;
}

// Agent Task Types
export interface AgentTask {
  id: string;
  agentId: string;
  type: AgentTaskType;
  status: AgentStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  progress: number; // 0-100
  logs: TaskLog[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export type AgentTaskType =
  | 'vulnerability_scan'
  | 'sbom_scan'
  | 'container_scan'
  | 'ai_model_assessment'
  | 'ai_model_discovery'
  | 'ai_red_team'
  | 'compliance_check'
  | 'graph_build'
  | 'pattern_analysis'
  | 'report_generation';

export interface TaskLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

// Reflection Service (Self-evaluation)
export interface ReflectionResult {
  taskId: string;
  evaluation: {
    accuracy: number;
    completeness: number;
    relevance: number;
    overall: number;
  };
  suggestions: string[];
  shouldRetry: boolean;
  refinements: Record<string, unknown>;
  timestamp: string;
}
