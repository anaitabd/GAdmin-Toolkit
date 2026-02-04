-- Migration: Add admin_users trigger
-- Version: 014
-- Date: 2026-02-04
-- This migration adds the updated_at trigger to admin_users table
-- It must run after 001_create_sender_accounts.sql which creates the update_updated_at_column function

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
