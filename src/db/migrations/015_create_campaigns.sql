-- Migration: Create campaigns table
-- Version: 015
-- Date: 2026-02-05

CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    
    -- Campaign details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(500),
    html_template TEXT,
    text_template TEXT,
    
    -- Tracking
    sponsor_id INTEGER,
    tracking_domain VARCHAR(255),
    track_opens BOOLEAN DEFAULT true,
    track_clicks BOOLEAN DEFAULT true,
    use_ec2_tracking BOOLEAN DEFAULT false,
    real_offer_url TEXT,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'paused', 'completed', 'cancelled', 'provisioning', 'ready')),
    
    -- EC2 tracking status
    ec2_status VARCHAR(20),
    ec2_instance_id VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    paused_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_sponsor ON campaigns(sponsor_id);
CREATE INDEX idx_campaigns_created ON campaigns(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
