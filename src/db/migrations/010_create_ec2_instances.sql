-- Migration: Create ec2_instances table
-- Version: 010
-- Date: 2026-02-04

CREATE TABLE IF NOT EXISTS ec2_instances (
    id SERIAL PRIMARY KEY,
    
    -- Campaign reference (will be added after campaigns table is created)
    campaign_id INTEGER UNIQUE,
    
    -- AWS Configuration
    instance_id VARCHAR(100) UNIQUE,
    instance_type VARCHAR(50) DEFAULT 't2.micro',
    region VARCHAR(50) NOT NULL DEFAULT 'us-east-1',
    
    -- Network
    public_ip VARCHAR(50),
    private_ip VARCHAR(50),
    elastic_ip VARCHAR(50),
    
    -- Security
    security_group_id VARCHAR(100),
    key_pair_name VARCHAR(255),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'creating', 'running', 'stopped', 'terminated', 'failed')),
    health_status VARCHAR(20) DEFAULT 'unknown',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    launched_at TIMESTAMP,
    terminated_at TIMESTAMP,
    creation_error TEXT
);

CREATE INDEX idx_ec2_instances_campaign ON ec2_instances(campaign_id);
CREATE INDEX idx_ec2_instances_instance_id ON ec2_instances(instance_id);
CREATE INDEX idx_ec2_instances_status ON ec2_instances(status);

-- Trigger to update updated_at
CREATE TRIGGER update_ec2_instances_updated_at BEFORE UPDATE ON ec2_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
