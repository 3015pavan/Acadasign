import { Router } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { env } from '../config/env';
import { asyncHandler } from '../lib/asyncHandler';

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body as { name: string; email: string; password: string; role?: string };
    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Missing fields' });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: role ?? 'teacher' });

    const token = jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET as jwt.Secret, { expiresIn: env.ACCESS_TOKEN_EXPIRES } as jwt.SignOptions);

    // create refresh token and set as httpOnly cookie
    const refreshToken = jwt.sign({ sub: user._id.toString() }, env.REFRESH_TOKEN_SECRET as jwt.Secret, { expiresIn: env.REFRESH_TOKEN_EXPIRES } as jwt.SignOptions);
    const expiresMs = parseExpiryToMs(env.REFRESH_TOKEN_EXPIRES);
    try {
      await RefreshToken.create({ token: refreshToken, userId: user._id, expiresAt: new Date(Date.now() + expiresMs) });
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
    }

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: env.COOKIE_SECURE, sameSite: 'lax', maxAge: expiresMs });

    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Missing credentials' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET as jwt.Secret, { expiresIn: env.ACCESS_TOKEN_EXPIRES } as jwt.SignOptions);

    const refreshToken = jwt.sign({ sub: user._id.toString() }, env.REFRESH_TOKEN_SECRET as jwt.Secret, { expiresIn: env.REFRESH_TOKEN_EXPIRES } as jwt.SignOptions);
    const expiresMs = parseExpiryToMs(env.REFRESH_TOKEN_EXPIRES);
    try {
      await RefreshToken.create({ token: refreshToken, userId: user._id, expiresAt: new Date(Date.now() + expiresMs) });
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
    }
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: env.COOKIE_SECURE, sameSite: 'lax', maxAge: expiresMs });

    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  }),
);

function parseExpiryToMs(exp: string) {
  // supports formats like '15m', '7d', '3600s', '12h'
  const num = parseInt(exp.slice(0, -1), 10);
  const unit = exp.slice(-1);
  if (unit === 's') return num * 1000;
  if (unit === 'm') return num * 60 * 1000;
  if (unit === 'h') return num * 60 * 60 * 1000;
  if (unit === 'd') return num * 24 * 60 * 60 * 1000;
  // fallback: attempts to parse milliseconds
  const asNum = Number(exp);
  if (!Number.isNaN(asNum)) return asNum;
  return 7 * 24 * 60 * 60 * 1000; // default 7 days
}

authRouter.post('/refresh', asyncHandler(async (req, res) => {
  const refresh = req.cookies?.refreshToken as string | undefined;
  if (!refresh) {
    res.status(401).json({ success: false, error: 'Missing refresh token' });
    return;
  }

  try {
    const payload = jwt.verify(refresh, env.REFRESH_TOKEN_SECRET) as any;
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

    const accessToken = jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET as jwt.Secret, { expiresIn: env.ACCESS_TOKEN_EXPIRES } as jwt.SignOptions);
    res.json({ success: true, token: accessToken });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }
}));

authRouter.post('/logout', asyncHandler(async (req, res) => {
  const refresh = req.cookies?.refreshToken as string | undefined;
  if (refresh) {
    await RefreshToken.deleteOne({ token: refresh }).catch(() => null);
  }
  res.clearCookie('refreshToken');
  res.json({ success: true });
}));
