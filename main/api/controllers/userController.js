const path = require('path');

const userService = require('../services/userService');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function ok(res, data) {
  const count = Array.isArray(data) ? data.length : data && typeof data === 'object' && 'length' in data ? data.length : undefined;
  const payload = { success: true, data };
  if (typeof count === 'number') payload.count = count;
  return res.json(payload);
}

async function listUsers(req, res, next) {
  try {
    const domain = (req.query && req.query.domain) || (req.body && req.body.domain);
    const users = await userService.listUsers(domain);
    return res.json({ success: true, data: users, count: users.length });
  } catch (err) {
    return next(err);
  }
}

async function createSingleUser(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object') {
      throw httpError(400, 'Body JSON requis');
    }

    const created = await userService.createUser(req.body);
    return ok(res, created);
  } catch (err) {
    return next(err);
  }
}

async function createUsers(req, res, next) {
  try {
    const csvPathFromBody = req.body && req.body.csvPath;
    const csvPath = csvPathFromBody
      ? String(csvPathFromBody)
      : path.resolve(__dirname, '..', '..', '..', 'files', 'user_list.csv');

    const result = await userService.createUsersFromCSV(csvPath);

    const count = result && result.created ? result.created.length : 0;
    return res.json({ success: true, data: result, count });
  } catch (err) {
    return next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const email =
      (req.params && (req.params.email || req.params.userEmail)) ||
      (req.body && (req.body.email || req.body.userEmail));

    if (!email) throw httpError(400, '`email` requis');

    await userService.deleteUser(email);
    return ok(res, { email, deleted: true });
  } catch (err) {
    return next(err);
  }
}

async function deleteAllUsers(req, res, next) {
  try {
    const domain = (req.query && req.query.domain) || (req.body && req.body.domain);
    const result = await userService.deleteAllUsers(domain);

    const count = result && Array.isArray(result.deleted) ? result.deleted.length : 0;
    return res.json({ success: true, data: result, count });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listUsers,
  createSingleUser,
  createUsers,
  deleteUser,
  deleteAllUsers,
};
