-- Migration: Make click_tracking.job_id optional for standalone tracking links
-- Run this script on existing databases to enable standalone tracking links

-- Make job_id nullable and update foreign key constraint
ALTER TABLE click_tracking 
    ALTER COLUMN job_id DROP NOT NULL;

-- Make to_email nullable as well (for standalone links not tied to specific recipients)
ALTER TABLE click_tracking 
    ALTER COLUMN to_email DROP NOT NULL;

-- Add optional fields for standalone tracking links
ALTER TABLE click_tracking 
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add index for name searches
CREATE INDEX IF NOT EXISTS idx_click_tracking_name ON click_tracking(name) WHERE name IS NOT NULL;

-- Add index for tag searches  
CREATE INDEX IF NOT EXISTS idx_click_tracking_tags ON click_tracking USING GIN(tags) WHERE tags IS NOT NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'click_tracking' 
ORDER BY ordinal_position;
