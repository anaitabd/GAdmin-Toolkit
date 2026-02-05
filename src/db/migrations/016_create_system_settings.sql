-- Migration: Create system_settings table
-- Version: 016
-- Date: 2026-02-05

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES admin_users(id)
);

-- Insert default settings
INSERT INTO system_settings (key, value, description) VALUES
    ('emailsPerHour', '500', 'Maximum emails to send per hour per account'),
    ('burstLimit', '50', 'Maximum burst size for sending emails'),
    ('cooldownPeriod', '100', 'Cooldown period in milliseconds between email sends'),
    ('pauseOnBounceThreshold', '10', 'Pause account after this many bounces'),
    ('timezone', '"UTC"', 'System timezone for scheduling'),
    ('smtpTimeout', '30000', 'SMTP timeout in milliseconds')
ON CONFLICT (key) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
