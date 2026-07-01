import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../services/tokens.js';

function authPayload(user) {
  return {
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, settings: user.settings },
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user)
  };
}

export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    const { name, email, password, avatar } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, avatar, passwordHash });
    return res.status(201).json(authPayload(user));
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    return res.json(authPayload(user));
  } catch (error) {
    return next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const payload = verifyRefreshToken(req.body.refreshToken);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });
    return res.json(authPayload(user));
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}

export async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('name email avatar').sort({ name: 1 });
    return res.json(users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    })));
  } catch (error) {
    return next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { settings: req.body }, { new: true }).select('-passwordHash');
    return res.json(user);
  } catch (error) {
    return next(error);
  }
}
