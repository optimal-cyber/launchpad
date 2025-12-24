/**
 * Agent Repository
 * CRUD operations for security agents in the database
 */

import { query, queryOne, queryAll } from './client';
import crypto from 'crypto';

// Agent types matching the database schema
export interface Agent {
  id: string;
  agent_id: string;
  name: string | null;
  agent_type: string;
  version: string | null;
  environment: string | null;
  cluster_name: string | null;
  node_name: string | null;
  namespace: string | null;
  status: 'pending' | 'active' | 'inactive' | 'error';
  last_heartbeat: Date | null;
  capabilities: string[];
  cpu_percent: number | null;
  memory_percent: number | null;
  disk_percent: number | null;
  containers_monitored: number;
  scans_completed: number;
  scans_failed: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  config: Record<string, unknown>;
  // OAuth fields
  oauth_client_id: string | null;
  token_hash: string | null;
  last_token_refresh: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface AgentRegistration {
  agent_id: string;
  name?: string;
  agent_type: string;
  version?: string;
  environment?: string;
  cluster_name?: string;
  node_name?: string;
  namespace?: string;
  capabilities?: string[];
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  config?: Record<string, unknown>;
}

export interface AgentHeartbeat {
  status: 'healthy' | 'degraded' | 'error';
  cpu_percent?: number;
  memory_percent?: number;
  disk_percent?: number;
  containers_monitored?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentCommand {
  id: string;
  agent_id: string;
  command_type: 'scan' | 'update' | 'restart' | 'config';
  parameters: Record<string, unknown>;
  status: 'pending' | 'sent' | 'executed' | 'failed';
  created_at: Date;
  executed_at: Date | null;
}

/**
 * Register or update an agent
 */
export async function registerAgent(data: AgentRegistration): Promise<Agent> {
  const result = await queryOne<Agent>(
    `INSERT INTO agents.agents (
      agent_id, name, agent_type, version, environment,
      cluster_name, node_name, namespace, status,
      capabilities, labels, annotations, config,
      last_heartbeat
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11, $12, NOW())
    ON CONFLICT (agent_id) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, agents.agents.name),
      agent_type = EXCLUDED.agent_type,
      version = COALESCE(EXCLUDED.version, agents.agents.version),
      environment = COALESCE(EXCLUDED.environment, agents.agents.environment),
      cluster_name = COALESCE(EXCLUDED.cluster_name, agents.agents.cluster_name),
      node_name = COALESCE(EXCLUDED.node_name, agents.agents.node_name),
      namespace = COALESCE(EXCLUDED.namespace, agents.agents.namespace),
      status = 'active',
      capabilities = COALESCE(EXCLUDED.capabilities, agents.agents.capabilities),
      labels = COALESCE(EXCLUDED.labels, agents.agents.labels),
      annotations = COALESCE(EXCLUDED.annotations, agents.agents.annotations),
      config = COALESCE(EXCLUDED.config, agents.agents.config),
      last_heartbeat = NOW(),
      updated_at = NOW()
    RETURNING *`,
    [
      data.agent_id,
      data.name || null,
      data.agent_type,
      data.version || null,
      data.environment || null,
      data.cluster_name || null,
      data.node_name || null,
      data.namespace || null,
      data.capabilities || [],
      JSON.stringify(data.labels || {}),
      JSON.stringify(data.annotations || {}),
      JSON.stringify(data.config || {}),
    ]
  );

  if (!result) {
    throw new Error('Failed to register agent');
  }

  return result;
}

/**
 * Get agent by external agent_id
 */
export async function getAgentByAgentId(agentId: string): Promise<Agent | null> {
  return queryOne<Agent>(
    'SELECT * FROM agents.agents WHERE agent_id = $1',
    [agentId]
  );
}

/**
 * Get agent by internal UUID
 */
export async function getAgentById(id: string): Promise<Agent | null> {
  return queryOne<Agent>(
    'SELECT * FROM agents.agents WHERE id = $1',
    [id]
  );
}

/**
 * List all agents with optional filtering
 */
export async function listAgents(options?: {
  status?: string;
  environment?: string;
  agent_type?: string;
  limit?: number;
  offset?: number;
}): Promise<Agent[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options?.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(options.status);
  }

