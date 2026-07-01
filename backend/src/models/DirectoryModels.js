import mongoose from 'mongoose';

const baseOptions = { timestamps: true };

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  progress: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  spaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Space' }],
  view: { type: String, default: 'timeline' }
}, baseOptions);

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  progress: { type: Number, default: 0 },
  members: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: String }],
  goals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Goal' }],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }]
}, baseOptions);

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  status: { type: String, enum: ['on-track', 'at-risk', 'off-track', 'completed', 'cancelled'], default: 'on-track' },
  progress: { type: Number, default: 0 },
  tags: [String],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  linkedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  linkedEpics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem' }],
  updates: [{ body: String, author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, createdAt: Date }]
}, baseOptions);

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['planning', 'active', 'paused', 'completed'], default: 'planning' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  goal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' },
  progress: { type: Number, default: 0 },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  workItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem' }],
  statusUpdates: [{ body: String, createdAt: Date }]
}, baseOptions);

const filterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  query: {
    status: [String],
    assignee: String,
    priority: [String],
    labels: [String],
    sprint: String,
    team: String,
    space: String,
    type: [String]
  }
}, baseOptions);

const dashboardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  progress: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  widgets: [{ type: { type: String }, config: mongoose.Schema.Types.Mixed, x: Number, y: Number, w: Number, h: Number }]
}, baseOptions);

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  type: String,
  title: String,
  body: String,
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  readAt: Date
}, baseOptions);

export const Plan = mongoose.model('Plan', planSchema);
export const Team = mongoose.model('Team', teamSchema);
export const Goal = mongoose.model('Goal', goalSchema);
export const Project = mongoose.model('Project', projectSchema);
export const Filter = mongoose.model('Filter', filterSchema);
export const Dashboard = mongoose.model('Dashboard', dashboardSchema);
export const Notification = mongoose.model('Notification', notificationSchema);