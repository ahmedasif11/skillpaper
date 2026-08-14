import rateLimit, { type Options } from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: Options['message'];
  skip?: Options['skip'];
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: options.skip,
    message: options.message ?? {
      message: 'Too many requests, please try again later.',
    },
  });
}

const skipInTest = () => isTest;

/** Loose ceiling for all /api routes. */
export const globalApiLimiter = createRateLimiter({
  windowMs: envInt('RATE_LIMIT_GLOBAL_WINDOW_MS', 15 * 60 * 1000),
  max: envInt('RATE_LIMIT_GLOBAL_MAX', 300),
  message: { message: 'Too many requests, please try again later.' },
  skip: skipInTest,
});

/** Strict limit for register/login (per IP). */
export const authLimiter = createRateLimiter({
  windowMs: envInt('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000),
  max: envInt('RATE_LIMIT_AUTH_MAX', 10),
  message: {
    message: 'Too many authentication attempts, please try again later.',
  },
  skip: skipInTest,
});

/** Tighter limit for PDF generate / regenerate / preview. */
export const pdfLimiter = createRateLimiter({
  windowMs: envInt('RATE_LIMIT_PDF_WINDOW_MS', 15 * 60 * 1000),
  max: envInt('RATE_LIMIT_PDF_MAX', 20),
  message: {
    message: 'Too many PDF requests, please try again later.',
  },
  skip: skipInTest,
});
