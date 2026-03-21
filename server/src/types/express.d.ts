import type { JWTPayload } from '@spirulina/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
