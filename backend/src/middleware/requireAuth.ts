import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { RefreshToken } from '../models/RefreshToken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: { sub: string; role?: string };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    const token = header.split(' ')[1];
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as any;
      (req as AuthRequest).user = { sub: String(payload.sub), role: payload.role };
      next();
      return;
    } catch (err) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }
  }

  // Fallback: allow cookie-based session using refresh token
  const refresh = req.cookies?.refreshToken as string | undefined;
  if (!refresh) {
    res.status(401).json({ success: false, error: 'Missing authorization token' });
    return;
  }

  try {
    const payload = jwt.verify(refresh, env.REFRESH_TOKEN_SECRET) as any;
    // verify token exists in DB
    const stored = await RefreshToken.findOne({ token: refresh, userId: payload.sub });
    if (!stored) {
      res.status(401).json({ success: false, error: 'Invalid refresh token' });
      return;
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid user' });
      return;
    }

    (req as AuthRequest).user = { sub: String(user._id), role: user.role };
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (user.role !== role && user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    next();
  };
}
