-- Migration: Add offers system with dynamic links and clickers tracking
-- Offers are manually managed; their click_url can change and tracking follows.
-- Clickers are stored per offer + geo + campaign for analysis.

CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    from_name TEXT NOT NULL,
    html_content TEXT NOT NULL,
    click_url TEXT NOT NULL,
    unsub_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offer_clickers (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    to_email TEXT NOT NULL,
    geo TEXT,
    ip_address TEXT,
    user_agent TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add offer_id to click_tracking so tracking links can resolve to the offer's current URL
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL;

-- Add offer_id to campaigns so a campaign is linked to an offer
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL;

-- Add offer_id to unsubscribes
ALTER TABLE unsubscribes ADD COLUMN IF NOT EXISTS offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(active);
CREATE INDEX IF NOT EXISTS idx_offer_clickers_offer_id ON offer_clickers(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_clickers_campaign_id ON offer_clickers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_offer_clickers_geo ON offer_clickers(geo);
CREATE INDEX IF NOT EXISTS idx_offer_clickers_to_email ON offer_clickers(to_email);
CREATE INDEX IF NOT EXISTS idx_click_tracking_offer_id ON click_tracking(offer_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_offer_id ON campaigns(offer_id);
