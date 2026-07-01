import { Notification } from '../models/DirectoryModels.js';

/**
 * Creates a notification for `userId` and pushes it over the socket if they're connected.
 * Call this any time someone is assigned/owns a work item, plan, goal, etc.
 */
export async function notifyUser(app, { user, type, title, body, entityType, entityId }) {
  if (!user) return null;
  const notification = await Notification.create({ user, type, title, body, entityType, entityId });
  app?.get('io')?.to(`user:${user}`).emit('notification:new', notification);
  return notification;
}
