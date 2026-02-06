const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const { config } = require('../config');

function loadCreds() {
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

function getAuthClient(scopes, subject) {
  const creds = loadCreds();
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

function getAdminDirectory(subject) {
  const jwtClient = getAuthClient(
    ['https://www.googleapis.com/auth/admin.directory.user'],
    subject
  );

  return google.admin({
    version: 'directory_v1',
    auth: jwtClient,
  });
}

function getGmailClient(subject) {
  const jwtClient = getAuthClient(['https://mail.google.com/'], subject);

  return google.gmail({
    version: 'v1',
    auth: jwtClient,
  });
}

module.exports = {
  getAuthClient,
  getAdminDirectory,
  getGmailClient,
};