  if (options?.environment) {
    conditions.push(`environment = $${paramIndex++}`);
    params.push(options.environment);
  }

  if (options?.agent_type) {
    conditions.push(`agent_type = $${paramIndex++}`);
    params.push(options.agent_type);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  return queryAll<Agent>(
    `SELECT * FROM agents.agents ${whereClause}
     ORDER BY last_heartbeat DESC NULLS LAST
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );
}

/**
 * Update agent heartbeat
 */
export async function updateHeartbeat(
  agentId: string,
  heartbeat: AgentHeartbeat
): Promise<Agent | null> {
  // Update agent status and metrics
  const agent = await queryOne<Agent>(
    `UPDATE agents.agents SET
      status = CASE WHEN $2 = 'healthy' THEN 'active'
               WHEN $2 = 'degraded' THEN 'active'
               ELSE 'error' END,
      last_heartbeat = NOW(),
      cpu_percent = COALESCE($3, cpu_percent),
      memory_percent = COALESCE($4, memory_percent),
      disk_percent = COALESCE($5, disk_percent),
      containers_monitored = COALESCE($6, containers_monitored),
      updated_at = NOW()
     WHERE agent_id = $1
     RETURNING *`,
    [
      agentId,
      heartbeat.status,
      heartbeat.cpu_percent || null,
      heartbeat.memory_percent || null,
      heartbeat.disk_percent || null,
      heartbeat.containers_monitored || null,
    ]
  );

  // Also store heartbeat history
  if (agent) {
    await query(
      `INSERT INTO agents.heartbeats (agent_id, status, cpu_percent, memory_percent, disk_percent, containers_monitored, message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        agent.id,
        heartbeat.status,
        heartbeat.cpu_percent || null,
        heartbeat.memory_percent || null,
        heartbeat.disk_percent || null,
        heartbeat.containers_monitored || null,
        heartbeat.message || null,
        JSON.stringify(heartbeat.metadata || {}),
      ]
    );
  }

  return agent;
}

/**
 * Deactivate an agent
 */
export async function deactivateAgent(agentId: string): Promise<boolean> {
  const result = await query(
    `UPDATE agents.agents SET status = 'inactive', updated_at = NOW()
     WHERE agent_id = $1`,
    [agentId]
  );

  return (result.rowCount || 0) > 0;
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM agents.agents WHERE agent_id = $1',
    [agentId]
  );

  return (result.rowCount || 0) > 0;
}

/**
 * Set OAuth credentials for an agent
 */
export async function setAgentOAuthCredentials(
  agentId: string,
  clientId: string,
  clientSecretHash: string
): Promise<Agent | null> {
  return queryOne<Agent>(
    `UPDATE agents.agents SET
      oauth_client_id = $2,
      token_hash = $3,
      last_token_refresh = NOW(),
      updated_at = NOW()
     WHERE agent_id = $1
     RETURNING *`,
    [agentId, clientId, clientSecretHash]
  );
}

/**
 * Verify agent credentials
 */
export async function verifyAgentCredentials(
  clientId: string,
  clientSecret: string
): Promise<Agent | null> {
  const secretHash = crypto
    .createHash('sha256')
    .update(clientSecret)
    .digest('hex');

  return queryOne<Agent>(
    `SELECT * FROM agents.agents
     WHERE oauth_client_id = $1 AND token_hash = $2 AND status != 'inactive'`,
    [clientId, secretHash]
  );
}

/**
 * Update token refresh timestamp
 */
