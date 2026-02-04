-- Migration: Create vps_redirect_pages table
-- Version: 013
-- Date: 2026-02-04

CREATE TABLE IF NOT EXISTS vps_redirect_pages (
    id SERIAL PRIMARY KEY,
    
    -- References
    campaign_id INTEGER NOT NULL,
    ec2_instance_id INTEGER NOT NULL REFERENCES ec2_instances(id),
    tracking_domain_id INTEGER NOT NULL REFERENCES tracking_domains(id),
    
    -- Page configuration
    page_type VARCHAR(50) NOT NULL CHECK (page_type IN ('offer', 'unsubscribe', 'click_redirect')),
    page_slug VARCHAR(255) NOT NULL,
    
    -- Redirect URL
    real_url TEXT NOT NULL,
    
    -- HTML Content
    html_content TEXT,
    redirect_delay_ms INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    
    -- Stats
    total_visits INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_vps_redirect_unique ON vps_redirect_pages(tracking_domain_id, page_slug);
CREATE INDEX idx_vps_redirect_campaign ON vps_redirect_pages(campaign_id);
CREATE INDEX idx_vps_redirect_ec2 ON vps_redirect_pages(ec2_instance_id);

-- Trigger to update updated_at
CREATE TRIGGER update_vps_redirect_pages_updated_at BEFORE UPDATE ON vps_redirect_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
