// src/middlewares/authMiddleware.ts
import { NextFunction, Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { getJwtSecret } from '../config/jwt';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization as string;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as {
      userId: string;
      iat?: number;
      exp?: number;
    };

    if (!decoded || !decoded.userId)
      return res.status(401).json({ message: 'Invalid token' });

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export default authMiddleware;
