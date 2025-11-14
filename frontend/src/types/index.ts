// User & Auth types
export interface User {
  id: string;
  email: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  age?: number;
  gender?: string;
  role?: string;
  industry?: string;
  teamSize?: number;
  leadershipYears?: number;
  goals?: string[];
  onboardingComplete: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Chat types
export interface ChatSession {
  id: string;
  userId: string;
  title?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  createdAt: string;
}

// Themenpakete types
export interface ThemenPaket {
  id: string;
  title: string;
  description: string;
  duration: number;
  unitsPerDay: number;
  category?: string;
  status: 'not_started' | 'active' | 'paused' | 'completed';
  progress?: UserThemenPaketProgress;
}

export interface LearningUnit {
  id: string;
  themenPaketId: string;
  day: number;
  unitNumber: number;
  title: string;
  content: string;
  reflectionTask: string;
  order: number;
}

export interface UserThemenPaketProgress {
  id: string;
  userId: string;
  themenPaketId: string;
  status: 'active' | 'paused' | 'completed';
  currentDay: number;
  currentUnit: number;
  startedAt: string;
  lastAccessedAt: string;
  completedAt?: string;
}

// Routinen types
export interface Routine {
  id: string;
  userId: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  target?: number;
  status: 'active' | 'paused' | 'completed';
  entries: RoutineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RoutineEntry {
  id: string;
  routineId: string;
  date: string;
  completed: boolean;
  note?: string;
  createdAt: string;
}

// Reports types
export interface WeeklyReport {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  topics: string[];
  progress: {
    themenpakete: Array<{
      title: string;
      currentDay: number;
      totalDays: number;
      progress: number;
    }>;
    routines: Array<{
      title: string;
      completedDays: number;
      targetDays: number;
      progress: number;
    }>;
  };
  recommendations: string[];
  createdAt: string;
}

// Document types
export interface Document {
  id: string;
  userId: string;
  companyId?: string;
  filename: string;
  fileType: string;
  fileSize: number;
  category: 'personal' | 'company';
  metadata?: {
    originalMimetype?: string;
    wordCount?: number;
    pageCount?: number;
    uploadedFrom?: string;
  };
  uploadedAt: string;
  updatedAt: string;
}

// Admin types
export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'superadmin';
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminAuthResponse {
  token: string;
  admin: Admin;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  topTopics: Array<{ text: string; value: number }>;
  companies: Array<{
    id: string;
    name: string;
    domain?: string;
    userCount: number;
    documentCount: number;
    createdAt: string;
  }>;
}

export interface AdminUser {
  id: string;
  email: string;
  authProvider: string;
  createdAt: string;
  lastUsed?: string;
  profile?: UserProfile;
  company?: {
    id: string;
    name: string;
  };
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
