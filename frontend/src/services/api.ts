import axios from 'axios';
import type {
  AuthResponse,
  User,
  UserProfile,
  ChatSession,
  Message,
  ThemenPaket,
  Routine,
  RoutineEntry,
  WeeklyReport,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatically extract data from responses
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get<User>('/auth/me'),
};

// Profile API
export const profileAPI = {
  get: () => api.get<UserProfile>('/profile'),

  update: (data: Partial<UserProfile>) => api.put<UserProfile>('/profile', data),

  completeOnboarding: () => api.post<UserProfile>('/profile/onboarding'),
};

// Chat API
export const chatAPI = {
  getSessions: () => api.get<ChatSession[]>('/chat/sessions'),

  createSession: (title?: string) =>
    api.post<ChatSession>('/chat/sessions', { title }),

  getSession: (id: string) => api.get<ChatSession>(`/chat/sessions/${id}`),

  sendMessage: (sessionId: string, content: string) =>
    api.post<ChatSession>(
      `/chat/sessions/${sessionId}/messages`,
      { content }
    ),

  deleteSession: (id: string) => api.delete(`/chat/sessions/${id}`),
};

// Themenpakete API
export const themenpaketeAPI = {
  getAll: () => api.get<ThemenPaket[]>('/themenpakete'),

  getById: (id: string) => api.get<ThemenPaket>(`/themenpakete/${id}`),

  start: (id: string) => api.post<{ progress: any; chatSessionId: string }>(`/themenpakete/${id}/start`),

  pause: (id: string) => api.post(`/themenpakete/${id}/pause`),

  continue: (id: string) => api.post(`/themenpakete/${id}/continue`),

  getProgress: () => api.get('/themenpakete/progress'),
};

// Routinen API
export const routinenAPI = {
  getAll: () => api.get<Routine[]>('/routines'),

  create: (data: {
    title: string;
    description?: string;
    frequency: 'daily' | 'weekly' | 'custom';
    target?: number;
  }) => api.post<Routine>('/routines', data),

  update: (id: string, data: Partial<Routine>) =>
    api.put<Routine>(`/routines/${id}`, data),

  delete: (id: string) => api.delete(`/routines/${id}`),

  addEntry: (
    id: string,
    data: { date: string; completed: boolean; note?: string }
  ) => api.post<RoutineEntry>(`/routines/${id}/entries`, data),

  getStats: (id: string) => api.get(`/routines/${id}/stats`),
};

// Reports API
export const reportsAPI = {
  getWeekly: () => api.get<WeeklyReport[]>('/reports/weekly'),

  getLatest: () => api.get<WeeklyReport>('/reports/weekly/latest'),

  generate: () => api.post<WeeklyReport>('/reports/weekly/generate'),
};

export default api;
