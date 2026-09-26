import { create } from 'zustand';
import { User, UserStats } from '../types/schema';
import { MOCK_USERS, MOCK_USER_STATS } from '../data/mockData';
import {
  saveAuthTokens,
  getStoredAccessToken,
  getStoredUserProfile,
  clearAuthTokens,
} from '../storage/tokenStorage';

interface AuthState {
  currentUser: User | null;
  userStats: UserStats | null;
  accessToken: string | null;
  isHydrated: boolean;
  setAuthUser: (user: User, accessToken?: string, refreshToken?: string) => void;
  setUserStats: (stats: UserStats) => void;
  addReward: (xp: number, coins: number) => void;
  updateCurrentUser: (updatedFields: Partial<User>) => void;
  loginAsRole: (role: 'student' | 'teacher' | 'admin') => void;
  logout: () => void;
  setHydrated: (val: boolean) => void;
}

const initialToken = getStoredAccessToken();
const initialUser = getStoredUserProfile();

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: initialUser,
  userStats: null,
  accessToken: initialToken,
  isHydrated: true,

  updateCurrentUser: (updatedFields: Partial<User>) => {
    set((state) => {
      const updated = state.currentUser ? { ...state.currentUser, ...updatedFields } : null;
      if (updated && state.accessToken) {
        saveAuthTokens(state.accessToken, undefined, updated);
      }
      return { currentUser: updated };
    });
  },

  setAuthUser: (user: User, token?: string, refreshToken?: string) => {
    if (token) {
      saveAuthTokens(token, refreshToken, user);
    }
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
        league: 'bronze',
      },
      isHydrated: true,
    });
  },

  setUserStats: (stats: UserStats) => {
    set({ userStats: stats });
  },

  addReward: (xp: number, coins: number) => {
    set((state) => {
      if (!state.userStats) return state;
      const newXp = (state.userStats.xp_total || 0) + xp;
      const newCoins = (state.userStats.coins || 0) + coins;
      return {
        userStats: {
          ...state.userStats,
          xp_total: newXp,
          coins: newCoins,
        },
      };
    });
  },

  loginAsRole: (role) => {
    const user = MOCK_USERS[role];
    const stats = MOCK_USER_STATS[user.id] || null;
    const token = `mock_jwt_token_for_${role}`;
    saveAuthTokens(token, undefined, user);
    set({
      currentUser: user,
      userStats: stats,
      accessToken: token,
      isHydrated: true,
    });
  },

  logout: () => {
    clearAuthTokens();
    set({
      currentUser: null,
      userStats: null,
      accessToken: null,
      isHydrated: true,
    });
  },

  setHydrated: (val) => set({ isHydrated: val }),
}));
