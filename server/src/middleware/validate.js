import { HttpError } from './errorHandler.js';

// Parses req.body with a Zod schema; replaces it with the cleaned data or responds 400.
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return next(new HttpError(400, 'Validation failed', details));
  }
  req.body = result.data;
  next();
};
