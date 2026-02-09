-- Migration: Add click_events table for detailed click tracking
-- Stores each individual click with IP, user-agent, country, etc.

CREATE TABLE IF NOT EXISTS click_events (
    id SERIAL PRIMARY KEY,
    tracking_id INTEGER NOT NULL REFERENCES click_tracking(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    referer TEXT,
    country TEXT,
    city TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by tracking link
CREATE INDEX IF NOT EXISTS idx_click_events_tracking_id ON click_events(tracking_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_click_events_clicked_at ON click_events(clicked_at);

-- Index for IP-based lookups (find all clicks from same IP)
CREATE INDEX IF NOT EXISTS idx_click_events_ip ON click_events(ip_address) WHERE ip_address IS NOT NULL;
