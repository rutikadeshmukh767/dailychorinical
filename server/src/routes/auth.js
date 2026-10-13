import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, signToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again later.' },
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !(await user.verifyPassword(password))) {
    return res.status(401).json({ message: 'Incorrect email or password' });
  }
  res.json({
    token: signToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub).select('name email role');
  if (!user) return res.status(401).json({ message: 'Account no longer exists' });
  res.json({ user });
});

export default router;
