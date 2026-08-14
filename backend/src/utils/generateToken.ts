// src/utils/generateToken.ts
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwt';

const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

export function generateToken(payload: { userId: string }) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRES,
  } as jwt.SignOptions);
}
