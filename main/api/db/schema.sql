-- Configuration table for app settings
CREATE TABLE IF NOT EXISTS configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Google Service Account credentials
CREATE TABLE IF NOT EXISTS credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  client_email TEXT NOT NULL,
  private_key TEXT NOT NULL,
  project_id TEXT,
  type TEXT DEFAULT 'service_account',
  is_active INTEGER DEFAULT 1,
  metadata TEXT, -- JSON for additional data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- G Suite accounts with geographical data
CREATE TABLE IF NOT EXISTS gsuite_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credential_id INTEGER NOT NULL,
  admin_email TEXT NOT NULL,
  domain TEXT NOT NULL,
  country TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  quota_limit INTEGER DEFAULT 1200000,
  requests_per_email INTEGER DEFAULT 300,
  is_active INTEGER DEFAULT 1,
  metadata TEXT, -- JSON for additional geographical/custom data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (credential_id) REFERENCES credentials(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_configurations_key ON configurations(key);
CREATE INDEX IF NOT EXISTS idx_credentials_name ON credentials(name);
CREATE INDEX IF NOT EXISTS idx_credentials_is_active ON credentials(is_active);
CREATE INDEX IF NOT EXISTS idx_gsuite_accounts_credential_id ON gsuite_accounts(credential_id);
CREATE INDEX IF NOT EXISTS idx_gsuite_accounts_domain ON gsuite_accounts(domain);
CREATE INDEX IF NOT EXISTS idx_gsuite_accounts_is_active ON gsuite_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_gsuite_accounts_country ON gsuite_accounts(country);

-- Insert default configurations
INSERT OR IGNORE INTO configurations (key, value, description) VALUES 
  ('port', '3000', 'Server port'),
  ('default_domain', 'example.com', 'Default Google Workspace domain'),
  ('quota_limit', '1200000', 'Default API quota limit'),
  ('requests_per_email', '300', 'Default requests per email');
