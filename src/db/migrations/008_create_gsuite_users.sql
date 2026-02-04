-- Migration: Create gsuite_users table
-- Version: 008
-- Date: 2026-02-04

CREATE TABLE IF NOT EXISTS gsuite_users (
    id SERIAL PRIMARY KEY,
    
    -- Reference
    gsuite_domain_id INTEGER NOT NULL REFERENCES gsuite_domains(id) ON DELETE CASCADE,
    
    -- User Identity
    email VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) UNIQUE,
    given_name VARCHAR(255) NOT NULL,
    family_name VARCHAR(255) NOT NULL,
    full_name VARCHAR(500) GENERATED ALWAYS AS (given_name || ' ' || family_name) STORED,
    
    -- Password (for creation only)
    password_hash VARCHAR(255),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'creating', 'active', 'suspended', 'deleted', 'failed')),
    is_admin BOOLEAN DEFAULT false,
    is_suspended BOOLEAN DEFAULT false,
    
    -- G Suite sync
    google_created_at TIMESTAMP,
    google_last_login_at TIMESTAMP,
    synced_from_google BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    creation_error TEXT,
    notes TEXT
);

CREATE INDEX idx_gsuite_users_domain ON gsuite_users(gsuite_domain_id);
CREATE INDEX idx_gsuite_users_status ON gsuite_users(status);
CREATE INDEX idx_gsuite_users_email ON gsuite_users(email);

-- Trigger to update updated_at
CREATE TRIGGER update_gsuite_users_updated_at BEFORE UPDATE ON gsuite_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
