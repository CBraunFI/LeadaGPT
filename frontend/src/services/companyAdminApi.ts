import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Get admin token from localStorage
const getAdminToken = (): string | null => {
  return localStorage.getItem('adminToken');
};

// Create axios instance with admin auth
const adminAxios = axios.create({
  baseURL: `${API_URL}/company-admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
adminAxios.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface CompanyInfo {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  accentColor?: string;
  corporatePrompt?: string;
  createdAt: string;
  _count: {
    users: number;
    documents: number;
  };
}

export interface CompanyAnalytics {
  period: string;
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
  };
  themenpaketMetrics: {
    totalProgress: number;
    activeProgress: number;
    completedProgress: number;
    popularThemenpakete: Array<{
      title: string;
      userCount: number;
      avgCompletion: number;
    }>;
  };
  chatMetrics: {
    totalSessions: number;
    totalMessages: number;
    avgMessagesPerSession: number;
    topTopics: string[];
  };
  routineMetrics: {
    totalRoutines: number;
    activeRoutines: number;
    popularRoutines: Array<{
      title: string;
      userCount: number;
      avgCompletionRate: number;
    }>;
  };
}

export interface CompanyUser {
  id: string;
  email: string;
  firstName?: string;
  createdAt: string;
  lastActive?: string;
  themenpaketCount: number;
  completedThemenpaketCount: number;
  chatSessionCount: number;
}

export interface CompanyDocument {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  metadata?: string;
}

// API Functions
export const companyAdminAPI = {
  // Get company information
  async getInfo(): Promise<CompanyInfo> {
    const response = await adminAxios.get('/info');
    return response.data;
  },

  // Update corporate prompt
  async updateCorporatePrompt(corporatePrompt: string | null): Promise<void> {
    await adminAxios.put('/corporate-prompt', { corporatePrompt });
  },

  // Get company analytics
  async getAnalytics(period: 'week' | 'month' | '3months' | '6months' | 'all'): Promise<CompanyAnalytics> {
    const response = await adminAxios.get('/analytics', { params: { period } });
    return response.data;
  },

  // Get company analytics summary
  async getAnalyticsSummary(period: 'week' | 'month' | '3months' | '6months' | 'all'): Promise<string> {
    const response = await adminAxios.get('/analytics/summary', { params: { period } });
    return response.data.summary;
  },

  // Get company users
  async getUsers(): Promise<CompanyUser[]> {
    const response = await adminAxios.get('/users');
    return response.data;
  },

  // Get company documents
  async getDocuments(): Promise<CompanyDocument[]> {
    const response = await adminAxios.get('/documents');
    return response.data;
  },

  // Upload company document
  async uploadDocument(file: File): Promise<CompanyDocument> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await adminAxios.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete company document
  async deleteDocument(documentId: string): Promise<void> {
    await adminAxios.delete(`/documents/${documentId}`);
  },
};
