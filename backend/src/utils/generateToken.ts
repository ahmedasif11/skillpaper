// src/utils/generateToken.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_in_prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

export function generateToken(payload: { userId: string }) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  } as jwt.SignOptions);
}
