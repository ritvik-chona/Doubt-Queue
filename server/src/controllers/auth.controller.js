import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AUTH_COOKIE } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

const SALT_ROUNDS = 12;
const SESSION_DAYS = 7;

// Compared against when the email doesn't exist, so login takes the same time
// either way and doesn't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', SALT_ROUNDS);

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    // Client (Vercel) and API (Render) are on different domains in production,
    // which requires SameSite=None, which in turn requires Secure.
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
}

function setSessionCookie(res, user) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: `${SESSION_DAYS}d`,
  });
  res.cookie(AUTH_COOKIE, token, {
    ...cookieOptions(),
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export async function register(req, res) {
  const { name, email, password, role } = req.body;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  // A duplicate email hits the unique index and becomes a 409 in errorHandler.
  const user = await User.create({ name, email, passwordHash, role });
  setSessionCookie(res, user);
  res.status(201).json({ user });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'Invalid email or password');

  setSessionCookie(res, user);
  res.json({ user });
}

export function logout(req, res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
  res.status(204).end();
}

export function me(req, res) {
  res.json({ user: req.user });
}
