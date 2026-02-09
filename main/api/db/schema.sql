CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    given_name TEXT,
    family_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_data (
    id SERIAL PRIMARY KEY,
    to_email TEXT NOT NULL,
    geo TEXT,
    list_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_info (
    id SERIAL PRIMARY KEY,
    from_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    html_content TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    message_index INTEGER,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
    provider TEXT NOT NULL CHECK (provider IN ('gmail_api', 'smtp')),
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS click_tracking (
    id SERIAL PRIMARY KEY,
    track_id UUID NOT NULL DEFAULT gen_random_uuid(),
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    to_email TEXT,
    original_url TEXT NOT NULL,
    name TEXT,
    description TEXT,
    tags TEXT[],
    clicked BOOLEAN NOT NULL DEFAULT FALSE,
    clicked_at TIMESTAMPTZ,
    offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL,
    link_type TEXT NOT NULL DEFAULT 'click' CHECK (link_type IN ('click', 'unsub')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS click_events (
    id SERIAL PRIMARY KEY,
    tracking_id INTEGER NOT NULL REFERENCES click_tracking(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    referer TEXT,
    country TEXT,
    city TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS open_tracking (
    id SERIAL PRIMARY KEY,
    track_id UUID NOT NULL DEFAULT gen_random_uuid(),
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    to_email TEXT NOT NULL,
    opened BOOLEAN NOT NULL DEFAULT FALSE,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS open_events (
    id SERIAL PRIMARY KEY,
    tracking_id INTEGER NOT NULL REFERENCES open_tracking(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bounce_logs (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    reason TEXT,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN (
        'send_email_api', 'send_email_smtp',
        'send_campaign_api', 'send_campaign_smtp',
        'generate_users', 'create_google_users',
        'delete_google_users', 'detect_bounces'
    )),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
    progress INTEGER NOT NULL DEFAULT 0,
    total_items INTEGER NOT NULL DEFAULT 0,
    processed_items INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    params JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS names (
    id SERIAL PRIMARY KEY,
    given_name TEXT NOT NULL,
    family_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credentials (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    domain TEXT,
    cred_json JSONB NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS unsubscribes (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    reason TEXT,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    from_name TEXT NOT NULL,
    html_content TEXT NOT NULL,
    click_url TEXT NOT NULL,
    unsub_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offer_clickers (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    to_email TEXT NOT NULL,
    geo TEXT,
    ip_address TEXT,
    user_agent TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_email_data_to_email ON email_data(to_email);
CREATE INDEX IF NOT EXISTS idx_email_data_geo ON email_data(geo);
CREATE INDEX IF NOT EXISTS idx_email_data_list_name ON email_data(list_name);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_email ON email_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_job_id ON email_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_track_id ON click_tracking(track_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_job_id ON click_tracking(job_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_name ON click_tracking(name) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_click_tracking_tags ON click_tracking USING GIN(tags) WHERE tags IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credentials_name ON credentials(name);
CREATE INDEX IF NOT EXISTS idx_credentials_active ON credentials(active);
CREATE INDEX IF NOT EXISTS idx_open_tracking_track_id ON open_tracking(track_id);
CREATE INDEX IF NOT EXISTS idx_open_tracking_job_id ON open_tracking(job_id);
CREATE INDEX IF NOT EXISTS idx_open_tracking_to_email ON open_tracking(to_email);
CREATE INDEX IF NOT EXISTS idx_open_events_tracking_id ON open_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_job_id ON campaigns(job_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_active ON campaign_templates(active);
CREATE INDEX IF NOT EXISTS idx_unsubscribes_email ON unsubscribes(email);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(active);
CREATE INDEX IF NOT EXISTS idx_offer_clickers_offer_id ON offer_clickers(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_clickers_campaign_id ON offer_clickers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_offer_clickers_geo ON offer_clickers(geo);
CREATE INDEX IF NOT EXISTS idx_offer_clickers_to_email ON offer_clickers(to_email);
-- These indexes require columns added by migrations; they'll be created by migration files
-- CREATE INDEX IF NOT EXISTS idx_click_tracking_offer_id ON click_tracking(offer_id);
-- CREATE INDEX IF NOT EXISTS idx_click_tracking_link_type ON click_tracking(link_type);
-- CREATE INDEX IF NOT EXISTS idx_campaigns_offer_id ON campaigns(offer_id);

-- Default settings
INSERT INTO settings (key, value) VALUES
    ('admin_email', 'admin@example.com'),
    ('default_domain', 'example.com'),
    ('default_num_records', '100')
ON CONFLICT (key) DO NOTHING;
