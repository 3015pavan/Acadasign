export type QuestionType =
  | 'multiple_choice'
  | 'short_answer'
  | 'long_answer'
  | 'true_false'
  | 'fill_in_blank';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface AssignmentSection {
  name: string;
  questionType: QuestionType;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface AssignmentFormData {
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  dueDate: string;
  totalMarks: number;
  duration: number;
  questionTypes: QuestionType[];
  sections: AssignmentSection[];
  difficulty: DifficultyDistribution;
  additionalInstructions: string;
  uploadedFile?: File | null;
}

export interface GeneratedQuestion {
  id: string;
  number: number;
  text: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  options?: string[];
}

export interface GeneratedSection {
  id: string;
  title: string;
  instruction: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedPaper {
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  totalMarks: number;
  duration: number;
  sections: GeneratedSection[];
}

export type JobStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';