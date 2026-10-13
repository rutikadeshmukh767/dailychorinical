import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import articleRoutes from './routes/articles.js';
import authRoutes from './routes/auth.js';
import { seedIfEmpty } from './seed.js';

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET must be set in production');
    process.exit(1);
  }
  process.env.JWT_SECRET = 'dev-only-secret';
}

// Render sits behind a proxy
app.set('trust proxy', 1);

const allowed = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === 'true';

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // Non-browser clients (curl, health checks) send no Origin header.
      if (!origin) return cb(null, true);
      const ok =
        allowed.includes(origin) ||
        (allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin));
      cb(null, ok);
    },
  })
);
app.use(express.json({ limit: '200kb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('tiny'));

app.get('/', (_req, res) => res.json({ name: 'The Daily Chronicle API', status: 'ok' }));
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'up' : 'down' })
);

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);

app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors)[0]?.message || 'Invalid data' });
  }
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our presses' });
});

try {
  await connectDB();
  await seedIfEmpty();
  app.listen(PORT, () => console.log(`[api] Listening on :${PORT}`));
} catch (err) {
  console.error('[fatal]', err.message);
  process.exit(1);
}
