import axios, { AxiosResponse } from 'axios';
import type {
  AdminAuthResponse,
  Admin,
  DashboardStats,
  AdminUserListResponse,
  AdminUser,
  Company,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const adminAxiosInstance = axios.create({
  baseURL: `${API_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add admin auth token to requests
adminAxiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to extract data from axios responses
const extractData = <T>(response: AxiosResponse<T>): T => response.data;

// Admin Auth API
export const adminAuthAPI = {
  login: (email: string, password: string) =>
    adminAxiosInstance.post<AdminAuthResponse>('/login', { email, password }).then(extractData),

  getMe: () =>
    adminAxiosInstance.get<Admin>('/me').then(extractData),
};

// Admin Dashboard API
export const adminDashboardAPI = {
  getStats: () =>
    adminAxiosInstance.get<DashboardStats>('/dashboard').then(extractData),
};

// Admin Users API
export const adminUsersAPI = {
  getList: (params?: { limit?: number; offset?: number; companyId?: string }) =>
    adminAxiosInstance
      .get<AdminUserListResponse>('/users', { params })
      .then(extractData),

  getById: (userId: string) =>
    adminAxiosInstance.get<AdminUser>(`/users/${userId}`).then(extractData),

  update: (userId: string, data: { email?: string; companyId?: string | null }) =>
    adminAxiosInstance.patch<AdminUser>(`/users/${userId}`, data).then(extractData),

  delete: (userId: string) =>
    adminAxiosInstance.delete(`/users/${userId}`).then(extractData),

  resetPassword: (userId: string) =>
    adminAxiosInstance
      .post<{ message: string; tempPassword: string; email: string }>(`/users/${userId}/reset-password`)
      .then(extractData),
};

// Admin Companies API
export const adminCompaniesAPI = {
  getList: () =>
    adminAxiosInstance.get<Company[]>('/companies').then(extractData),
};
