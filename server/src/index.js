import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import { courseDoubtRouter, doubtRouter } from './routes/doubt.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const { MONGO_URI, JWT_SECRET, CLIENT_ORIGIN, PORT = 4000 } = process.env;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set');
  process.exit(1);
}

const app = express();

// Render sits behind a proxy; needed for secure cookies and rate limiting by IP.
app.set('trust proxy', 1);

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
