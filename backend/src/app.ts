import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import templateRoutes from './routes/template.routes';
import resumeRoutes from './routes/resume.routes';
import { globalApiLimiter } from './middlewares/rateLimit';

const app = express();

const trustProxy = process.env.TRUST_PROXY;
if (trustProxy === '1' || trustProxy === 'true') {
  app.set('trust proxy', 1);
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Cleanup-Token'],
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use('/api', globalApiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/resumes', resumeRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

export default app;
