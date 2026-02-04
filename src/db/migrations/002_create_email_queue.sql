-- Migration: Create email_queue table
-- Version: 002
-- Date: 2026-02-03

CREATE TABLE IF NOT EXISTS email_queue (
    id BIGSERIAL PRIMARY KEY,
    
    -- Recipient
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    
    -- Email content
    subject VARCHAR(500) NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    
    -- Metadata
    campaign_id VARCHAR(100),
    tracking_token VARCHAR(100) UNIQUE,
    custom_data JSONB,
    
    -- Queue management
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'assigned', 'sent', 'failed', 'cancelled')),
    assigned_to INTEGER REFERENCES sender_accounts(id),
    assigned_at TIMESTAMP,
    
    -- Retry logic
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    next_retry_at TIMESTAMP,
    last_error TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP
);

-- Indexes for queue operations
CREATE INDEX idx_email_queue_status_next_retry 
    ON email_queue(status, next_retry_at) 
    WHERE status = 'pending';
    
CREATE INDEX idx_email_queue_assigned 
    ON email_queue(assigned_to, status);
    
CREATE INDEX idx_email_queue_campaign 
    ON email_queue(campaign_id);
    
CREATE INDEX idx_email_queue_tracking_token 
    ON email_queue(tracking_token);

-- Index for pending emails with nullable next_retry_at
CREATE INDEX idx_email_queue_pending_null_retry 
    ON email_queue(created_at) 
    WHERE status = 'pending' AND next_retry_at IS NULL;

-- Index for pending emails with retry time
CREATE INDEX idx_email_queue_pending_with_retry 
    ON email_queue(next_retry_at) 
    WHERE status = 'pending' AND next_retry_at IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
