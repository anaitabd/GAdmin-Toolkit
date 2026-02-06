require('../config');

function auth(req, res, next) {
  const expectedKey = process.env.API_KEY;
  const providedKey = req.get('x-api-key');

  if (!expectedKey || providedKey !== expectedKey) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  next();
}

module.exports = { auth };
