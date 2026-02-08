-- Migration: Add campaign management tables
-- Run this script on existing databases to add campaign features

-- Add campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    from_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('gmail_api', 'smtp')),
    batch_size INTEGER NOT NULL DEFAULT 300,
    geo TEXT,
    list_name TEXT,
    recipient_offset INTEGER,
    recipient_limit INTEGER,
    user_ids INTEGER[],
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add campaign_templates table
CREATE TABLE IF NOT EXISTS campaign_templates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    from_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('gmail_api', 'smtp')),
    batch_size INTEGER NOT NULL DEFAULT 300,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unsubscribes table
CREATE TABLE IF NOT EXISTS unsubscribes (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    reason TEXT,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_job_id ON campaigns(job_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_active ON campaign_templates(active);
CREATE INDEX IF NOT EXISTS idx_unsubscribes_email ON unsubscribes(email);

-- Verify tables were created
SELECT 
    'campaigns' as table_name, 
    COUNT(*) as row_count 
FROM campaigns
UNION ALL
SELECT 
    'campaign_templates' as table_name, 
    COUNT(*) as row_count 
FROM campaign_templates
UNION ALL
SELECT 
    'unsubscribes' as table_name, 
    COUNT(*) as row_count 
FROM unsubscribes;
