import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { register, login, logout, me } from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const email = z.string().trim().toLowerCase().pipe(z.email('Invalid email address'));

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email,
  // bcrypt only uses the first 72 bytes, so cap it rather than silently truncate.
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  role: z.enum(['student', 'ta'], { error: "Role must be 'student' or 'ta'" }),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(72),
});

// Slows down password guessing and signup spam. /me and /logout are not limited
// because the client calls /me on every page load.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many attempts, please try again in a few minutes' } },
});

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', auth, me);

export default router;
