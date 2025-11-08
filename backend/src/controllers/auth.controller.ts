// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { generateToken } from '../utils/generateToken';

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

/**
 * Register a new user
 * POST /api/auth/register
 * body: { name, email, password }
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email and password are required' });
    }

    // Check existing
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return res.status(409).json({ message: 'Email already in use' });

    // Hash password
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
    });
    await user.save();

    const token = generateToken({ userId: (user._id as string).toString() });

    // Return safe user fields
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Login user
 * POST /api/auth/login
 * body: { email, password }
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken({ userId: (user._id as string).toString() });

    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user profile data
 * GET /api/auth/profile
 * Protected route - req.user must exist
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const userDoc = await User.findById(user._id).select('-password');
    if (!userDoc) return res.status(404).json({ message: 'User not found' });

    res.json({
      user: {
        id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        profileData: userDoc.profileData || {},
      },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update user profile data
 * PUT /api/auth/profile
 * body: { profileData }
 * Protected route - req.user must exist
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { profileData } = req.body;

    if (!profileData || typeof profileData !== 'object') {
      return res.status(400).json({ message: 'Invalid profile data' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { profileData },
      { new: true }
    ).select('-password');

    if (!updatedUser)
      return res.status(404).json({ message: 'User not found' });

    res.json({
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileData: updatedUser.profileData || {},
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
