import express from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../models/User';

export const usersRouter = express.Router();

// Get current user profile
usersRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const auth = req as any;
  const userId = auth.user?.sub;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const user = await User.findById(userId).select('-passwordHash').lean();
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  res.json({ success: true, user });
}));

// Update current user profile (name, role)
usersRouter.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const auth = req as any;
  const userId = auth.user?.sub;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { name, role } = req.body;
  const update: any = {};
  if (typeof name === 'string') update.name = name;
  if (typeof role === 'string') update.role = role;

  const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-passwordHash').lean();
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  res.json({ success: true, user });
}));

export default usersRouter;
