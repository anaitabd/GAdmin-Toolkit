-- Migration: Create tracking_domains table
-- Version: 011
-- Date: 2026-02-04

CREATE TABLE IF NOT EXISTS tracking_domains (
    id SERIAL PRIMARY KEY,
    
    -- Domain info
    domain VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255),
    full_domain VARCHAR(510) GENERATED ALWAYS AS (
        CASE 
            WHEN subdomain IS NOT NULL THEN subdomain || '.' || domain
            ELSE domain
        END
    ) STORED,
    
    -- References
    campaign_id INTEGER,
    ec2_instance_id INTEGER REFERENCES ec2_instances(id),
    
    -- DNS Configuration (Route53)
    hosted_zone_id VARCHAR(100),
    route53_record_name VARCHAR(255),
    route53_record_value VARCHAR(255),
    
    -- SSL
    ssl_certificate_id INTEGER,
    ssl_enabled BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'dns_creating', 'dns_active', 'ssl_pending', 'active', 'failed')),
    dns_verified BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tracking_domains_campaign ON tracking_domains(campaign_id);
CREATE INDEX idx_tracking_domains_ec2_instance ON tracking_domains(ec2_instance_id);
CREATE INDEX idx_tracking_domains_full_domain ON tracking_domains(full_domain);
CREATE UNIQUE INDEX idx_tracking_domains_unique ON tracking_domains(full_domain);

-- Trigger to update updated_at
CREATE TRIGGER update_tracking_domains_updated_at BEFORE UPDATE ON tracking_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
