import mongoose from 'mongoose';

const spaceSchema = new mongoose.Schema(
  {
    templateType: { type: String, default: 'software' },
    name: { type: String, required: true },
    key: { type: String, required: true, uppercase: true, unique: true },
    managementType: { type: String, enum: ['team-managed', 'company-managed'], default: 'team-managed' },
    accessType: { type: String, enum: ['private', 'open', 'limited'], default: 'open' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

export const Space = mongoose.model('Space', spaceSchema);
