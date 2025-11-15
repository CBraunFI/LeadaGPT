// User & Auth types
export interface User {
  id: string;
  email: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName?: string;
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

// Branding types
export interface CompanyBranding {
  hasCompanyBranding: boolean;
  logoUrl: string | null;
  accentColor: string;
  companyName?: string;
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
