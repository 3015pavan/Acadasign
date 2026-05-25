import { z } from 'zod';

export const questionTypeSchema = z.enum([
  'multiple_choice',
  'short_answer',
  'long_answer',
  'true_false',
  'fill_in_blank',
]);

export const sectionSchema = z.object({
  name: z.string().trim().min(1, 'Section name is required'),
  questionType: questionTypeSchema,
  numberOfQuestions: z.coerce.number().int().min(1, 'At least one question is required'),
  marksPerQuestion: z.coerce.number().int().min(1, 'Marks per question must be at least 1'),
});

export const difficultySchema = z.object({
  easy: z.coerce.number().min(0).max(100),
  medium: z.coerce.number().min(0).max(100),
  hard: z.coerce.number().min(0).max(100),
}).refine((value) => value.easy + value.medium + value.hard === 100, {
  message: 'Difficulty percentages must sum to 100',
});

export const assignmentSchema = z.object({
  title: z.string().trim().min(1, 'Assignment title is required'),
  subject: z.string().trim().min(1, 'Subject is required'),
  topic: z.string().trim().min(1, 'Topic is required'),
  gradeLevel: z.string().trim().min(1, 'Grade level is required'),
  dueDate: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()) && new Date(value).getTime() > Date.now(), {
    message: 'Due date must be in the future',
  }),
  totalMarks: z.coerce.number().int().positive('Total marks must be positive'),
  duration: z.coerce.number().int().positive('Duration must be positive'),
  questionTypes: z.array(questionTypeSchema).min(1, 'Select at least one question type'),
  sections: z.array(sectionSchema).min(1, 'Add at least one section'),
  difficulty: difficultySchema,
  additionalInstructions: z.string().trim().default(''),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;

export const assignmentDefaults: AssignmentFormValues = {
  title: '',
  subject: '',
  topic: '',
  gradeLevel: '',
  dueDate: '',
  totalMarks: 20,
  duration: 45,
  questionTypes: ['multiple_choice', 'short_answer'],
  sections: [
    {
      name: 'Section A',
      questionType: 'multiple_choice',
      numberOfQuestions: 4,
      marksPerQuestion: 1,
    },
    {
      name: 'Section B',
      questionType: 'short_answer',
      numberOfQuestions: 3,
      marksPerQuestion: 2,
    },
  ],
  difficulty: {
    easy: 40,
    medium: 40,
    hard: 20,
  },
  additionalInstructions: '',
};

export function toAssignmentFormData(values: AssignmentFormValues, uploadedFile?: File | null) {
  const formData = new FormData();

  formData.append('title', values.title);
  formData.append('subject', values.subject);
  formData.append('topic', values.topic);
  formData.append('gradeLevel', values.gradeLevel);
  formData.append('dueDate', values.dueDate);
  formData.append('totalMarks', String(values.totalMarks));
  formData.append('duration', String(values.duration));
  formData.append('questionTypes', JSON.stringify(values.questionTypes));
  formData.append('sections', JSON.stringify(values.sections));
  formData.append('difficulty', JSON.stringify(values.difficulty));
  formData.append('additionalInstructions', values.additionalInstructions);

  if (uploadedFile) {
    formData.append('uploadedFile', uploadedFile);
  }

  return formData;
}