// src/routes/auth.routes.ts
import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/profile
router.get('/profile', authMiddleware, getProfile);

// PUT /api/auth/profile
router.put('/profile', authMiddleware, updateProfile);

export default router;
