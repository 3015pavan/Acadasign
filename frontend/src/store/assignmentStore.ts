import { create } from 'zustand';
import type { GeneratedPaper, JobStatus } from '@/types';
import type { AssignmentFormValues } from '@/lib/validators';
import { assignmentDefaults } from '@/lib/validators';

interface AssignmentStore {
  formData: AssignmentFormValues;
  setFormData: (data: Partial<AssignmentFormValues>) => void;
  resetForm: () => void;
  jobId: string | null;
  assignmentId: string | null;
  status: JobStatus;
  progress: number;
  setJobId: (jobId: string) => void;
  setAssignmentId: (assignmentId: string) => void;
  setStatus: (status: JobStatus) => void;
  setProgress: (progress: number) => void;
  result: GeneratedPaper | null;
  setResult: (result: GeneratedPaper) => void;
}

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  formData: assignmentDefaults,
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  resetForm: () => set({ formData: assignmentDefaults, jobId: null, assignmentId: null, status: 'idle', progress: 0, result: null }),
  jobId: null,
  assignmentId: null,
  status: 'idle',
  progress: 0,
  setJobId: (jobId) => set({ jobId }),
  setAssignmentId: (assignmentId) => set({ assignmentId }),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  result: null,
  setResult: (result) => set({ result }),
}));