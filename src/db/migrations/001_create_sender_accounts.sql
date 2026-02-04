-- Migration: Create sender_accounts table
-- Version: 001
-- Date: 2026-02-03

CREATE TABLE IF NOT EXISTS sender_accounts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    auth_type VARCHAR(20) NOT NULL CHECK (auth_type IN ('gmail', 'smtp')),
    
    -- Gmail API specific
    gmail_subject_email VARCHAR(255),
    
    -- SMTP specific
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    smtp_username VARCHAR(255),
    smtp_password_encrypted TEXT,
    smtp_use_tls BOOLEAN DEFAULT true,
    
    -- Limits and configuration
    daily_limit INTEGER NOT NULL DEFAULT 2000,
    batch_size INTEGER NOT NULL DEFAULT 50,
    send_delay_ms INTEGER NOT NULL DEFAULT 100,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'paused', 'suspended', 'warming_up', 'paused_limit_reached')),
    daily_sent INTEGER NOT NULL DEFAULT 0,
    daily_bounces INTEGER NOT NULL DEFAULT 0,
    daily_errors INTEGER NOT NULL DEFAULT 0,
    last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Warm-up schedule
    warmup_stage INTEGER DEFAULT 0,
    warmup_current_limit INTEGER,
    warmup_started_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    last_heartbeat TIMESTAMP,
    sending_domain VARCHAR(255),
    notes TEXT
);

-- Indexes
CREATE INDEX idx_sender_accounts_status ON sender_accounts(status);
CREATE INDEX idx_sender_accounts_auth_type ON sender_accounts(auth_type);
CREATE INDEX idx_sender_accounts_daily_limit ON sender_accounts(status, daily_sent, daily_limit);
CREATE INDEX idx_sender_accounts_heartbeat ON sender_accounts(last_heartbeat) WHERE status = 'active';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sender_accounts_updated_at BEFORE UPDATE ON sender_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
