// src/routes/auth.routes.ts
import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authLimiter } from '../middlewares/rateLimit';
import { validate } from '../middlewares/validate';
import { registerSchema } from '../validation/auth.validation';

const router = express.Router();

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), register);

// POST /api/auth/login
router.post('/login', authLimiter, login);

// GET /api/auth/profile
router.get('/profile', authMiddleware, getProfile);

// PUT /api/auth/profile
router.put('/profile', authMiddleware, updateProfile);

export default router;
