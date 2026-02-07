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

CREATE TABLE IF NOT EXISTS email_send_jobs (
    id SERIAL PRIMARY KEY,
    batch_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    cred_json JSONB NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_email_data_to_email ON email_data(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_email ON email_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_credentials_name ON credentials(name);
CREATE INDEX IF NOT EXISTS idx_credentials_active ON credentials(active);
