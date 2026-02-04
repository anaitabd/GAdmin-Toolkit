-- Migration: Create gsuite_domains table
-- Version: 006
-- Date: 2026-02-04

CREATE TABLE IF NOT EXISTS gsuite_domains (
    id SERIAL PRIMARY KEY,
    
    -- Domain info
    domain VARCHAR(255) UNIQUE NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'deleted')),
    verified BOOLEAN DEFAULT false,
    
    -- Configuration
    max_users INTEGER DEFAULT 10000,
    auto_create_enabled BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_gsuite_domains_status ON gsuite_domains(status);
CREATE INDEX idx_gsuite_domains_domain ON gsuite_domains(domain);

-- Trigger to update updated_at
CREATE TRIGGER update_gsuite_domains_updated_at BEFORE UPDATE ON gsuite_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
