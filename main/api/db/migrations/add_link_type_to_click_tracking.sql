-- Add link_type column to click_tracking to distinguish click vs unsub links
-- This enables [click] and [unsub] tags in offer HTML to be tracked separately
-- When link_type='unsub', the tracking redirect fetches unsub_url from the offer
-- and also records an unsubscribe event

ALTER TABLE click_tracking
ADD COLUMN IF NOT EXISTS link_type TEXT NOT NULL DEFAULT 'click'
CHECK (link_type IN ('click', 'unsub'));

CREATE INDEX IF NOT EXISTS idx_click_tracking_link_type ON click_tracking(link_type);
