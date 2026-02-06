const fs = require('fs');
const path = require('path');

const { config } = require('../config');
const { getGmailClient } = require('./googleAuth');

const logFilePath = path.resolve(__dirname, '..', 'email_logs.txt');

function logLine(line) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `[${timestamp}] ${line}\n`);
}

function base64UrlEncode(input) {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createMimeMessage(to, from, subject, htmlBody) {
  const toValue = String(to || '').trim();
  const fromValue = String(from || '').trim();
  const subjectValue = String(subject || '').trim();
  const bodyValue = String(htmlBody || '');

  if (!toValue) throw new Error('`to` est requis.');
  if (!fromValue) throw new Error('`from` est requis.');

  const mime =
    `Content-Type: text/html; charset="UTF-8"\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Transfer-Encoding: 7bit\r\n` +
    `From: ${fromValue}\r\n` +
    `To: ${toValue}\r\n` +
    (subjectValue ? `Subject: ${subjectValue}\r\n` : '') +
    `\r\n` +
    bodyValue;

  return base64UrlEncode(mime);
}

async function sendEmail(senderEmail, to, subject, htmlBody) {
  const effectiveSender = String(senderEmail || '').trim();
  if (!effectiveSender) throw new Error('`senderEmail` est requis.');

  const gmail = getGmailClient(effectiveSender);
  const raw = createMimeMessage(to, effectiveSender, subject, htmlBody);

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  logLine(`User: ${effectiveSender}, To: ${toValueForLog(to)}, MessageId: ${res.data && res.data.id ? res.data.id : 'unknown'}`);
  return res.data;
}

function toValueForLog(value) {
  return String(value || '').trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendBulkEmails(senders, recipients, subject, htmlBody, onProgress) {
  const senderList = Array.isArray(senders) ? senders : [];
  const recipientList = Array.isArray(recipients) ? recipients : [];

  if (senderList.length === 0) throw new Error('`senders` doit contenir au moins un expéditeur.');
  if (recipientList.length === 0)
    throw new Error('`recipients` doit contenir au moins un destinataire.');

  const normalizedSenders = senderList
    .map((s) => (typeof s === 'string' ? s : s && s.email))
    .map((s) => String(s || '').trim())
    .filter(Boolean);

  const normalizedRecipients = recipientList
    .map((r) => (typeof r === 'string' ? r : r && (r.to || r.email)))
    .map((r) => String(r || '').trim())
    .filter(Boolean);

  if (normalizedSenders.length === 0)
    throw new Error('`senders` ne contient aucun email valide.');
  if (normalizedRecipients.length === 0)
    throw new Error('`recipients` ne contient aucun email valide.');

  const quotaLimit = Number.isFinite(config.quotaLimit) ? config.quotaLimit : 1200000;
  const requestsPerEmail = Number.isFinite(config.requestsPerEmail) ? config.requestsPerEmail : 300;
  const intervalMs = Math.max(0, Math.floor(60000 / Math.max(1, quotaLimit)));

  const total = normalizedRecipients.length;
  let sentCount = 0;
  let senderIndex = 0;
  let perSenderCount = 0;

  for (const recipient of normalizedRecipients) {
    const sender = normalizedSenders[senderIndex];

    try {
      await sendEmail(sender, recipient, subject, htmlBody);
      sentCount++;
      perSenderCount++;

      if (typeof onProgress === 'function') {
        onProgress({
          sentCount,
          total,
          senderEmail: sender,
          recipient,
          ok: true,
        });
      }
    } catch (error) {
      if (typeof onProgress === 'function') {
        onProgress({
          sentCount,
          total,
          senderEmail: sender,
          recipient,
          ok: false,
          error: error && error.message ? error.message : String(error),
        });
      }
      logLine(`ERROR User: ${sender}, To: ${recipient}, Error: ${error && error.message ? error.message : String(error)}`);
    }

    if (perSenderCount >= requestsPerEmail) {
      senderIndex = (senderIndex + 1) % normalizedSenders.length;
      perSenderCount = 0;
    }

    if (intervalMs > 0) {
      await sleep(intervalMs);
    }
  }

  return { sentCount, total };
}

async function listAllMessages(gmail, query) {
  const messages = [];
  let pageToken;

  do {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      pageToken,
      maxResults: 500,
    });

    const batch = (res && res.data && Array.isArray(res.data.messages) && res.data.messages) || [];
    messages.push(...batch);
    pageToken = res && res.data ? res.data.nextPageToken : undefined;
  } while (pageToken);

  return messages;
}

function extractEmailFromSnippet(snippet) {
  const text = String(snippet || '');
  const match = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
  return match ? match[0] : null;
}

async function getBouncedEmails(userEmail) {
  const effectiveUser = String(userEmail || '').trim();
  if (!effectiveUser) throw new Error('`userEmail` est requis.');

  const gmail = getGmailClient(effectiveUser);

  const bounced = new Set();
  const messages = await listAllMessages(gmail, 'from:"Mail Delivery Subsystem"');

  for (const msg of messages) {
    if (!msg || !msg.id) continue;

    try {
      const res = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
      });

      const snippet = res && res.data ? res.data.snippet : '';
      const email = extractEmailFromSnippet(snippet);
      if (email) bounced.add(email);
    } catch (error) {
      logLine(
        `ERROR Bounce user: ${effectiveUser}, messageId: ${msg.id}, Error: ${error && error.message ? error.message : String(error)}`
      );
    }
  }

  const result = Array.from(bounced);
  logLine(`Bounce user: ${effectiveUser}, found: ${result.length}`);
  return result;
}

module.exports = {
  createMimeMessage,
  sendEmail,
  sendBulkEmails,
  getBouncedEmails,
};
