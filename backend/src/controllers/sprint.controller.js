import { Sprint } from '../models/Sprint.js';
import { WorkItem } from '../models/WorkItem.js';

export async function listSprints(req, res, next) {
  try {
    const rows = await Sprint.find(req.query.space ? { space: req.query.space } : {}).sort({ createdAt: -1 });
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createSprint(req, res, next) {
  try {
    const sprint = await Sprint.create(req.body);
    req.app.get('io')?.to(`space:${sprint.space}`).emit('sprint:created', sprint);
    res.status(201).json(sprint);
  } catch (error) {
    next(error);
  }
}

export async function startSprint(req, res, next) {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    const active = await Sprint.findOne({ space: sprint.space, status: 'active' });
    if (active) return res.status(409).json({ message: 'Only one active sprint is allowed per space' });
    sprint.status = 'active';
    sprint.startDate = sprint.startDate || new Date();
    await sprint.save();
    req.app.get('io')?.to(`space:${sprint.space}`).emit('sprint:started', sprint);
    return res.json(sprint);
  } catch (error) {
    return next(error);
  }
}

export async function completeSprint(req, res, next) {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    sprint.status = 'completed';
    sprint.endDate = sprint.endDate || new Date();
    await sprint.save();
    await WorkItem.updateMany({ sprint: sprint._id, status: { $ne: 'done' } }, { $unset: { sprint: '' } });
    req.app.get('io')?.to(`space:${sprint.space}`).emit('sprint:completed', sprint);
    return res.json(sprint);
  } catch (error) {
    return next(error);
  }
}
