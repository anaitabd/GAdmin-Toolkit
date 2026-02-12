-- ============================================================
-- Migration: Roles, Teams, and Additional Features
-- Adds RBAC, predefined headers, auto-responders, Google accounts,
-- sessions management, and other features for iresponse-pro parity
-- ============================================================

BEGIN;

-- ──────────────────────────────────────────────────
-- 1. ROLES & PERMISSIONS SYSTEM
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role_type TEXT NOT NULL DEFAULT 'team' CHECK (role_type IN ('admin', 'team')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission)
);

CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- ──────────────────────────────────────────────────
-- 2. TEAMS SYSTEM
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_authorizations (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL,
    resource_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, resource_type, resource_id)
);

-- ──────────────────────────────────────────────────
-- 3. PREDEFINED HEADERS
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS predefined_headers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    header_rotation TEXT DEFAULT 'round-robin' CHECK (header_rotation IN ('round-robin', 'random')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────
-- 4. AUTO-RESPONDERS
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auto_responders (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL,
    affiliate_network_id INTEGER REFERENCES affiliate_networks(id) ON DELETE SET NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('open', 'click', 'lead', 'schedule')),
    delay_value INTEGER NOT NULL DEFAULT 1,
    delay_unit TEXT NOT NULL DEFAULT 'hours' CHECK (delay_unit IN ('minutes', 'hours', 'days')),
    creative_id INTEGER REFERENCES creatives(id) ON DELETE SET NULL,
    from_name_id INTEGER REFERENCES from_names(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    send_limit INTEGER,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auto_responder_logs (
    id SERIAL PRIMARY KEY,
    auto_responder_id INTEGER NOT NULL REFERENCES auto_responders(id) ON DELETE CASCADE,
    to_email TEXT NOT NULL,
    trigger_event_id INTEGER,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
    error TEXT
);

-- ──────────────────────────────────────────────────
-- 5. GOOGLE WORKSPACE ACCOUNTS
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS google_accounts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    workspace_domain TEXT NOT NULL,
    service_account_email TEXT,
    service_account_key JSONB,
    daily_send_limit INTEGER DEFAULT 2000,
    sends_today INTEGER DEFAULT 0,
    sends_today_reset_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'quota_exceeded')),
    last_error TEXT,
    last_used_at TIMESTAMPTZ,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link credentials to google accounts
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS google_account_id INTEGER REFERENCES google_accounts(id) ON DELETE SET NULL;

-- ──────────────────────────────────────────────────
-- 6. USER SESSIONS
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- ──────────────────────────────────────────────────
-- 7. APPLICATION LOGS (structured logging table)
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS application_logs (
    id SERIAL PRIMARY KEY,
    log_type TEXT NOT NULL CHECK (log_type IN ('frontend', 'backend')),
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    context JSONB,
    stack_trace TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_logs_type_level ON application_logs(log_type, level);
CREATE INDEX IF NOT EXISTS idx_application_logs_created_at ON application_logs(created_at DESC);

-- ──────────────────────────────────────────────────
-- 8. UPLOADED IMAGES
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uploaded_images (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    filesize INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    url TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────
-- 9. INDEXES FOR PERFORMANCE
-- ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_authorizations_team_id ON team_authorizations(team_id);
CREATE INDEX IF NOT EXISTS idx_auto_responder_logs_auto_responder_id ON auto_responder_logs(auto_responder_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);

COMMIT;
