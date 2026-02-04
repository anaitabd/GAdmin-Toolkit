-- Migration: Modify sender_accounts table for JWT support
-- Version: 009
-- Date: 2026-02-04

-- Add new columns for JWT G Suite integration
ALTER TABLE sender_accounts ADD COLUMN IF NOT EXISTS gsuite_user_id INTEGER REFERENCES gsuite_users(id);
ALTER TABLE sender_accounts ADD COLUMN IF NOT EXISTS gsuite_domain_id INTEGER REFERENCES gsuite_domains(id);
ALTER TABLE sender_accounts ADD COLUMN IF NOT EXISTS service_account_id INTEGER REFERENCES gsuite_service_accounts(id);
ALTER TABLE sender_accounts ADD COLUMN IF NOT EXISTS impersonate_user VARCHAR(255);

-- Drop existing constraint if it exists
ALTER TABLE sender_accounts DROP CONSTRAINT IF EXISTS sender_accounts_auth_type_check;

-- Add new constraint with gmail_jwt support
ALTER TABLE sender_accounts ADD CONSTRAINT sender_accounts_auth_type_check 
    CHECK (auth_type IN ('gmail', 'gmail_jwt', 'smtp'));

-- Create indexes for new foreign keys
CREATE INDEX IF NOT EXISTS idx_sender_accounts_gsuite_user ON sender_accounts(gsuite_user_id);
CREATE INDEX IF NOT EXISTS idx_sender_accounts_gsuite_domain ON sender_accounts(gsuite_domain_id);
CREATE INDEX IF NOT EXISTS idx_sender_accounts_service_account ON sender_accounts(service_account_id);
