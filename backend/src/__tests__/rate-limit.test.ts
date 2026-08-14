import express from 'express';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { createRateLimiter } from '../middlewares/rateLimit';

describe('SEC-07 rate limits', () => {
  it('returns 429 after the max requests in the window', async () => {
    const app = express();
    app.use(
      createRateLimiter({
        windowMs: 60_000,
        max: 2,
        message: { message: 'Too many requests, please try again later.' },
      })
    );
    app.get('/limited', (_req, res) => {
      res.json({ ok: true });
    });

    await request(app).get('/limited').expect(200);
    await request(app).get('/limited').expect(200);
    const blocked = await request(app).get('/limited');

    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({
      message: 'Too many requests, please try again later.',
    });
  });

  it('mounts auth and PDF limiters without removing authMiddleware', () => {
    const authRoutes = fs.readFileSync(
      path.join(__dirname, '..', 'routes', 'auth.routes.ts'),
      'utf8'
    );
    const resumeRoutes = fs.readFileSync(
      path.join(__dirname, '..', 'routes', 'resume.routes.ts'),
      'utf8'
    );
    const appSource = fs.readFileSync(
      path.join(__dirname, '..', 'app.ts'),
      'utf8'
    );

    expect(appSource).toMatch(/globalApiLimiter/);
    expect(appSource).toMatch(/trust proxy/);

    expect(authRoutes).toMatch(/authLimiter/);
    expect(authRoutes).toMatch(/router\.post\(\s*'\/register',\s*authLimiter/);
    expect(authRoutes).toMatch(/router\.post\(\s*'\/login',\s*authLimiter/);

    expect(resumeRoutes).toMatch(/pdfLimiter/);
    expect(resumeRoutes).toMatch(/authMiddleware/);
    expect(resumeRoutes).toMatch(
      /router\.post\(\s*['"]\/['"],\s*pdfLimiter,\s*authMiddleware/
    );
    expect(resumeRoutes).toMatch(
      /router\.post\(\s*['"]\/:id\/regenerate['"],\s*pdfLimiter,\s*authMiddleware/
    );
    expect(resumeRoutes).toMatch(
      /router\.get\(\s*['"]\/:id\/preview['"],\s*pdfLimiter,\s*authMiddleware/
    );
  });
});
