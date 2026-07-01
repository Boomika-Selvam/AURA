import express from 'express';
import { acceptInvite, createInvite, getInvite, listInvites } from '../controllers/invite.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public — the invitee may not have an account or be logged in yet.
router.get('/:token', getInvite);
router.post('/:token/accept', acceptInvite);

// Authenticated — only existing members can send/list invites.
router.post('/', requireAuth, createInvite);
router.get('/', requireAuth, listInvites);

export default router;
