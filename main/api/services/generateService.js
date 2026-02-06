const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function normalizeNamePart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9._-]/g, '');
}

function buildEmail(givenName, familyName, domain) {
  const username = `${normalizeNamePart(givenName)}.${normalizeNamePart(familyName)}`.replace(
    /^\.+|\.+$/g,
    ''
  );
  return `${username}@${domain}`;
}

async function readNamesCsv() {
  const namesPath = path.resolve(__dirname, '..', '..', '..', 'files', 'names.csv');

  const records = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(namesPath)
      .pipe(
        csv({
          headers: ['givenName', 'familyName'],
          skipLines: 0,
          strict: false,
        })
      )
      .on('data', (row) => {
        const givenName = String(row.givenName || '').trim();
        const familyName = String(row.familyName || '').trim();

        // Skip header line if present
        if (
          givenName.toLowerCase() === 'givenname' &&
          (familyName.toLowerCase() === 'surname' || familyName.toLowerCase() === 'familyname')
        ) {
          return;
        }

        if (!givenName || !familyName) return;
        records.push({ givenName, familyName });
      })
      .on('error', reject)
      .on('end', resolve);
  });

  if (records.length === 0) {
    throw new Error(`Aucun nom valide trouvé dans ${namesPath}`);
  }

  return records;
}

async function writeUsersCsv(users) {
  const outPath = path.resolve(__dirname, '..', '..', '..', 'files', 'user_list.csv');

  const csvWriter = createObjectCsvWriter({
    path: outPath,
    header: [
      { id: 'email', title: 'email' },
      { id: 'password', title: 'password' },
      { id: 'givenName', title: 'givenName' },
      { id: 'familyName', title: 'familyName' },
    ],
  });

  await csvWriter.writeRecords(users);
  return outPath;
}

async function generateUsersFromNames(domain, numRecords) {
  const effectiveDomain = String(domain || '').trim();
  const count = Number(numRecords);

  if (!effectiveDomain) {
    throw new Error('`domain` est requis.');
  }
  if (!Number.isFinite(count) || count <= 0) {
    throw new Error('`numRecords` doit être un entier positif.');
  }

  const names = await readNamesCsv();

  const fixedPassword = 'Password123@';
  const generatedEmails = new Set();
  const users = [];

  // Safety to avoid infinite loops if count is too high vs available combinations
  const maxAttempts = Math.max(10_000, count * 50);
  let attempts = 0;

  while (users.length < count) {
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error(
        `Impossible de générer ${count} emails uniques après ${maxAttempts} tentatives. Essaie un numRecords plus petit ou un domaine différent.`
      );
    }

    const { givenName, familyName } = pickRandom(names);
    const email = buildEmail(givenName, familyName, effectiveDomain);

    if (!email.includes('@') || email.startsWith('@')) continue;
    if (generatedEmails.has(email)) continue;

    generatedEmails.add(email);
    users.push({
      email,
      password: fixedPassword,
      givenName,
      familyName,
    });
  }

  await writeUsersCsv(users);
  return users;
}

module.exports = {
  generateUsersFromNames,
};
