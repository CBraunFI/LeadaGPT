import axios, { AxiosResponse } from 'axios';
import type {
  AuthResponse,
  User,
  UserProfile,
  ChatSession,
  ThemenPaket,
  Routine,
  RoutineEntry,
  WeeklyReport,
  Document,
  CompanyBranding,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to extract data from axios responses
const extractData = <T>(response: AxiosResponse<T>): T => response.data;

// Auth API
export const authAPI = {
  register: (email: string, password: string) =>
    axiosInstance.post<AuthResponse>('/auth/register', { email, password }).then(extractData),

  login: (email: string, password: string) =>
    axiosInstance.post<AuthResponse>('/auth/login', { email, password }).then(extractData),

  logout: () => axiosInstance.post('/auth/logout').then(extractData),

  getMe: () => axiosInstance.get<User>('/auth/me').then(extractData),
};

// Profile API
export const profileAPI = {
  get: () => axiosInstance.get<UserProfile>('/profile').then(extractData),

  update: (data: Partial<UserProfile>) => axiosInstance.put<UserProfile>('/profile', data).then(extractData),

  completeOnboarding: () => axiosInstance.post<UserProfile>('/profile/onboarding').then(extractData),
};

// Chat API
export const chatAPI = {
  getSessions: () => axiosInstance.get<ChatSession[]>('/chat/sessions').then(extractData),

  createSession: (title?: string) =>
    axiosInstance.post<ChatSession>('/chat/sessions', { title }).then(extractData),

  getSession: (id: string) => axiosInstance.get<ChatSession>(`/chat/sessions/${id}`).then(extractData),

  sendMessage: (sessionId: string, content: string) =>
    axiosInstance.post<ChatSession>(
      `/chat/sessions/${sessionId}/messages`,
      { content }
    ).then(extractData),

  deleteSession: (id: string) => axiosInstance.delete(`/chat/sessions/${id}`).then(extractData),
};

// Themenpakete API
export const themenpaketeAPI = {
  getAll: () => axiosInstance.get<ThemenPaket[]>('/themenpakete').then(extractData),

  getById: (id: string) => axiosInstance.get<ThemenPaket>(`/themenpakete/${id}`).then(extractData),

  start: (id: string) => axiosInstance.post<{ progress: any; chatSessionId: string }>(`/themenpakete/${id}/start`).then(extractData),

  pause: (id: string) => axiosInstance.post(`/themenpakete/${id}/pause`).then(extractData),

  continue: (id: string) => axiosInstance.post(`/themenpakete/${id}/continue`).then(extractData),

  getProgress: () => axiosInstance.get('/themenpakete/progress').then(extractData),

  getNextUnit: (id: string) => axiosInstance.get(`/themenpakete/${id}/next-unit`).then(extractData),

  advance: (id: string) => axiosInstance.post(`/themenpakete/${id}/advance`).then(extractData),
};

// Routinen API
export const routinenAPI = {
  getAll: () => axiosInstance.get<Routine[]>('/routines').then(extractData),

  create: (data: {
    title: string;
    description?: string;
    frequency: 'daily' | 'weekly' | 'custom';
    target?: number;
  }) => axiosInstance.post<Routine>('/routines', data).then(extractData),

  update: (id: string, data: Partial<Routine>) =>
    axiosInstance.put<Routine>(`/routines/${id}`, data).then(extractData),

  delete: (id: string) => axiosInstance.delete(`/routines/${id}`).then(extractData),

  addEntry: (
    id: string,
    data: { date: string; completed: boolean; note?: string }
  ) => axiosInstance.post<RoutineEntry>(`/routines/${id}/entries`, data).then(extractData),

  getStats: (id: string) => axiosInstance.get(`/routines/${id}/stats`).then(extractData),
};

// Reports API
export const reportsAPI = {
  getWeekly: () => axiosInstance.get<WeeklyReport[]>('/reports/weekly').then(extractData),

  getLatest: () => axiosInstance.get<WeeklyReport>('/reports/weekly/latest').then(extractData),

  generate: () => axiosInstance.post<WeeklyReport>('/reports/weekly/generate').then(extractData),
};

// Documents API
export const documentsAPI = {
  getAll: (category?: 'personal' | 'company') => {
    const url = category ? `/documents?category=${category}` : '/documents';
    return axiosInstance.get<Document[]>(url).then(extractData);
  },

  getById: (id: string) => axiosInstance.get<Document>(`/documents/${id}`).then(extractData),

  upload: (file: File, category: 'personal' | 'company') => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('category', category);

    return axiosInstance.post<{
      message: string;
      document: {
        id: string;
        filename: string;
        fileType: string;
        fileSize: number;
        category: string;
        uploadedAt: string;
        wordCount?: number;
        pageCount?: number;
      };
    }>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(extractData);
  },

  delete: (id: string) => axiosInstance.delete(`/documents/${id}`).then(extractData),
};

// Branding API
export const brandingAPI = {
  get: () => axiosInstance.get<CompanyBranding>('/branding').then(extractData),
};

export default axiosInstance;
