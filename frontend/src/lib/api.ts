import axios from 'axios';
import type { AssignmentFormValues } from './validators';
import { toAssignmentFormData } from './validators';
import type { GeneratedPaper } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

// Attach Authorization header from localStorage when running in browser
if (typeof window !== 'undefined') {
  api.interceptors.request.use((config) => {
    try {
      const token = localStorage.getItem('vedaai_token');
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return config;
  });
}

// Auto-refresh access token on 401 using refresh cookie
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = api.post('/api/auth/refresh', {}, { withCredentials: true }).then((r) => r.data.token).catch(() => null).finally(() => {
            isRefreshing = false;
          });
        }

        const newToken = await refreshPromise;
        if (newToken) {
          localStorage.setItem('vedaai_token', newToken);
          original.headers = original.headers ?? {};
          original.headers['Authorization'] = `Bearer ${newToken}`;
          return api(original);
        }
      } catch (e) {
        // fallthrough
      }
    }
    return Promise.reject(error);
  },
);

export async function createAssignment(values: AssignmentFormValues, uploadedFile?: File | null) {
  const response = await api.post('/api/assignments', toAssignmentFormData(values, uploadedFile), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data as { success: true; assignmentId: string; jobId: string };
}

export async function regenerateAssignment(assignmentId: string) {
  const response = await api.post(`/api/assignments/${assignmentId}/regenerate`);
  return response.data as { success: true; assignmentId: string };
}

export async function getAssignment(assignmentId: string) {
  const response = await api.get(`/api/assignments/${assignmentId}`);
  return response.data as { success: true; assignment: any };
}

export async function getResult(assignmentId: string) {
  const response = await api.get(`/api/results/${assignmentId}`);
  return response.data as {
    success: true;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result: GeneratedPaper | null;
    error?: string;
  };
}

export async function getProfile() {
  const response = await api.get('/api/users/me');
  return response.data as { success: true; user: any };
}

export async function updateProfile(payload: { name?: string; role?: string }) {
  const response = await api.patch('/api/users/me', payload);
  return response.data as { success: true; user: any };
}

export function getPdfUrl(assignmentId: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return `${base}/api/pdf/${assignmentId}`;
}

export async function downloadPdfBlob(assignmentId: string) {
  const response = await api.get(`/api/pdf/${assignmentId}`, { responseType: 'blob' });
  return response.data as Blob;
}

export default api;