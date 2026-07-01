import bcrypt from 'bcryptjs';
import { Invite } from '../models/Invite.js';
import { Team } from '../models/DirectoryModels.js';
import { User } from '../models/User.js';
import { sendInviteEmail } from '../services/mailer.js';
import { signAccessToken, signRefreshToken } from '../services/tokens.js';
import { notifyUser } from '../services/notify.js';

function authPayload(user) {
  return {
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, settings: user.settings },
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user)
  };
}

// POST /api/invites  { email, teamId? }
export async function createInvite(req, res, next) {
  try {
    const { email, teamId } = req.body;
    if (!email) return res.status(422).json({ message: 'Email is required' });

    let team = null;
    if (teamId) {
      team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ message: 'Team not found' });
    }

    const invite = await Invite.create({ email, invitedBy: req.user.id, team: team?._id });
    const link = `${process.env.CLIENT_URL || 'http://localhost:4200'}/accept-invite?token=${invite.token}`;
    const inviter = await User.findById(req.user.id);

    const result = await sendInviteEmail({ to: email, inviterName: inviter?.name || 'A teammate', teamName: team?.name, link });

    res.status(201).json({ invite, delivered: result.delivered, ...(result.delivered ? {} : { devLink: link }) });
  } catch (error) {
    next(error);
  }
}

// GET /api/invites/:token  (public — used by the accept-invite page before login)
export async function getInvite(req, res, next) {
  try {
    const invite = await Invite.findOne({ token: req.params.token }).populate('team', 'name').populate('invitedBy', 'name');
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    if (invite.status === 'accepted') return res.status(410).json({ message: 'This invite has already been used' });
    if (invite.expiresAt < new Date()) return res.status(410).json({ message: 'This invite has expired' });

    const existingUser = await User.findOne({ email: invite.email });
    res.json({
      email: invite.email,
      team: invite.team ? { id: invite.team._id, name: invite.team.name } : null,
      invitedBy: invite.invitedBy?.name,
      hasAccount: Boolean(existingUser)
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/invites/:token/accept  { name?, password? }
// If the email has no account yet, name + password create one. If it does, password logs them in.
export async function acceptInvite(req, res, next) {
  try {
    const invite = await Invite.findOne({ token: req.params.token });
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    if (invite.status === 'accepted') return res.status(410).json({ message: 'This invite has already been used' });
    if (invite.expiresAt < new Date()) return res.status(410).json({ message: 'This invite has expired' });

    let user = await User.findOne({ email: invite.email });

    if (!user) {
      const { name, password } = req.body;
      if (!name || !password) return res.status(422).json({ message: 'Name and password are required to create your account' });
      const passwordHash = await bcrypt.hash(password, 12);
      user = await User.create({ name, email: invite.email, passwordHash });
    } else if (req.body.password) {
      const valid = await bcrypt.compare(req.body.password, user.passwordHash || '');
      if (!valid) return res.status(401).json({ message: 'Incorrect password for this existing account' });
    }

    if (invite.team) {
      const team = await Team.findById(invite.team);
      const alreadyMember = team?.members?.some((m) => String(m.user) === String(user.id));
      if (team && !alreadyMember) {
        team.members.push({ user: user.id, role: invite.role || 'member' });
        await team.save();
      }
      await notifyUser(req.app, {
        user: invite.invitedBy,
        type: 'invite-accepted',
        title: `${user.name} accepted your invite`,
        body: team ? `${user.name} joined ${team.name}` : `${user.name} joined AURA`,
        entityType: 'team',
        entityId: invite.team
      });
    }

    invite.status = 'accepted';
    invite.acceptedBy = user.id;
    invite.acceptedAt = new Date();
    await invite.save();

    res.json(authPayload(user));
  } catch (error) {
    next(error);
  }
}

// GET /api/invites?team=teamId  (list outstanding invites, e.g. for a team admin view)
export async function listInvites(req, res, next) {
  try {
    const query = {};
    if (req.query.team) query.team = req.query.team;
    const invites = await Invite.find(query).sort({ createdAt: -1 });
    res.json(invites);
  } catch (error) {
    next(error);
  }
}
