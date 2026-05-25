import { Schema, model, models } from 'mongoose';
import type { GeneratedPaper } from '../types';

const resultSchema = new Schema(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    paper: { type: Schema.Types.Mixed, required: true },
    rawPrompt: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'generatedAt', updatedAt: false },
  },
);

export const Result = models.Result || model('Result', resultSchema);

export type ResultDocument = {
  assignmentId: string;
  paper: GeneratedPaper;
  rawPrompt: string;
  generatedAt: Date;
};