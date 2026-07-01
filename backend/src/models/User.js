import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatar: String,
    passwordHash: String,
    provider: { type: String, default: 'local' },
    role: { type: String, default: 'member' },
    settings: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      timezone: String,
      language: { type: String, default: 'en' },
      homepage: { type: String, default: 'home' },
      autoWatch: { type: Boolean, default: true },
      emailDigest: { type: String, enum: ['instant', 'daily', 'weekly', 'never'], default: 'daily' }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
