-- Migration: Create gsuite_service_accounts table
-- Version: 007
-- Date: 2026-02-04

CREATE TABLE IF NOT EXISTS gsuite_service_accounts (
    id SERIAL PRIMARY KEY,
    
    -- Reference
    gsuite_domain_id INTEGER NOT NULL REFERENCES gsuite_domains(id) ON DELETE CASCADE,
    
    -- Service Account Details
    service_account_email VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    private_key_id VARCHAR(255) NOT NULL,
    
    -- Credentials (encrypted)
    credentials_json TEXT NOT NULL,
    private_key_encrypted TEXT NOT NULL,
    
    -- Configuration
    scopes TEXT[] DEFAULT ARRAY[
        'https://www.googleapis.com/auth/admin.directory.user',
        'https://mail.google.com/',
        'https://www.googleapis.com/auth/gmail.send'
    ],
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'expired', 'invalid')),
    last_auth_success_at TIMESTAMP,
    last_auth_error TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_service_accounts_domain ON gsuite_service_accounts(gsuite_domain_id);
CREATE INDEX idx_service_accounts_status ON gsuite_service_accounts(status);

-- Trigger to update updated_at
CREATE TRIGGER update_gsuite_service_accounts_updated_at BEFORE UPDATE ON gsuite_service_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
