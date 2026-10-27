import { HttpError } from './errorHandler.js';

// Parses req.body (or req.query) with a Zod schema and responds 400 on failure.
// Cleaned body replaces req.body; cleaned query goes on req.validatedQuery
// because req.query is read-only in Express 5.
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return next(new HttpError(400, 'Validation failed', details));
  }
  if (source === 'query') req.validatedQuery = result.data;
  else req.body = result.data;
  next();
};
