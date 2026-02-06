function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  void next;

  const message = err && err.message ? err.message : 'Internal Server Error';
  const status = (err && (err.statusCode || err.status)) || 500;

  console.error(err);
  res.status(status).json({ success: false, error: message });
}

module.exports = { errorHandler };
