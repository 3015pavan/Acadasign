import { Schema, model, models } from 'mongoose';
import type { AssignmentSection, DifficultyDistribution } from '../types';

const sectionSchema = new Schema<AssignmentSection>(
  {
    name: { type: String, required: true },
    questionType: { type: String, required: true },
    numberOfQuestions: { type: Number, required: true },
    marksPerQuestion: { type: Number, required: true },
  },
  { _id: false },
);

const difficultySchema = new Schema<DifficultyDistribution>(
  {
    easy: { type: Number, required: true },
    medium: { type: Number, required: true },
    hard: { type: Number, required: true },
  },
  { _id: false },
);

const assignmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    gradeLevel: { type: String, required: true },
    dueDate: { type: Date, required: true },
    totalMarks: { type: Number, required: true },
    duration: { type: Number, required: true },
    questionTypes: { type: [String], required: true },
    sections: { type: [sectionSchema], required: true },
    difficulty: { type: difficultySchema, required: true },
    additionalInstructions: { type: String, default: '' },
    fileContent: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    jobId: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

export const Assignment = models.Assignment || model('Assignment', assignmentSchema);