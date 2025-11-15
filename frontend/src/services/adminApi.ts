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

  getById: (companyId: string) =>
    adminAxiosInstance.get<Company>(`/companies/${companyId}`).then(extractData),

  create: (data: {
    name: string;
    description?: string;
    domain?: string;
    logoUrl?: string;
    accentColor?: string;
  }) =>
    adminAxiosInstance.post<Company>('/companies', data).then(extractData),

  update: (companyId: string, data: {
    name?: string;
    description?: string;
    domain?: string;
    logoUrl?: string;
    accentColor?: string;
  }) =>
    adminAxiosInstance.put<Company>(`/companies/${companyId}`, data).then(extractData),

  updateCorporatePrompt: (companyId: string, corporatePrompt: string | null) =>
    adminAxiosInstance
      .put(`/companies/${companyId}/corporate-prompt`, { corporatePrompt })
      .then(extractData),

  getUsers: (companyId: string) =>
    adminAxiosInstance.get<AdminUser[]>(`/companies/${companyId}/users`).then(extractData),

  getAdmins: (companyId: string) =>
    adminAxiosInstance
      .get<Array<{
        id: string;
        email: string;
        name: string;
        role: string;
        isActive: boolean;
        lastLoginAt?: string;
        createdAt: string;
      }>>(`/companies/${companyId}/admins`)
      .then(extractData),

  getDocuments: (companyId: string) =>
    adminAxiosInstance
      .get<Array<{
        id: string;
        filename: string;
        fileType: string;
        fileSize: number;
        uploadedAt: string;
        metadata?: string;
      }>>(`/companies/${companyId}/documents`)
      .then(extractData),

  uploadDocument: (companyId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return adminAxiosInstance
      .post(`/companies/${companyId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(extractData);
  },

  deleteDocument: (companyId: string, documentId: string) =>
    adminAxiosInstance.delete(`/companies/${companyId}/documents/${documentId}`).then(extractData),
};

// User Management Extensions
export const adminUserManagementAPI = {
  promoteToAdmin: (userId: string, data: { name: string; password: string }) =>
    adminAxiosInstance
      .post(`/users/${userId}/promote-to-admin`, data)
      .then(extractData),

  assignToCompany: (userId: string, companyId: string | null) =>
    adminAxiosInstance
      .put(`/users/${userId}/company`, { companyId })
      .then(extractData),
};
