-- ============================================================
-- Migration: Full Data & Sponsor Management
-- Aligns GAdmin-Toolkit with iresponse-pro feature set
-- (SMTP + Gmail API only — no servers/VPS/PMTA)
-- ============================================================

BEGIN;

-- ──────────────────────────────────────────────────
-- 1. DATA MANAGEMENT (lists schema equivalent)
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS data_providers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_lists (
    id SERIAL PRIMARY KEY,
    data_provider_id INTEGER REFERENCES data_providers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    table_schema TEXT,
    table_name TEXT,
    total_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE email_data ADD COLUMN IF NOT EXISTS data_list_id INTEGER REFERENCES data_lists(id) ON DELETE SET NULL;
ALTER TABLE email_data ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE email_data ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE email_data ADD COLUMN IF NOT EXISTS email_md5 TEXT;
ALTER TABLE email_data ADD COLUMN IF NOT EXISTS verticals TEXT;
ALTER TABLE email_data ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE email_data ADD COLUMN IF NOT EXISTS is_fresh BOOLEAN DEFAULT TRUE;
ALTER TABLE email_data ADD COLUMN IF NOT EXISTS is_clean BOOLEAN DEFAULT TRUE;
ALTER TABLE email_data ADD COLUMN IF NOT EXISTS is_opener BOOLEAN DEFAULT FALSE;
ALTER TABLE email_data ADD COLUMN IF NOT EXISTS is_clicker BOOLEAN DEFAULT FALSE;
ALTER TABLE email_data ADD COLUMN IF NOT EXISTS is_leader BOOLEAN DEFAULT FALSE;
ALTER TABLE email_data ADD COLUMN IF NOT EXISTS is_unsub BOOLEAN DEFAULT FALSE;
ALTER TABLE email_data ADD COLUMN IF NOT EXISTS is_optout BOOLEAN DEFAULT FALSE;
ALTER TABLE email_data ADD COLUMN IF NOT EXISTS is_hard_bounced BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS blacklists (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'default',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blacklist_emails (
    id SERIAL PRIMARY KEY,
    blacklist_id INTEGER REFERENCES blacklists(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(blacklist_id, email)
);

-- ──────────────────────────────────────────────────
-- 2. SPONSOR/AFFILIATE MANAGEMENT
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS verticals (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_networks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    api_url TEXT,
    api_key TEXT,
    api_type TEXT DEFAULT 'generic' CHECK (api_type IN ('hasoffers', 'everflow', 'cake', 'generic', 'custom')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE offers ADD COLUMN IF NOT EXISTS affiliate_network_id INTEGER REFERENCES affiliate_networks(id) ON DELETE SET NULL;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS vertical_id INTEGER REFERENCES verticals(id) ON DELETE SET NULL;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS production_id TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS payout NUMERIC(10,2);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

CREATE TABLE IF NOT EXISTS creatives (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    affiliate_network_id INTEGER REFERENCES affiliate_networks(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    from_name TEXT NOT NULL,
    html_content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offer_links (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    affiliate_network_id INTEGER REFERENCES affiliate_networks(id) ON DELETE SET NULL,
    creative_id INTEGER REFERENCES creatives(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('click', 'unsub', 'optout')),
    value TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS from_names (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppression_emails (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(offer_id, email)
);

CREATE TABLE IF NOT EXISTS suppression_processes (
    id SERIAL PRIMARY KEY,
    affiliate_network_id INTEGER REFERENCES affiliate_networks(id) ON DELETE SET NULL,
    offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL,
    data_list_ids TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    progress INTEGER DEFAULT 0,
    emails_found INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ──────────────────────────────────────────────────
-- 3. ACTIONS (enrich tracking with affiliate context)
-- ──────────────────────────────────────────────────

ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS affiliate_network_id INTEGER REFERENCES affiliate_networks(id) ON DELETE SET NULL;
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS creative_id INTEGER REFERENCES creatives(id) ON DELETE SET NULL;
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS data_list_id INTEGER REFERENCES data_lists(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL,
    affiliate_network_id INTEGER REFERENCES affiliate_networks(id) ON DELETE SET NULL,
    data_list_id INTEGER REFERENCES data_lists(id) ON DELETE SET NULL,
    to_email TEXT NOT NULL,
    payout NUMERIC(10,2),
    ip_address TEXT,
    user_agent TEXT,
    geo TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE unsubscribes ADD COLUMN IF NOT EXISTS affiliate_network_id INTEGER REFERENCES affiliate_networks(id) ON DELETE SET NULL;
ALTER TABLE unsubscribes ADD COLUMN IF NOT EXISTS data_list_id INTEGER REFERENCES data_lists(id) ON DELETE SET NULL;
ALTER TABLE unsubscribes ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE unsubscribes ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE unsubscribes ADD COLUMN IF NOT EXISTS geo TEXT;

ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS affiliate_network_id INTEGER REFERENCES affiliate_networks(id) ON DELETE SET NULL;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS data_list_id INTEGER REFERENCES data_lists(id) ON DELETE SET NULL;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS creative_id INTEGER REFERENCES creatives(id) ON DELETE SET NULL;

-- ──────────────────────────────────────────────────
-- 4. AUDIT LOG
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action_by TEXT NOT NULL,
    record_id INTEGER,
    record_name TEXT,
    record_type TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('insert', 'update', 'delete')),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────
-- 5. INDEXES
-- ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_data_providers_status ON data_providers(status);
CREATE INDEX IF NOT EXISTS idx_data_lists_provider ON data_lists(data_provider_id);
CREATE INDEX IF NOT EXISTS idx_data_lists_status ON data_lists(status);
CREATE INDEX IF NOT EXISTS idx_email_data_list_id ON email_data(data_list_id);
CREATE INDEX IF NOT EXISTS idx_email_data_md5 ON email_data(email_md5) WHERE email_md5 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_data_is_clean ON email_data(is_clean);
CREATE INDEX IF NOT EXISTS idx_email_data_is_opener ON email_data(is_opener);
CREATE INDEX IF NOT EXISTS idx_email_data_is_clicker ON email_data(is_clicker);
CREATE INDEX IF NOT EXISTS idx_blacklist_emails_email ON blacklist_emails(email);
CREATE INDEX IF NOT EXISTS idx_blacklist_emails_list ON blacklist_emails(blacklist_id);
CREATE INDEX IF NOT EXISTS idx_verticals_name ON verticals(name);
CREATE INDEX IF NOT EXISTS idx_affiliate_networks_status ON affiliate_networks(status);
CREATE INDEX IF NOT EXISTS idx_offers_network ON offers(affiliate_network_id);
CREATE INDEX IF NOT EXISTS idx_offers_vertical ON offers(vertical_id);
CREATE INDEX IF NOT EXISTS idx_creatives_offer ON creatives(offer_id);
CREATE INDEX IF NOT EXISTS idx_creatives_network ON creatives(affiliate_network_id);
CREATE INDEX IF NOT EXISTS idx_offer_links_offer ON offer_links(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_links_creative ON offer_links(creative_id);
CREATE INDEX IF NOT EXISTS idx_from_names_offer ON from_names(offer_id);
CREATE INDEX IF NOT EXISTS idx_subjects_offer ON subjects(offer_id);
CREATE INDEX IF NOT EXISTS idx_suppression_emails_offer ON suppression_emails(offer_id);
CREATE INDEX IF NOT EXISTS idx_suppression_emails_email ON suppression_emails(email);
CREATE INDEX IF NOT EXISTS idx_suppression_processes_offer ON suppression_processes(offer_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_network ON click_tracking(affiliate_network_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_list ON click_tracking(data_list_id);
CREATE INDEX IF NOT EXISTS idx_leads_offer ON leads(offer_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(to_email);
CREATE INDEX IF NOT EXISTS idx_unsubscribes_network ON unsubscribes(affiliate_network_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_offer ON email_logs(offer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_by ON audit_logs(action_by);

COMMIT;
