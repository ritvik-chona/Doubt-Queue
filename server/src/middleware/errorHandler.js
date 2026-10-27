// Throw this from anywhere to send a specific status and message.
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = 500;
  let message = 'Something went wrong';
  let details;

  if (err instanceof HttpError) {
    ({ status, message, details } = err);
  } else if (err.code === 11000) {
    // Mongo unique index violation, e.g. a second account with the same email.
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field === 'email' ? 'Email is already registered' : 'Duplicate value';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large';
  }

  if (status === 500) console.error(err);

  res.status(status).json({ error: { message, ...(details && { details }) } });
}
