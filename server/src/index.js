import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import { courseDoubtRouter, doubtRouter } from './routes/doubt.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const { MONGO_URI, JWT_SECRET, NODE_ENV, PORT = 4000 } = process.env;
const isProd = NODE_ENV === 'production';

// Fail fast on missing config instead of starting half-broken. CLIENT_ORIGIN
// falls back to the Vite dev server locally but must be explicit in production.
const required = ['JWT_SECRET', 'MONGO_URI', ...(isProd ? ['CLIENT_ORIGIN'] : [])];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();

// Production requests pass two proxies: Vercel's /api rewrite, then Render's
// load balancer. Trusting both lets req.ip be the real client (Vercel puts it
// in X-Forwarded-For), so rate limiting is per user rather than per Vercel IP.
app.set('trust proxy', 2);

// Only the deployed client may call the API with cookies. With the Vercel
// rewrite the browser sees same-origin requests, so this mainly guards direct
// cross-origin calls to the Render URL.
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses/:id/doubts', courseDoubtRouter);
app.use('/api/courses', courseRoutes);
app.use('/api/doubts', doubtRouter);

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

app.use(errorHandler);

connectDB(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
