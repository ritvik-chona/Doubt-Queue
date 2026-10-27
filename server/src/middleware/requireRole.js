import { HttpError } from './errorHandler.js';

// Use after auth: requireRole('ta') or requireRole('student', 'ta').
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new HttpError(403, `Only ${roles.join(' or ')} accounts can do this`));
  }
  next();
};
