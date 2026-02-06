const fs = require('fs');
const path = require('path');
const { getDatabase } = require('./index');

/**
 * Migrate existing .env configuration and cred.json to database
 */
function migrateFromEnvAndCredFile() {
  const db = getDatabase();
  
  console.log('Starting migration from .env and cred.json...');

  // 1. Migrate .env configuration
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    console.log('Migrating .env configuration...');
    const dotenv = require('dotenv');
    const envConfig = dotenv.config({ path: envPath });

    if (envConfig.parsed) {
      const envMap = {
        PORT: 'port',
        DEFAULT_DOMAIN: 'default_domain',
        QUOTA_LIMIT: 'quota_limit',
        REQUESTS_PER_EMAIL: 'requests_per_email',
      };

      Object.keys(envMap).forEach((envKey) => {
        const configKey = envMap[envKey];
        const value = envConfig.parsed[envKey];
        if (value !== undefined) {
          db.setConfig(configKey, value, `Migrated from .env ${envKey}`);
          console.log(`  ✓ Migrated ${envKey} -> ${configKey}: ${value}`);
        }
      });
    }
  } else {
    console.log('No .env file found, skipping configuration migration');
  }

  // 2. Migrate cred.json
  const credPath = process.env.CRED_PATH || './cred.json';
  const absoluteCredPath = path.isAbsolute(credPath)
    ? credPath
    : path.resolve(__dirname, '..', credPath);

  if (fs.existsSync(absoluteCredPath)) {
    console.log(`Migrating credential file: ${absoluteCredPath}...`);
    try {
      const credContent = fs.readFileSync(absoluteCredPath, 'utf8');
      const credData = JSON.parse(credContent);

      // Check if credential already exists
      const existing = db.getCredential('default');
      if (!existing) {
        const credId = db.createCredential(
          'default',
          credData.client_email,
          credData.private_key,
          credData.project_id,
          {
            type: credData.type || 'service_account',
            auth_uri: credData.auth_uri,
            token_uri: credData.token_uri,
            auth_provider_x509_cert_url: credData.auth_provider_x509_cert_url,
            client_x509_cert_url: credData.client_x509_cert_url,
          }
        );
        console.log(`  ✓ Created default credential (ID: ${credId})`);
        console.log(`    - client_email: ${credData.client_email}`);

        // 3. Create G Suite account using ADMIN_EMAIL if available
        const adminEmail = process.env.ADMIN_EMAIL;
        const defaultDomain = process.env.DEFAULT_DOMAIN || db.getConfig('default_domain');

        if (adminEmail && defaultDomain) {
          const accountId = db.createGSuiteAccount({
            credentialId: credId,
            adminEmail: adminEmail,
            domain: defaultDomain,
            quotaLimit: parseInt(process.env.QUOTA_LIMIT) || 1200000,
            requestsPerEmail: parseInt(process.env.REQUESTS_PER_EMAIL) || 300,
          });
          console.log(`  ✓ Created default G Suite account (ID: ${accountId})`);
          console.log(`    - admin_email: ${adminEmail}`);
          console.log(`    - domain: ${defaultDomain}`);
        }
      } else {
        console.log('  ⊙ Default credential already exists, skipping');
      }
    } catch (error) {
      console.error(`  ✗ Error migrating credential: ${error.message}`);
    }
  } else {
    console.log(`No credential file found at ${absoluteCredPath}, skipping credential migration`);
  }

  console.log('Migration complete!');
}

/**
 * Import a new credential from a JSON file
 */
function importCredentialFromFile(filePath, name = null) {
  const db = getDatabase();

  if (!fs.existsSync(filePath)) {
    throw new Error(`Credential file not found: ${filePath}`);
  }

  const credContent = fs.readFileSync(filePath, 'utf8');
  const credData = JSON.parse(credContent);

  const credName = name || path.basename(filePath, '.json');

  // Check if credential already exists
  const existing = db.getCredential(credName);
  if (existing) {
    throw new Error(`Credential with name '${credName}' already exists`);
  }

  const credId = db.createCredential(
    credName,
    credData.client_email,
    credData.private_key,
    credData.project_id,
    {
      type: credData.type || 'service_account',
      auth_uri: credData.auth_uri,
      token_uri: credData.token_uri,
      auth_provider_x509_cert_url: credData.auth_provider_x509_cert_url,
      client_x509_cert_url: credData.client_x509_cert_url,
    }
  );

  console.log(`✓ Imported credential '${credName}' (ID: ${credId})`);
  console.log(`  - client_email: ${credData.client_email}`);

  return credId;
}

/**
 * CLI interface for migration
 */
if (require.main === module) {
  const command = process.argv[2];

  try {
    if (!command || command === 'migrate') {
      migrateFromEnvAndCredFile();
    } else if (command === 'import') {
      const filePath = process.argv[3];
      const name = process.argv[4];

      if (!filePath) {
        console.error('Usage: node migrate.js import <path-to-cred.json> [name]');
        process.exit(1);
      }

      importCredentialFromFile(filePath, name);
    } else {
      console.error('Unknown command:', command);
      console.error('Usage: node migrate.js [migrate|import]');
      process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

module.exports = {
  migrateFromEnvAndCredFile,
  importCredentialFromFile,
};
