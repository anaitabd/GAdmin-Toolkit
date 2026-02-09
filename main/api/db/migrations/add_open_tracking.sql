-- Migration: Add open tracking tables for email open detection
-- Tracks which recipients opened campaign emails via a 1x1 tracking pixel

CREATE TABLE IF NOT EXISTS open_tracking (
    id SERIAL PRIMARY KEY,
    track_id UUID NOT NULL DEFAULT gen_random_uuid(),
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    to_email TEXT NOT NULL,
    opened BOOLEAN NOT NULL DEFAULT FALSE,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS open_events (
    id SERIAL PRIMARY KEY,
    tracking_id INTEGER NOT NULL REFERENCES open_tracking(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_open_tracking_track_id ON open_tracking(track_id);
CREATE INDEX IF NOT EXISTS idx_open_tracking_job_id ON open_tracking(job_id);
CREATE INDEX IF NOT EXISTS idx_open_tracking_to_email ON open_tracking(to_email);
CREATE INDEX IF NOT EXISTS idx_open_events_tracking_id ON open_events(tracking_id);
