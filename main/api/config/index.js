const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
});

// Support both database-backed and env-based configuration
let dbInstance = null;

function getDbConfig(key, envFallback, defaultValue) {
  try {
    if (!dbInstance) {
      const { getDatabase } = require('../db');
      dbInstance = getDatabase();
    }
    const value = dbInstance.getConfig(key);
    return value !== null ? value : (envFallback !== undefined ? envFallback : defaultValue);
  } catch (error) {
    // Database not available, use env fallback
    return envFallback !== undefined ? envFallback : defaultValue;
  }
}

const config = {
  port: Number(getDbConfig('port', process.env.PORT, 3000)),
  adminEmail: getDbConfig('admin_email', process.env.ADMIN_EMAIL, null),
  credPath: getDbConfig('cred_path', process.env.CRED_PATH, null),
  defaultDomain: getDbConfig('default_domain', process.env.DEFAULT_DOMAIN, null),
  quotaLimit: Number(getDbConfig('quota_limit', process.env.QUOTA_LIMIT, 1200000)),
  requestsPerEmail: Number(getDbConfig('requests_per_email', process.env.REQUESTS_PER_EMAIL, 300)),
  // New: support for database mode
  useDatabase: getDbConfig('use_database', process.env.USE_DATABASE, 'true') === 'true',
};

module.exports = { config };
