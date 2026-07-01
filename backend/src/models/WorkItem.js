import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    size: Number,
    mimeType: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const changeSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    field: String,
    from: mongoose.Schema.Types.Mixed,
    to: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    body: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const workLogSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    minutes: Number,
    note: String,
    loggedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const workItemSchema = new mongoose.Schema(
  {
    key: { type: String, index: true },
    space: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
    type: { type: String, enum: ['task', 'story', 'epic', 'subtask', 'bug'], default: 'task' },
    title: { type: String, required: true },
    description: String,
    status: { type: String, enum: ['todo', 'in-progress', 'in-review', 'done'], default: 'todo', index: true },
    priority: { type: String, enum: ['lowest', 'low', 'medium', 'high', 'highest'], default: 'medium' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    labels: [String],
    components: [String],
    versions: [String],
    checklist: [{ text: String, done: { type: Boolean, default: false } }],
    storyPoints: { type: Number, default: 0 },
    votes: { type: Number, default: 0 },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
    epic: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem' },
    startDate: Date,
    endDate: Date,
    dueDate: Date,
    parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem' },
    attachments: [attachmentSchema],
    linkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem' }],
    restrictedRoles: [String],
    flagged: { type: Boolean, default: false },
    watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    history: [changeSchema],
    workLogs: [workLogSchema],
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

workItemSchema.pre('save', async function setKey(next) {
  if (this.key) return next();
  const Space = mongoose.model('Space');
  const space = await Space.findById(this.space);
  const count = await mongoose.model('WorkItem').countDocuments({ space: this.space });
  this.key = `${space?.key || 'AURA'}-${count + 1}`;
  next();
});

export const WorkItem = mongoose.model('WorkItem', workItemSchema);
