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
    user_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    message_index INTEGER,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
    provider TEXT NOT NULL CHECK (provider IN ('gmail_api', 'smtp')),
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
        'generate_users', 'create_google_users',
        'delete_google_users', 'detect_bounces'
    )),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
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

CREATE TABLE IF NOT EXISTS tracking_links (
    id SERIAL PRIMARY KEY,
    short_code TEXT UNIQUE NOT NULL,
    offer_url TEXT NOT NULL,
    name TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracking_clicks (
    id SERIAL PRIMARY KEY,
    tracking_link_id INTEGER NOT NULL REFERENCES tracking_links(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    referer TEXT,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_email_data_to_email ON email_data(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_email ON email_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_credentials_name ON credentials(name);
CREATE INDEX IF NOT EXISTS idx_credentials_active ON credentials(active);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_tracking_links_short_code ON tracking_links(short_code);
CREATE INDEX IF NOT EXISTS idx_tracking_links_active ON tracking_links(active);
CREATE INDEX IF NOT EXISTS idx_tracking_clicks_link_id ON tracking_clicks(tracking_link_id);
CREATE INDEX IF NOT EXISTS idx_tracking_clicks_clicked_at ON tracking_clicks(clicked_at);

-- Default settings
INSERT INTO settings (key, value) VALUES
    ('admin_email', 'admin@example.com'),
    ('default_domain', 'example.com'),
    ('default_num_records', '100'),
    ('notification_enabled', 'false'),
    ('notification_email', '')
ON CONFLICT (key) DO NOTHING;
