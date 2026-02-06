const emailService = require('../services/emailService');
const { getIo } = require('../socket');
const progressStore = require('../progressStore');

function makeRequestId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function sendSingle(req, res, next) {
  try {
    const senderEmail = req.body && req.body.senderEmail;
    const to = req.body && (req.body.to || req.body.recipient);
    const subject = req.body && req.body.subject;
    const htmlBody = req.body && (req.body.htmlBody || req.body.html);

    if (!senderEmail) throw httpError(400, '`senderEmail` requis');
    if (!to) throw httpError(400, '`to` requis');

    const result = await emailService.sendEmail(senderEmail, to, subject || '', htmlBody || '');
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

async function sendBulk(req, res, next) {
  try {
    const senders = req.body && req.body.senders;
    const recipients = req.body && (req.body.recipients || req.body.to);
    const subject = (req.body && req.body.subject) || '';
    const htmlBody = (req.body && (req.body.htmlBody || req.body.html)) || '';

    const clientRequestId = req.body && req.body.requestId;
    const requestId = typeof clientRequestId === 'string' && clientRequestId.trim() ? clientRequestId.trim() : makeRequestId();
    const io = getIo();

    progressStore.init(requestId, {
      type: 'send-bulk',
    });

    if (io) {
      io.emit('bulk_start', {
        requestId,
        timestamp: new Date().toISOString(),
      });
    }

    const result = await emailService.sendBulkEmails(senders, recipients, subject, htmlBody, (progress) => {
      progressStore.updateProgress(requestId, {
        requestId,
        timestamp: new Date().toISOString(),
        ...progress,
      });
      if (!io) return;
      io.emit('progress', {
        requestId,
        ...progress,
      });
    });

    if (io) {
      io.emit('bulk_done', {
        requestId,
        timestamp: new Date().toISOString(),
        ...result,
      });
    }

    progressStore.markDone(requestId, {
      requestId,
      timestamp: new Date().toISOString(),
      ...result,
    });

    return res.json({
      success: true,
      data: { ...result, requestId },
      count: result && result.sentCount ? result.sentCount : 0,
    });
  } catch (err) {
    return next(err);
  }
}

async function getBulkProgress(req, res, next) {
  try {
    const requestId = req.params && req.params.requestId;
    if (!requestId) throw httpError(400, '`requestId` requis');

    const data = progressStore.get(String(requestId));
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

async function getBounced(req, res, next) {
  try {
    const userEmail =
      (req.query && req.query.userEmail) ||
      (req.params && (req.params.userEmail || req.params.email)) ||
      (req.body && (req.body.userEmail || req.body.email));

    if (!userEmail) throw httpError(400, '`userEmail` requis');

    const bounced = await emailService.getBouncedEmails(userEmail);
    return res.json({ success: true, data: bounced, count: bounced.length });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  sendSingle,
  sendBulk,
  getBounced,
  getBulkProgress,
};
