const fs = require('fs');
const csv = require('csv-parser');

const { sendBulkEmails } = require('./services/emailService');

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

async function main() {
  const senders = await readCsv('../../files/users.csv');
  const recipients = await readCsv('../../files/data.csv');
  const info = await readCsv('../../files/info.csv');
  const htmlBody = fs.readFileSync('../../files/html.txt', 'utf8').trim();

  const subject = info[0] && info[0].subject ? info[0].subject : '';

  const senderEmails = senders.map((u) => u.email).filter(Boolean);
  const recipientEmails = recipients.map((r) => r.to).filter(Boolean);

  const { sentCount, total } = await sendBulkEmails(
    senderEmails,
    recipientEmails,
    subject,
    htmlBody,
    ({ sentCount: sc, total: t, senderEmail, recipient, ok, error }) => {
      if (ok) {
        console.log(`[${sc}/${t}] ${senderEmail} -> ${recipient}`);
      } else {
        console.error(`[${sc}/${t}] ERROR ${senderEmail} -> ${recipient}: ${error}`);
      }
    }
  );

  console.log(`Done. Sent ${sentCount}/${total}`);
}

main().catch((err) => {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});