import { NextFunction, Request, Response } from 'express';

/**
 * Requires authMiddleware first. Only users with isAdmin may continue.
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

export default requireAdmin;
