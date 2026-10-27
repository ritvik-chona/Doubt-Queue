import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from './errorHandler.js';

export const AUTH_COOKIE = 'token';

// Verifies the JWT cookie and loads the user fresh from the DB, so a deleted
// account or changed role takes effect immediately.
export async function auth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) throw new HttpError(401, 'Not authenticated');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Session expired or invalid');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Not authenticated');

  req.user = user;
  next();
}
