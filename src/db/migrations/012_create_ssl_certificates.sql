-- Migration: Create ssl_certificates table
-- Version: 012
-- Date: 2026-02-04

CREATE TABLE IF NOT EXISTS ssl_certificates (
    id SERIAL PRIMARY KEY,
    
    tracking_domain_id INTEGER REFERENCES tracking_domains(id),
    domain VARCHAR(255) NOT NULL,
    
    -- Certificate details
    certificate_path VARCHAR(500),
    private_key_path VARCHAR(500),
    
    -- Let's Encrypt
    acme_account_email VARCHAR(255),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'requesting', 'active', 'expired', 'failed')),
    
    -- Dates
    issued_at TIMESTAMP,
    expires_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ssl_certificates_domain ON ssl_certificates(tracking_domain_id);
CREATE INDEX idx_ssl_certificates_status ON ssl_certificates(status);
CREATE INDEX idx_ssl_certificates_expires_at ON ssl_certificates(expires_at) WHERE status = 'active';

-- Trigger to update updated_at
CREATE TRIGGER update_ssl_certificates_updated_at BEFORE UPDATE ON ssl_certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
