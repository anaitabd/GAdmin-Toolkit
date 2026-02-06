const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseService {
  constructor(dbPath) {
    this.dbPath = dbPath || path.resolve(__dirname, '..', 'data', 'gadmin.db');
    this.db = null;
  }

  initialize() {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Open database connection
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    // Run schema
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);

    return this;
  }

  getDatabase() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Configuration methods
  getConfig(key) {
    const stmt = this.db.prepare('SELECT value FROM configurations WHERE key = ?');
    const row = stmt.get(key);
    return row ? row.value : null;
  }

  setConfig(key, value, description = null) {
    const stmt = this.db.prepare(`
      INSERT INTO configurations (key, value, description, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        description = COALESCE(excluded.description, description),
        updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(key, value, description);
  }

  getAllConfigs() {
    const stmt = this.db.prepare('SELECT * FROM configurations ORDER BY key');
    return stmt.all();
  }

  // Credential methods
  getCredential(name) {
    const stmt = this.db.prepare('SELECT * FROM credentials WHERE name = ? AND is_active = 1');
    return stmt.get(name);
  }

  getCredentialById(id) {
    const stmt = this.db.prepare('SELECT * FROM credentials WHERE id = ? AND is_active = 1');
    return stmt.get(id);
  }

  getAllCredentials(activeOnly = true) {
    const query = activeOnly
      ? 'SELECT * FROM credentials WHERE is_active = 1 ORDER BY name'
      : 'SELECT * FROM credentials ORDER BY name';
    const stmt = this.db.prepare(query);
    return stmt.all();
  }

  createCredential(name, clientEmail, privateKey, projectId = null, metadata = null) {
    const stmt = this.db.prepare(`
      INSERT INTO credentials (name, client_email, private_key, project_id, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name,
      clientEmail,
      privateKey,
      projectId,
      metadata ? JSON.stringify(metadata) : null
    );
    return result.lastInsertRowid;
  }

  updateCredential(id, updates) {
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.clientEmail !== undefined) {
      fields.push('client_email = ?');
      values.push(updates.clientEmail);
    }
    if (updates.privateKey !== undefined) {
      fields.push('private_key = ?');
      values.push(updates.privateKey);
    }
    if (updates.projectId !== undefined) {
      fields.push('project_id = ?');
      values.push(updates.projectId);
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.isActive ? 1 : 0);
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(updates.metadata ? JSON.stringify(updates.metadata) : null);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(
      `UPDATE credentials SET ${fields.join(', ')} WHERE id = ?`
    );
    return stmt.run(...values);
  }

  deleteCredential(id) {
    const stmt = this.db.prepare('DELETE FROM credentials WHERE id = ?');
    return stmt.run(id);
  }

  deactivateCredential(id) {
    const stmt = this.db.prepare(
      'UPDATE credentials SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    return stmt.run(id);
  }

  // G Suite Account methods
  getGSuiteAccount(id) {
    const stmt = this.db.prepare(`
      SELECT a.*, c.name as credential_name, c.client_email
      FROM gsuite_accounts a
      JOIN credentials c ON a.credential_id = c.id
      WHERE a.id = ? AND a.is_active = 1
    `);
    return stmt.get(id);
  }

  getAllGSuiteAccounts(activeOnly = true, filters = {}) {
    let query = `
      SELECT a.*, c.name as credential_name, c.client_email
      FROM gsuite_accounts a
      JOIN credentials c ON a.credential_id = c.id
    `;
    const conditions = [];
    const params = [];

    if (activeOnly) {
      conditions.push('a.is_active = 1');
    }

    if (filters.country) {
      conditions.push('a.country = ?');
      params.push(filters.country);
    }

    if (filters.domain) {
      conditions.push('a.domain = ?');
      params.push(filters.domain);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.domain, a.admin_email';

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  getGSuiteAccountsByCountry(country) {
    const stmt = this.db.prepare(`
      SELECT a.*, c.name as credential_name, c.client_email
      FROM gsuite_accounts a
      JOIN credentials c ON a.credential_id = c.id
      WHERE a.country = ? AND a.is_active = 1
      ORDER BY a.admin_email
    `);
    return stmt.all(country);
  }

  createGSuiteAccount(data) {
    const stmt = this.db.prepare(`
      INSERT INTO gsuite_accounts (
        credential_id, admin_email, domain, country, region, city, timezone,
        quota_limit, requests_per_email, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.credentialId,
      data.adminEmail,
      data.domain,
      data.country || null,
      data.region || null,
      data.city || null,
      data.timezone || null,
      data.quotaLimit || 1200000,
      data.requestsPerEmail || 300,
      data.metadata ? JSON.stringify(data.metadata) : null
    );
    return result.lastInsertRowid;
  }

  updateGSuiteAccount(id, updates) {
    const fields = [];
    const values = [];

    const fieldMap = {
      credentialId: 'credential_id',
      adminEmail: 'admin_email',
      domain: 'domain',
      country: 'country',
      region: 'region',
      city: 'city',
      timezone: 'timezone',
      quotaLimit: 'quota_limit',
      requestsPerEmail: 'requests_per_email',
      isActive: 'is_active',
      metadata: 'metadata',
    };

    Object.keys(updates).forEach((key) => {
      if (fieldMap[key] && updates[key] !== undefined) {
        fields.push(`${fieldMap[key]} = ?`);
        if (key === 'metadata' && updates[key]) {
          values.push(JSON.stringify(updates[key]));
        } else if (key === 'isActive') {
          values.push(updates[key] ? 1 : 0);
        } else {
          values.push(updates[key]);
        }
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(
      `UPDATE gsuite_accounts SET ${fields.join(', ')} WHERE id = ?`
    );
    return stmt.run(...values);
  }

  deleteGSuiteAccount(id) {
    const stmt = this.db.prepare('DELETE FROM gsuite_accounts WHERE id = ?');
    return stmt.run(id);
  }

  deactivateGSuiteAccount(id) {
    const stmt = this.db.prepare(
      'UPDATE gsuite_accounts SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    return stmt.run(id);
  }
}

// Singleton instance
let instance = null;

function getDatabase() {
  if (!instance) {
    instance = new DatabaseService();
    instance.initialize();
  }
  return instance;
}

module.exports = {
  DatabaseService,
  getDatabase,
};
