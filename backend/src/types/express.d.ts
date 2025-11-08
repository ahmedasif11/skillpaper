// src/types/express.d.ts
import { Request } from 'express';
import { IUser } from '../models/User';

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser | null;
  }
}

export interface RequestWithUser extends Request {
  user: IUser;
}
