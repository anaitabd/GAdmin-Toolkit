const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const { config } = require('../config');

function loadCredsFromFile() {
  const credPath = config.credPath || './cred.json';
  const absoluteCredPath = path.isAbsolute(credPath)
    ? credPath
    : path.resolve(__dirname, '..', credPath);

  try {
    const raw = fs.readFileSync(absoluteCredPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    const message =
      error && typeof error.message === 'string' ? error.message : String(error);
    throw new Error(
      `Impossible de charger les credentials Google depuis ${absoluteCredPath}: ${message}`
    );
  }
}

function loadCredsFromDatabase(credentialName = 'default') {
  try {
    const { getDatabase } = require('../db');
    const db = getDatabase();
    const cred = db.getCredential(credentialName);

    if (!cred) {
      throw new Error(`Credential '${credentialName}' not found in database`);
    }

    // Parse metadata if present
    let metadata = {};
    if (cred.metadata) {
      try {
        metadata = JSON.parse(cred.metadata);
      } catch (e) {
        // Ignore parse errors
      }
    }

    return {
      type: cred.type || 'service_account',
      project_id: cred.project_id,
      client_email: cred.client_email,
      private_key: cred.private_key,
      ...metadata,
    };
  } catch (error) {
    const message =
      error && typeof error.message === 'string' ? error.message : String(error);
    throw new Error(
      `Impossible de charger les credentials depuis la base de données: ${message}`
    );
  }
}

function loadCreds(credentialName = null) {
  // Try database first if enabled
  if (config.useDatabase) {
    try {
      return loadCredsFromDatabase(credentialName || 'default');
    } catch (error) {
      // Fall back to file if database fails
      console.warn('Database credential load failed, falling back to file:', error.message);
    }
  }

  // Fall back to file-based credentials
  return loadCredsFromFile();
}

function getAuthClient(scopes, subject, credentialName = null) {
  const creds = loadCreds(credentialName);
  const effectiveSubject = subject || config.adminEmail;

  if (!effectiveSubject) {
    throw new Error(
      'Aucun subject fourni et ADMIN_EMAIL est vide. Fournis `subject` ou définis ADMIN_EMAIL dans .env.'
    );
  }

  const normalizedScopes = Array.isArray(scopes) ? scopes : [scopes].filter(Boolean);
  if (normalizedScopes.length === 0) {
    throw new Error('`scopes` est requis pour créer un JWT Google Auth.');
  }

  return new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    normalizedScopes,
    effectiveSubject
  );
}

function getAdminDirectory(subject, credentialName = null) {
  const jwtClient = getAuthClient(
    ['https://www.googleapis.com/auth/admin.directory.user'],
    subject,
    credentialName
  );

  return google.admin({
    version: 'directory_v1',
    auth: jwtClient,
  });
}

function getGmailClient(subject, credentialName = null) {
  const jwtClient = getAuthClient(['https://mail.google.com/'], subject, credentialName);

  return google.gmail({
    version: 'v1',
    auth: jwtClient,
  });
}

module.exports = {
  getAuthClient,
  getAdminDirectory,
  getGmailClient,
  loadCreds,
};
