const { config } = require('../config');
const { generateUsersFromNames } = require('../services/generateService');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function generateUsers(req, res, next) {
  try {
    const domain = String((req.body && req.body.domain) || config.defaultDomain || '').trim();
    const countRaw = req.body && (req.body.count ?? req.body.numRecords);
    const count = Number(countRaw);

    if (!domain) throw httpError(400, '`domain` est requis');
    if (!Number.isFinite(count) || count <= 0) throw httpError(400, '`count` doit être un entier positif');

    const users = await generateUsersFromNames(domain, count);
    return res.json({ success: true, data: users, count: users.length });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  generateUsers,
};
