function validateZod(schema, source = "body") {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed; // replace with parsed values if needed
      next();
    } catch (err) {
      err.statusCode = 400;
      next(err);
    }
  };
}

module.exports = { validateZod };