export async function updateTokenRefresh(agentId: string): Promise<void> {
  await query(
    `UPDATE agents.agents SET last_token_refresh = NOW(), updated_at = NOW()
     WHERE agent_id = $1`,
    [agentId]
  );
}

/**
 * Generate OAuth credentials for an agent
 */
export function generateAgentCredentials(): {
  clientId: string;
  clientSecret: string;
  clientSecretHash: string;
} {
  const clientId = `agent_${crypto.randomBytes(16).toString('hex')}`;
  const clientSecret = crypto.randomBytes(32).toString('hex');
  const clientSecretHash = crypto
    .createHash('sha256')
    .update(clientSecret)
    .digest('hex');

  return { clientId, clientSecret, clientSecretHash };
}

/**
 * Create a command for an agent
 */
export async function createAgentCommand(
  agentId: string,
  commandType: AgentCommand['command_type'],
  parameters: Record<string, unknown>
): Promise<AgentCommand> {
  const agent = await getAgentByAgentId(agentId);
  if (!agent) {
    throw new Error('Agent not found');
  }

  const result = await queryOne<AgentCommand>(
    `INSERT INTO agents.agent_commands (agent_id, command_type, parameters, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [agent.id, commandType, JSON.stringify(parameters)]
  );

  if (!result) {
    throw new Error('Failed to create command');
  }

  return result;
}

/**
 * Get pending commands for an agent
 */
export async function getPendingCommands(agentId: string): Promise<AgentCommand[]> {
  const agent = await getAgentByAgentId(agentId);
  if (!agent) {
    return [];
  }

  return queryAll<AgentCommand>(
    `SELECT * FROM agents.agent_commands
     WHERE agent_id = $1 AND status = 'pending'
     ORDER BY created_at ASC`,
    [agent.id]
  );
}

/**
 * Mark a command as executed
 */
export async function markCommandExecuted(
  commandId: string,
  success: boolean
): Promise<void> {
  await query(
    `UPDATE agents.agent_commands SET
      status = $2,
      executed_at = NOW()
     WHERE id = $1`,
    [commandId, success ? 'executed' : 'failed']
  );
}

/**
 * Get agent statistics
 */
export async function getAgentStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  error: number;
  by_environment: Record<string, number>;
  by_type: Record<string, number>;
}> {
  const stats = await queryOne<{
    total: number;
    active: number;
    inactive: number;
    error: number;
  }>(
    `SELECT
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = 'active')::int as active,
      COUNT(*) FILTER (WHERE status = 'inactive')::int as inactive,
      COUNT(*) FILTER (WHERE status = 'error')::int as error
     FROM agents.agents`
  );

  const byEnv = await queryAll<{ environment: string; count: number }>(
    `SELECT environment, COUNT(*)::int as count
     FROM agents.agents
     WHERE environment IS NOT NULL
     GROUP BY environment`
  );

  const byType = await queryAll<{ agent_type: string; count: number }>(
    `SELECT agent_type, COUNT(*)::int as count
     FROM agents.agents
     GROUP BY agent_type`
  );

  return {
    total: stats?.total || 0,
    active: stats?.active || 0,
    inactive: stats?.inactive || 0,
    error: stats?.error || 0,
    by_environment: Object.fromEntries(
      byEnv.map((e) => [e.environment, e.count])
    ),
    by_type: Object.fromEntries(
      byType.map((t) => [t.agent_type, t.count])
    ),
  };
}

/**
 * Mark stale agents as inactive
 * Agents with no heartbeat in the last N minutes are marked inactive
 */
export async function markStaleAgents(
  staleThresholdMinutes: number = 10
): Promise<number> {
  const result = await query(
    `UPDATE agents.agents SET status = 'inactive', updated_at = NOW()
     WHERE status = 'active'
     AND last_heartbeat < NOW() - INTERVAL '1 minute' * $1`,
    [staleThresholdMinutes]
  );

  return result.rowCount || 0;
}
