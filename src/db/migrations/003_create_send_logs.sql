-- Migration: Create send_logs table with partitioning
-- Version: 003
-- Date: 2026-02-03

CREATE TABLE IF NOT EXISTS send_logs (
    id BIGSERIAL,
    
    -- References
    sender_account_id INTEGER REFERENCES sender_accounts(id),
    email_queue_id BIGINT REFERENCES email_queue(id),
    campaign_id VARCHAR(100),
    
    -- Recipient
    recipient_email VARCHAR(255) NOT NULL,
    
    -- Result
    status VARCHAR(20) NOT NULL 
        CHECK (status IN ('sent', 'failed', 'bounced', 'rejected')),
    message_id VARCHAR(255),
    error_message TEXT,
    error_code VARCHAR(50),
    
    -- Timing
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_time_ms INTEGER,
    
    -- Metadata
    retry_attempt INTEGER DEFAULT 0,
    custom_data JSONB,
    
    PRIMARY KEY (id, sent_at)
) PARTITION BY RANGE (sent_at);

-- Create initial partition for current month
CREATE TABLE send_logs_2026_02 PARTITION OF send_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Create next month's partition
CREATE TABLE send_logs_2026_03 PARTITION OF send_logs
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- Indexes on base table
CREATE INDEX idx_send_logs_sender_account 
    ON send_logs(sender_account_id, sent_at DESC);
    
CREATE INDEX idx_send_logs_campaign 
    ON send_logs(campaign_id, sent_at DESC);
    
CREATE INDEX idx_send_logs_recipient 
    ON send_logs(recipient_email);
    
CREATE INDEX idx_send_logs_status 
    ON send_logs(status, sent_at DESC);
