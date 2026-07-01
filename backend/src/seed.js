import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from './services/database.js';
import { User } from './models/User.js';
import { Space } from './models/Space.js';
import { WorkItem } from './models/WorkItem.js';
import { Sprint } from './models/Sprint.js';
import { Dashboard, Goal, Notification, Plan, Project, Team } from './models/DirectoryModels.js';

await connectDatabase();

await Promise.all([
  User.deleteMany({ email: /@aura\.demo$/ }),
  Team.deleteMany({ name: /^AURA/ }),
  Space.deleteMany({ key: 'AURA' }),
  WorkItem.deleteMany({ key: /^AURA-/ }),
  Sprint.deleteMany({ name: /^AURA/ }),
  Dashboard.deleteMany({ name: /^AURA/ }),
  Goal.deleteMany({ title: /^AURA/ }),
  Plan.deleteMany({ name: /^AURA/ }),
  Project.deleteMany({ name: /^AURA/ }),
  Notification.deleteMany({ title: /^AURA/ })
]);

const passwordHash = await bcrypt.hash('Password123!', 10);
const [admin, developer, designer] = await User.create([
  { name: 'Ava Brooks', email: 'ava@aura.demo', passwordHash, role: 'admin', settings: { theme: 'light', timezone: 'Asia/Calcutta' } },
  { name: 'Dev Patel', email: 'dev@aura.demo', passwordHash, role: 'manager', settings: { theme: 'dark', timezone: 'Asia/Calcutta' } },
  { name: 'Mira Chen', email: 'mira@aura.demo', passwordHash, role: 'member', settings: { theme: 'system', timezone: 'Asia/Calcutta' } }
]);

const team = await Team.create({
  name: 'AURA Product Team',
  description: 'Cross-functional team building the Jira-style AURA workspace.',
  members: [
    { user: admin._id, role: 'admin' },
    { user: developer._id, role: 'manager' },
    { user: designer._id, role: 'developer' }
  ],
  progress: 64
});

const space = await Space.create({
  name: 'AURA Platform',
  key: 'AURA',
  templateType: 'software',
  accessType: 'open',
  team: team._id,
  lead: admin._id,
  members: [admin._id, developer._id, designer._id]
});

const sprint = await Sprint.create({
  name: 'AURA Sprint 1',
  space: space._id,
  goal: 'Ship a complete Jira-like collaboration loop.',
  status: 'active',
  startDate: new Date(),
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
});

const items = await WorkItem.create([
  {
    space: space._id,
    type: 'epic',
    title: 'Launch Jira-style workspace shell',
    description: 'Navigation, dashboard, board, backlog, timeline, filters, and issue drawer.',
    status: 'in-progress',
    priority: 'highest',
    assignee: developer._id,
    reporter: admin._id,
    sprint: sprint._id,
    labels: ['frontend', 'workspace'],
    components: ['navigation', 'dashboard'],
    storyPoints: 13,
    watchers: [admin._id, developer._id],
    comments: [{ body: 'Keep the interaction model close to Jira Cloud while using original implementation and styling.', author: admin._id }]
  },
  {
    space: space._id,
    type: 'story',
    title: 'Persist issue comments and activity history',
    description: 'Issue drawer should autosave core fields and show comments/history.',
    status: 'in-review',
    priority: 'high',
    assignee: designer._id,
    reporter: developer._id,
    sprint: sprint._id,
    labels: ['issues', 'activity'],
    storyPoints: 8,
    watchers: [developer._id, designer._id]
  },
  {
    space: space._id,
    type: 'bug',
    title: 'Align backend issue type enum with frontend create modal',
    description: 'Bug issues must be accepted by the API.',
    status: 'done',
    priority: 'medium',
    assignee: developer._id,
    reporter: admin._id,
    sprint: sprint._id,
    labels: ['api', 'schema'],
    storyPoints: 3,
    watchers: [admin._id]
  },
  {
    space: space._id,
    type: 'task',
    title: 'Add dashboard widgets for sprint health',
    description: 'Assigned work, activity, progress, workload, velocity, and deadlines.',
    status: 'todo',
    priority: 'medium',
    assignee: admin._id,
    reporter: admin._id,
    labels: ['dashboard', 'reports'],
    storyPoints: 5,
    watchers: [admin._id]
  }
]);

const goal = await Goal.create({
  title: 'AURA Jira Clone Parity',
  description: 'Reach strong Jira-style feature coverage with original code.',
  owner: admin._id,
  team: team._id,
  status: 'on-track',
  progress: 72,
  followers: [admin._id, developer._id, designer._id]
});

await Promise.all([
  Project.create({ name: 'AURA Jira Replica', description: 'Professional project management clone implementation.', status: 'active', owner: admin._id, team: team._id, goal: goal._id, progress: 68, members: [admin._id, developer._id, designer._id], workItems: items.map((item) => item._id) }),
  Plan.create({ name: 'AURA Release Roadmap', description: 'Timeline for board, backlog, reports, admin, and realtime delivery.', status: 'active', progress: 60, owner: admin._id, spaces: [space._id] }),
  Dashboard.create({
    name: 'AURA Delivery Dashboard',
    description: 'Configurable Jira-style dashboard.',
    owner: admin._id,
    widgets: [
      { type: 'assigned-to-me', x: 0, y: 0, w: 4, h: 2 },
      { type: 'sprint-progress', x: 4, y: 0, w: 4, h: 2 },
      { type: 'recent-activity', x: 8, y: 0, w: 4, h: 2 },
      { type: 'velocity-chart', x: 0, y: 2, w: 6, h: 3 }
    ]
  }),
  Notification.create({ user: admin._id, type: 'assignment', title: 'AURA issue assigned', body: 'You were assigned dashboard widget work.', entityType: 'workItem', entityId: items[3]._id }),
  Notification.create({ user: developer._id, type: 'comment', title: 'AURA issue commented', body: 'Ava commented on the workspace shell epic.', entityType: 'workItem', entityId: items[0]._id })
]);

console.log('Seed complete');
console.log('Login: ava@aura.demo / Password123!');
await mongoose.disconnect();
