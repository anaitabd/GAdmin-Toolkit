const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const { config } = require('../config');
const { getAuthClient, getAdminDirectory } = require('./googleAuth');

const ADMIN_SCOPES = ['https://www.googleapis.com/auth/admin.directory.user'];

async function authorizeIfNeeded(jwtClient) {
  if (!jwtClient || typeof jwtClient.authorize !== 'function') return;
  await jwtClient.authorize();
}

function resolveCsvPath(csvPath) {
  if (!csvPath) throw new Error('`csvPath` est requis.');
  return path.isAbsolute(csvPath) ? csvPath : path.resolve(process.cwd(), csvPath);
}

async function listUsers(domain) {
  const effectiveDomain = String(domain || config.defaultDomain || '').trim();

  const jwtClient = getAuthClient(ADMIN_SCOPES);
  await authorizeIfNeeded(jwtClient);

  const admin = getAdminDirectory();

  const users = [];
  let pageToken;

  do {
    const params = {
      customer: 'my_customer',
      maxResults: 100,
      pageToken,
    };

    if (effectiveDomain) {
      params.domain = effectiveDomain;
    }

    const res = await admin.users.list(params);
    const batch = (res && res.data && Array.isArray(res.data.users) && res.data.users) || [];
    users.push(...batch);
    pageToken = res && res.data ? res.data.nextPageToken : undefined;
  } while (pageToken);

  return users;
}

async function createUser(userData) {
  if (!userData || typeof userData !== 'object') {
    throw new Error('`userData` est requis.');
  }

  const jwtClient = getAuthClient(ADMIN_SCOPES);
  await authorizeIfNeeded(jwtClient);

  const admin = getAdminDirectory();

  const resource = {
    primaryEmail: userData.primaryEmail || userData.email,
    password: userData.password,
    name: userData.name || {
      givenName: userData.givenName,
      familyName: userData.familyName,
    },
    changePasswordAtNextLogin:
      typeof userData.changePasswordAtNextLogin === 'boolean'
        ? userData.changePasswordAtNextLogin
        : false,
  };

  if (!resource.primaryEmail) throw new Error('`primaryEmail` (ou `email`) est requis.');
  if (!resource.password) throw new Error('`password` est requis.');
  if (!resource.name || !resource.name.givenName || !resource.name.familyName) {
    throw new Error('`givenName` et `familyName` (ou `name`) sont requis.');
  }

  const res = await admin.users.insert({
    requestBody: resource,
  });

  return res.data;
}

async function createUsersFromCSV(csvPath) {
  const resolvedPath = resolveCsvPath(csvPath);

  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(resolvedPath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('error', reject)
      .on('end', resolve);
  });

  const created = [];
  const errors = [];

  for (const row of rows) {
    try {
      const result = await createUser({
        email: row.email,
        password: row.password,
        givenName: row.givenName,
        familyName: row.familyName,
      });
      created.push(result);
    } catch (error) {
      errors.push({
        email: row && row.email,
        error: error && error.message ? error.message : String(error),
      });
    }
  }

  return { created, errors };
}

async function deleteUser(email) {
  const userKey = String(email || '').trim();
  if (!userKey) throw new Error('`email` est requis.');

  const jwtClient = getAuthClient(ADMIN_SCOPES);
  await authorizeIfNeeded(jwtClient);

  const admin = getAdminDirectory();
  await admin.users.delete({ userKey });

  return true;
}

async function deleteAllUsers(domain) {
  const effectiveDomain = String(domain || config.defaultDomain || '').trim();
  const adminEmail = String(config.adminEmail || '').trim();

  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL est requis pour éviter de supprimer le compte admin.');
  }

  const users = await listUsers(effectiveDomain);

  const toDelete = users
    .map((u) => (u && u.primaryEmail ? String(u.primaryEmail).trim() : ''))
    .filter(Boolean)
    .filter((email) => email.toLowerCase() !== adminEmail.toLowerCase());

  const deleted = [];
  const errors = [];

  for (const email of toDelete) {
    try {
      await deleteUser(email);
      deleted.push(email);
    } catch (error) {
      errors.push({
        email,
        error: error && error.message ? error.message : String(error),
      });
    }
  }

  return { deleted, errors, total: toDelete.length };
}

module.exports = {
  listUsers,
  createUser,
  createUsersFromCSV,
  deleteUser,
  deleteAllUsers,
};
