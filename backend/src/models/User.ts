import { Schema, model, models } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['teacher', 'student', 'admin'], default: 'teacher' },
  },
  { timestamps: true },
);

export const User = models.User || model('User', userSchema);

export type UserDocument = {
  name: string;
  email: string;
  passwordHash: string;
  role: 'teacher' | 'student' | 'admin';
  createdAt: Date;
  updatedAt: Date;
};
