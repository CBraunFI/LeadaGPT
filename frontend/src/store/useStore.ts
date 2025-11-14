import { create } from 'zustand';
import type {
  User,
  UserProfile,
  ChatSession,
  ThemenPaket,
  Routine,
} from '../types';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;

  // Profile
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Chat
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  setCurrentSession: (session: ChatSession | null) => void;
  setSessions: (sessions: ChatSession[]) => void;
  setIsLoading: (loading: boolean) => void;

  // Themenpakete
  themenpakete: ThemenPaket[];
  setThemenpakete: (themenpakete: ThemenPaket[]) => void;

  // Routinen
  routines: Routine[];
  setRoutines: (routines: Routine[]) => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token, isAuthenticated: !!token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      profile: null,
      currentSession: null,
      sessions: [],
      themenpakete: [],
      routines: [],
    });
  },

  // Profile
  profile: null,
  setProfile: (profile) => set({ profile }),

  // Theme
  theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },

  // Chat
  currentSession: null,
  sessions: [],
  isLoading: false,
  setCurrentSession: (session) => set({ currentSession: session }),
  setSessions: (sessions) => set({ sessions }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Themenpakete
  themenpakete: [],
  setThemenpakete: (themenpakete) => set({ themenpakete }),

  // Routinen
  routines: [],
  setRoutines: (routines) => set({ routines }),
}));
