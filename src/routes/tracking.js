const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const { query } = require('../db');

const router = express.Router();

const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

router.get('/open/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  const result = await query(
    'SELECT id FROM email_queue WHERE tracking_token = $1',
    [token]
  );

  if (result.rows.length > 0) {
    const emailId = result.rows[0].id;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress;

    await query(`
      INSERT INTO open_events (email_queue_id, ip_address, user_agent)
      VALUES ($1, $2, $3)
    `, [emailId, ipAddress, userAgent]);
  }

  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Expires', '0');
  res.send(TRACKING_PIXEL);
}));

router.get('/click/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('Missing URL parameter');
  }

  const result = await query(
    'SELECT id FROM email_queue WHERE tracking_token = $1',
    [token]
  );

  if (result.rows.length > 0) {
    const emailId = result.rows[0].id;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress;

    await query(`
      INSERT INTO click_events (email_queue_id, url, ip_address, user_agent)
      VALUES ($1, $2, $3, $4)
    `, [emailId, url, ipAddress, userAgent]);
  }

  const safeUrl = decodeURIComponent(url);
  if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) {
    return res.status(400).send('Invalid URL');
  }

  res.redirect(302, safeUrl);
}));

router.get('/unsubscribe/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  const result = await query(
    'SELECT recipient_email FROM email_queue WHERE tracking_token = $1',
    [token]
  );

  if (result.rows.length === 0) {
    return res.status(404).send('Invalid unsubscribe link');
  }

  const email = result.rows[0].recipient_email;

  await query(`
    INSERT INTO unsubscribe_list (email, source)
    VALUES ($1, $2)
    ON CONFLICT (email) DO NOTHING
  `, [email, 'link']);

  await query(`
    UPDATE email_queue
    SET status = 'failed', last_error = 'Unsubscribed'
    WHERE recipient_email = $1 AND status = 'pending'
  `, [email]);

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unsubscribed</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          text-align: center;
        }
        .success {
          color: #28a745;
          font-size: 24px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="success">✓ Unsubscribed Successfully</div>
      <p>You have been removed from our mailing list.</p>
      <p>You will not receive any further emails from us.</p>
    </body>
    </html>
  `);
}));

module.exports = router;
