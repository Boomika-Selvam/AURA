import { Space } from '../models/Space.js';
import { Team } from '../models/DirectoryModels.js';

/**
 * Returns the _ids of every Space the given user can see — because they lead it,
 * are a direct member, or belong to a Team that's assigned to it.
 */
export async function accessibleSpaceIds(userId) {
  const teams = await Team.find({ 'members.user': userId }).select('_id');
  const teamIds = teams.map((t) => t._id);
  const spaces = await Space.find({
    $or: [{ lead: userId }, { members: userId }, { team: { $in: teamIds } }]
  }).select('_id');
  return spaces.map((s) => s._id);
}
