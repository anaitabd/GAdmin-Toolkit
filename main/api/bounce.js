const fs = require('fs');
const csv = require('csv-parser');

const { getBouncedEmails } = require('./services/emailService');

function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const items = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => items.push(row))
      .on('error', reject)
      .on('end', () => resolve(items));
  });
}

function saveBouncedEmail(email) {
  fs.appendFileSync('bounced_emails.csv', `${email}\n`);
}

async function main() {
  const users = await readCsv('../../files/users.csv');
  const userEmails = users.map((u) => u.email).filter(Boolean);

  console.log(`Total ${userEmails.length} users found.`);

  for (const userEmail of userEmails) {
    console.log(`Processing user: ${userEmail}`);
    const bounced = await getBouncedEmails(userEmail);
    if (bounced.length > 0) {
      console.log(`Found ${bounced.length} messages for user: ${userEmail}`);
      for (const email of bounced) saveBouncedEmail(email);
    } else {
      console.log(`No messages found for user: ${userEmail}`);
    }
  }
}

main().catch((err) => {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
