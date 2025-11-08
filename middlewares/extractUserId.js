function extractUserId(req, res, next) {
  // look in header x-user-id, authorization (bearer token could be firebase id), or body.userId
  const fromHeader = req.headers["x-user-id"];
  const fromBody = req.body && req.body?.userId;
  req.authUserId = fromHeader || fromBody || null;

  next();
}

module.exports = { extractUserId };
