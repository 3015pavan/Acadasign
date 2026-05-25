import { z } from 'zod';

export const questionTypeSchema = z.enum([
  'multiple_choice',
  'short_answer',
  'long_answer',
  'true_false',
  'fill_in_blank',
]);

export const difficultyLevelSchema = z.enum(['easy', 'medium', 'hard']);

export const sectionSchema = z.object({
  name: z.string().min(1),
  questionType: questionTypeSchema,
  numberOfQuestions: z.number().int().min(1),
  marksPerQuestion: z.number().int().min(1),
});

export const difficultyDistributionSchema = z.object({
  easy: z.number().min(0).max(100),
  medium: z.number().min(0).max(100),
  hard: z.number().min(0).max(100),
}).refine((value) => value.easy + value.medium + value.hard === 100, {
  message: 'Difficulty percentages must sum to 100',
});

export const assignmentFormSchema = z.object({
  title: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  gradeLevel: z.string().trim().min(1),
  dueDate: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()) && new Date(value).getTime() > Date.now(), {
    message: 'Due date must be in the future',
  }),
  totalMarks: z.number().int().positive(),
  duration: z.number().int().positive(),
  questionTypes: z.array(questionTypeSchema).min(1),
  sections: z.array(sectionSchema).min(1),
  difficulty: difficultyDistributionSchema,
  additionalInstructions: z.string().trim().optional().default(''),
});

export const generatedQuestionSchema = z.object({
  id: z.string(),
  number: z.number(),
  text: z.string().min(1),
  type: questionTypeSchema,
  difficulty: difficultyLevelSchema,
  marks: z.number().positive(),
  options: z.array(z.string()).optional(),
});

export const generatedSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  instruction: z.string(),
  questions: z.array(generatedQuestionSchema),
});

export const generatedPaperSchema = z.object({
  title: z.string(),
  subject: z.string(),
  topic: z.string(),
  gradeLevel: z.string(),
  totalMarks: z.number(),
  duration: z.number(),
  sections: z.array(generatedSectionSchema),
});

export type AssignmentFormInput = z.infer<typeof assignmentFormSchema>;
export type GeneratedPaperInput = z.infer<typeof generatedPaperSchema>;