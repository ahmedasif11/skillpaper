import type { Request } from 'express';
import type { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser | null;
    }
  }
}

export interface RequestWithUser extends Request {
  user: IUser;
}
