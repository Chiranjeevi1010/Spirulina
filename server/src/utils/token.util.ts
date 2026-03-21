import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.config.js';
import type { JWTPayload } from '@spirulina/shared';

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload as object, env.jwtSecret, {
    expiresIn: env.jwtExpiry as string,
  } as jwt.SignOptions);
}

export function generateRefreshToken(): string {
  return uuidv4();
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, env.jwtSecret) as JWTPayload;
}

export function getRefreshTokenExpiry(): Date {
  const days = parseInt(env.jwtRefreshExpiry.replace('d', ''), 10) || 7;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}
