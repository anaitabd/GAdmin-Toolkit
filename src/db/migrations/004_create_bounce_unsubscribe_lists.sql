-- Migration: Create bounce_list and unsubscribe_list tables
-- Version: 004
-- Date: 2026-02-03

-- Bounce list
CREATE TABLE IF NOT EXISTS bounce_list (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Bounce details
    bounce_type VARCHAR(20) NOT NULL CHECK (bounce_type IN ('hard', 'soft', 'complaint')),
    bounce_reason TEXT,
    bounce_code VARCHAR(50),
    
    -- Source
    sender_account_id INTEGER REFERENCES sender_accounts(id),
    campaign_id VARCHAR(100),
    
    -- Timestamps
    first_bounced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_bounced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bounce_count INTEGER NOT NULL DEFAULT 1
);

-- Indexes
CREATE UNIQUE INDEX idx_bounce_list_email ON bounce_list(email);
CREATE INDEX idx_bounce_list_type ON bounce_list(bounce_type);
CREATE INDEX idx_bounce_list_campaign ON bounce_list(campaign_id);

-- Unsubscribe list
CREATE TABLE IF NOT EXISTS unsubscribe_list (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Unsubscribe details
    unsubscribe_reason VARCHAR(100),
    campaign_id VARCHAR(100),
    user_agent TEXT,
    ip_address INET,
    
    -- Timestamps
    unsubscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_unsubscribe_list_email ON unsubscribe_list(email);
CREATE INDEX idx_unsubscribe_list_campaign ON unsubscribe_list(campaign_id);
