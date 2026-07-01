import mongoose from 'mongoose';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura';
  await mongoose.connect(uri);
}
