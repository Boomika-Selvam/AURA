import { WorkItem } from '../models/WorkItem.js';
import { Notification } from '../models/DirectoryModels.js';
import { accessibleSpaceIds } from '../services/access.js';

const populate = 'space assignee reporter team sprint watchers epic comments.author workLogs.author attachments.uploadedBy';

export async function listWorkItems(req, res, next) {
  try {
    const spaceIds = await accessibleSpaceIds(req.user.id);
    const spaceIdStrings = spaceIds.map(String);

    if (req.query.space) {
      if (!spaceIdStrings.includes(String(req.query.space))) {
        // Not a space this user can see — return an empty list rather than leaking data.
        return res.json([]);
      }
    }

    const query = {};
    ['space', 'status', 'priority', 'assignee', 'sprint', 'team', 'type'].forEach((field) => {
      if (req.query[field]) query[field] = req.query[field];
    });
    if (!query.space) query.space = { $in: spaceIds };
    if (req.query.label) query.labels = req.query.label;

    const rows = await WorkItem.find(query).populate(populate).sort({ order: 1, updatedAt: -1 });
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createWorkItem(req, res, next) {
  try {
    const item = await WorkItem.create({ ...req.body, reporter: req.user.id, watchers: [req.user.id] });
    const saved = await item.populate(populate);
    req.app.get('io')?.to(`space:${item.space}`).emit('work-item:created', saved);
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
}

export async function getWorkItem(req, res, next) {
  try {
    const item = await WorkItem.findById(req.params.id).populate(populate);
    if (!item) return res.status(404).json({ message: 'Work item not found' });
    const spaceIds = (await accessibleSpaceIds(req.user.id)).map(String);
    const itemSpaceId = String(item.space?._id || item.space);
    if (!spaceIds.includes(itemSpaceId)) return res.status(404).json({ message: 'Work item not found' });
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

export async function updateWorkItem(req, res, next) {
  try {
    const current = await WorkItem.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Work item not found' });
    Object.entries(req.body).forEach(([field, value]) => {
      if (JSON.stringify(current[field]) !== JSON.stringify(value)) {
        current.history.push({ actor: req.user.id, field, from: current[field], to: value });
        current[field] = value;
      }
    });
    await current.save();
    const item = await current.populate(populate);
    req.app.get('io')?.to(`space:${item.space._id || item.space}`).emit('work-item:updated', item);
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

export async function deleteWorkItem(req, res, next) {
  try {
    const item = await WorkItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Work item not found' });
    req.app.get('io')?.to(`space:${item.space}`).emit('work-item:deleted', { id: item.id });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function moveWorkItem(req, res, next) {
  try {
    const item = await WorkItem.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, order: req.body.order ?? 0 },
      { new: true }
    ).populate(populate);
    if (!item) return res.status(404).json({ message: 'Work item not found' });
    req.app.get('io')?.to(`space:${item.space._id || item.space}`).emit('board:moved', item);
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

export async function addComment(req, res, next) {
  try {
    const item = await WorkItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Work item not found' });
    if (!req.body.body?.trim()) return res.status(400).json({ message: 'Comment body is required' });
    item.comments.push({ body: req.body.body.trim(), author: req.user.id });
    await item.save();
    if (item.assignee) {
      await Notification.create({
        user: item.assignee,
        type: 'comment',
        title: `New comment on ${item.key}`,
        body: req.body.body,
        entityType: 'workItem',
        entityId: item._id
      });
    }
    const populated = await item.populate(populate);
    req.app.get('io')?.to(`space:${item.space}`).emit('work-item:commented', populated);
    return res.status(201).json(populated);
  } catch (error) {
    return next(error);
  }
}

export async function toggleWatcher(req, res, next) {
  try {
    const item = await WorkItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Work item not found' });
    const userId = String(req.user.id);
    const isWatching = item.watchers.some((id) => String(id) === userId);
    item.watchers = isWatching ? item.watchers.filter((id) => String(id) !== userId) : [...item.watchers, req.user.id];
    await item.save();
    const populated = await item.populate(populate);
    req.app.get('io')?.to(`space:${item.space}`).emit('work-item:updated', populated);
    return res.json(populated);
  } catch (error) {
    return next(error);
  }
}

export async function addWorkLog(req, res, next) {
  try {
    const item = await WorkItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Work item not found' });
    item.workLogs.push({ author: req.user.id, minutes: req.body.minutes, note: req.body.note });
    await item.save();
    return res.status(201).json(item.workLogs.at(-1));
  } catch (error) {
    return next(error);
  }
}
