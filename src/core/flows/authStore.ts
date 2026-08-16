import { create } from 'zustand';
import { User, UserStats } from '../types/schema';
import { MOCK_USERS, MOCK_USER_STATS } from '../data/mockData';

interface AuthState {
  currentUser: User | null;
  userStats: UserStats | null;
  accessToken: string | null;
  isHydrated: boolean;
  loginAsRole: (role: 'student' | 'teacher' | 'admin') => void;
  logout: () => void;
  setHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Mặc định chưa đăng nhập (currentUser: null) để app mở ra ở màn hình Welcome / Đăng Ký / Đăng Nhập
  currentUser: null,
  userStats: null,
  accessToken: null,
  isHydrated: true,

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
