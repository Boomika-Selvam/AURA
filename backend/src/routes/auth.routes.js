import express from 'express';
import passport from 'passport';
import { body } from 'express-validator';
import { listUsers, login, me, refresh, register, updateSettings } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { signAccessToken, signRefreshToken } from '../services/tokens.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('confirmPassword').custom((value, { req }) => value === req.body.password)
  ],
  register
);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', requireAuth, me);
router.get('/users', requireAuth, listUsers);
router.put('/settings', requireAuth, updateSettings);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const accessToken = signAccessToken(req.user);
  const refreshToken = signRefreshToken(req.user);
  const url = `${process.env.CLIENT_URL || 'http://localhost:4200'}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
  res.redirect(url);
});

export default router;
