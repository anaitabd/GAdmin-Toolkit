-- Migration: Create open_events and click_events tables with partitioning
-- Version: 005
-- Date: 2026-02-03

-- Open events
CREATE TABLE IF NOT EXISTS open_events (
    id BIGSERIAL,
    
    -- References
    email_queue_id BIGINT REFERENCES email_queue(id),
    tracking_token VARCHAR(100) NOT NULL,
    campaign_id VARCHAR(100),
    recipient_email VARCHAR(255),
    
    -- Open details
    opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    -- Geolocation (optional)
    country VARCHAR(2),
    city VARCHAR(100),
    
    PRIMARY KEY (id, opened_at)
) PARTITION BY RANGE (opened_at);

-- Create initial partitions
CREATE TABLE open_events_2026_02 PARTITION OF open_events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE open_events_2026_03 PARTITION OF open_events
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- Indexes
CREATE INDEX idx_open_events_token ON open_events(tracking_token);
CREATE INDEX idx_open_events_campaign ON open_events(campaign_id, opened_at DESC);
CREATE INDEX idx_open_events_email ON open_events(recipient_email);

-- Click events
CREATE TABLE IF NOT EXISTS click_events (
    id BIGSERIAL,
    
    -- References
    email_queue_id BIGINT REFERENCES email_queue(id),
    tracking_token VARCHAR(100) NOT NULL,
    campaign_id VARCHAR(100),
    recipient_email VARCHAR(255),
    
    -- Click details
    link_url TEXT NOT NULL,
    clicked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    -- Geolocation (optional)
    country VARCHAR(2),
    city VARCHAR(100),
    
    PRIMARY KEY (id, clicked_at)
) PARTITION BY RANGE (clicked_at);

-- Create initial partitions
CREATE TABLE click_events_2026_02 PARTITION OF click_events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE click_events_2026_03 PARTITION OF click_events
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- Indexes
CREATE INDEX idx_click_events_token ON click_events(tracking_token);
CREATE INDEX idx_click_events_campaign ON click_events(campaign_id, clicked_at DESC);
CREATE INDEX idx_click_events_email ON click_events(recipient_email);
-- For long URLs, we index only the first 100 characters
CREATE INDEX idx_click_events_url ON click_events(substring(link_url, 1, 100));
