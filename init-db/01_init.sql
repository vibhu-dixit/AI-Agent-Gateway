-- Enable TimescaleDB extension explicitly (usually pre-enabled, but safe to include)
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    budget_limit NUMERIC(10, 4) NOT NULL,          -- Total allowed budget (e.g., USD)
    budget_consumed NUMERIC(10, 4) DEFAULT 0.0000, -- Running total consumed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL UNIQUE,          -- SHA-256 hash of the API key
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Agent Audit Logs Table
CREATE TABLE IF NOT EXISTS agent_audit_logs (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    api_key_id UUID,
    agent_id VARCHAR(100) NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    cost NUMERIC(10, 4) DEFAULT 0.0000,
    request_path VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,    -- Partitioning key
    status_code INT
);

-- Convert agent_audit_logs into a hypertable partitioned by 'timestamp'
SELECT create_hypertable('agent_audit_logs', 'timestamp', if_not_exists => TRUE);

-- Add standard indexes for fast querying within the hypertable
CREATE INDEX IF NOT EXISTS idx_audit_org_time ON agent_audit_logs (organization_id, timestamp DESC);