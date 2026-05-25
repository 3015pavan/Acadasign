import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(env.MONGODB_URI);

  return mongoose.connection;
}