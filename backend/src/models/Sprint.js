import mongoose from 'mongoose';

const sprintSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    space: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
    goal: String,
    status: { type: String, enum: ['planned', 'active', 'completed'], default: 'planned' },
    startDate: Date,
    endDate: Date
  },
  { timestamps: true }
);

export const Sprint = mongoose.model('Sprint', sprintSchema);
