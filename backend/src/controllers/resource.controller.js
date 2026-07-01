import { Space } from '../models/Space.js';
import { Dashboard, Filter, Goal, Notification, Plan, Project, Team } from '../models/DirectoryModels.js';

const registry = {
  spaces: Space,
  plans: Plan,
  teams: Team,
  goals: Goal,
  projects: Project,
  filters: Filter,
  dashboards: Dashboard,
  notifications: Notification
};

// Which related documents to populate per resource, so the UI gets names instead of bare ObjectIds.
const populateMap = {
  teams: ['members.user'],
  spaces: ['team', 'lead', 'members'],
  projects: ['owner', 'team', 'goal', 'members'],
  goals: ['owner', 'team', 'followers'],
  plans: ['owner']
};

function applyPopulate(query, resource) {
  const paths = populateMap[resource];
  if (!paths) return query;
  return paths.reduce((q, path) => q.populate(path, 'name email avatar'), query);
}

function getModel(req) {
  const model = registry[req.params.resource];
  if (!model) {
    const error = new Error('Unknown resource');
    error.status = 404;
    throw error;
  }
  return model;
}

// Returns the Team _ids the user belongs to. Used to scope team-linked resources (projects, goals, spaces).
async function userTeamIds(userId) {
  const teams = await Team.find({ 'members.user': userId }).select('_id');
  return teams.map((t) => t._id);
}

// Builds the Mongo filter that limits a list/read to things the user actually owns or belongs to.
async function scopeQuery(resource, userId) {
  switch (resource) {
    case 'notifications':
      return { user: userId };
    case 'plans':
    case 'filters':
    case 'dashboards':
      return { owner: userId };
    case 'teams':
      return { 'members.user': userId };
    case 'spaces': {
      const teamIds = await userTeamIds(userId);
      return { $or: [{ lead: userId }, { members: userId }, { team: { $in: teamIds } }] };
    }
    case 'projects': {
      const teamIds = await userTeamIds(userId);
      return { $or: [{ owner: userId }, { members: userId }, { team: { $in: teamIds } }] };
    }
    case 'goals': {
      const teamIds = await userTeamIds(userId);
      return { $or: [{ owner: userId }, { followers: userId }, { team: { $in: teamIds } }] };
    }
    default:
      return {};
  }
}

export async function listResources(req, res, next) {
  try {
    const Model = getModel(req);
    const query = await scopeQuery(req.params.resource, req.user.id);
    const rows = await applyPopulate(Model.find(query).sort({ updatedAt: -1 }).limit(Number(req.query.limit) || 100), req.params.resource);
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createResource(req, res, next) {
  try {
    const Model = getModel(req);
    const resource = req.params.resource;
    let body = { ...req.body };

    if (['plans', 'filters', 'dashboards'].includes(resource)) {
      body.owner = req.user.id;
    } else if (resource === 'spaces') {
      // Whoever creates a space automatically leads it and is a member, so it shows up for them.
      body.lead = req.user.id;
      body.members = Array.from(new Set([...(body.members || []), req.user.id]));
    } else if (resource === 'teams') {
      // Creator becomes the first member (as owner) so the team shows up under their account.
      body.members = [{ user: req.user.id, role: 'owner' }, ...(body.members || [])];
    } else if (resource === 'projects' || resource === 'goals') {
      body.owner = req.user.id;
    }

    const row = await Model.create(body);
    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
}

export async function getResource(req, res, next) {
  try {
    const scope = await scopeQuery(req.params.resource, req.user.id);
    const row = await applyPopulate(getModel(req).findOne({ _id: req.params.id, ...scope }), req.params.resource);
    if (!row) return res.status(404).json({ message: 'Not found' });
    return res.json(row);
  } catch (error) {
    return next(error);
  }
}

export async function updateResource(req, res, next) {
  try {
    const scope = await scopeQuery(req.params.resource, req.user.id);
    const row = await getModel(req).findOneAndUpdate({ _id: req.params.id, ...scope }, req.body, { new: true });
    if (!row) return res.status(404).json({ message: 'Not found, or you do not have access to it' });
    return res.json(row);
  } catch (error) {
    return next(error);
  }
}

export async function deleteResource(req, res, next) {
  try {
    const scope = await scopeQuery(req.params.resource, req.user.id);
    const row = await getModel(req).findOneAndDelete({ _id: req.params.id, ...scope });
    if (!row) return res.status(404).json({ message: 'Not found, or you do not have access to it' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const row = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { readAt: new Date() },
      { new: true }
    );
    if (!row) return res.status(404).json({ message: 'Notification not found' });
    return res.json(row);
  } catch (error) {
    return next(error);
  }
}
