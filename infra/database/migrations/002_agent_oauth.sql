-- =============================================================================
-- Migration: Add OAuth/OIDC Support for Agents
-- =============================================================================
-- This migration adds columns and tables needed for agent OAuth authentication
-- =============================================================================

-- Add OAuth columns to agents table
ALTER TABLE agents.agents
ADD COLUMN IF NOT EXISTS oauth_client_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS token_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_token_refresh TIMESTAMP WITH TIME ZONE;

-- Index for OAuth client lookups
CREATE INDEX IF NOT EXISTS idx_agents_oauth_client
ON agents.agents(oauth_client_id)
WHERE oauth_client_id IS NOT NULL;

-- Agent commands table for remote orchestration
CREATE TABLE IF NOT EXISTS agents.agent_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents.agents(id) ON DELETE CASCADE,
    command_type VARCHAR(50) NOT NULL, -- 'scan', 'update', 'restart', 'config'
    parameters JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'executed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE
);

-- Index for pending commands lookup
CREATE INDEX IF NOT EXISTS idx_agent_commands_pending
ON agents.agent_commands(agent_id, status)
WHERE status = 'pending';

-- Agent tokens table for audit trail (optional, for tracking token usage)
CREATE TABLE IF NOT EXISTS agents.agent_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents.agents(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    use_count INTEGER DEFAULT 0,
    source_ip VARCHAR(45),
    user_agent TEXT
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_agent_tokens_hash
ON agents.agent_tokens(token_hash)
WHERE revoked_at IS NULL;

-- Index for expired token cleanup
CREATE INDEX IF NOT EXISTS idx_agent_tokens_expires
ON agents.agent_tokens(expires_at)
WHERE revoked_at IS NULL;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION agents.cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM agents.agent_tokens
    WHERE expires_at < NOW() - INTERVAL '7 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to revoke all tokens for an agent
CREATE OR REPLACE FUNCTION agents.revoke_agent_tokens(p_agent_id UUID)
RETURNS INTEGER AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    UPDATE agents.agent_tokens
    SET revoked_at = NOW()
    WHERE agent_id = p_agent_id
    AND revoked_at IS NULL;

    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    RETURN revoked_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN agents.agents.oauth_client_id IS 'OAuth client ID for agent authentication';
COMMENT ON COLUMN agents.agents.token_hash IS 'SHA-256 hash of the agent client secret';
COMMENT ON COLUMN agents.agents.last_token_refresh IS 'Timestamp of last successful token refresh';

COMMENT ON TABLE agents.agent_commands IS 'Command queue for remote agent orchestration';
COMMENT ON COLUMN agents.agent_commands.command_type IS 'Type of command: scan, update, restart, config';
COMMENT ON COLUMN agents.agent_commands.status IS 'Command status: pending, sent, executed, failed';

COMMENT ON TABLE agents.agent_tokens IS 'Audit trail for agent token issuance and usage';
