import { create } from 'zustand';
import { User, UserStats } from '../types/schema';
import { MOCK_USERS, MOCK_USER_STATS } from '../data/mockData';

interface AuthState {
  currentUser: User | null;
  userStats: UserStats | null;
  accessToken: string | null;
  isHydrated: boolean;
  setAuthUser: (user: User, accessToken?: string) => void;
  setUserStats: (stats: UserStats) => void;
  loginAsRole: (role: 'student' | 'teacher' | 'admin') => void;
  logout: () => void;
  setHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  userStats: null,
  accessToken: null,
  isHydrated: true,

  setAuthUser: (user: User, token?: string) => {
    set({
      currentUser: user,
      accessToken: token || null,
      // Initialize userStats with zeros; real data fetched separately via fetchUserStatsApi
      userStats: {
        user_id: String(user.id),
        xp_total: 0,
        xp_this_week: 0,
        level: 1,
        coins: 0,
        streak_current: 0,
        streak_longest: 0,
        streak_freeze_count: 0,
        league: 'bronze'
      },
      isHydrated: true
    });
  },

  setUserStats: (stats: UserStats) => {
    set({ userStats: stats });
  },

  loginAsRole: (role) => {
    const user = MOCK_USERS[role];
    const stats = MOCK_USER_STATS[user.id] || null;
    set({
      currentUser: user,
      userStats: stats,
      accessToken: `mock_jwt_token_for_${role}`,
      isHydrated: true
    });
  },

  logout: () => {
    set({
      currentUser: null,
      userStats: null,
      accessToken: null,
      isHydrated: true
    });
  },

  setHydrated: (val) => set({ isHydrated: val })
}));
