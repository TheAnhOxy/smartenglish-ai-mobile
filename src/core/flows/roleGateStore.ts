import { create } from 'zustand';
import { UserRole } from '../types/schema';

interface RoleGateState {
  currentRole: UserRole | null;
  setRole: (role: UserRole | null) => void;
  getRouteForRole: (role: UserRole | null, onboardingCompleted?: boolean) => string;
}

export const useRoleGateStore = create<RoleGateState>((set) => ({
  currentRole: 'student',

  setRole: (role) => set({ currentRole: role }),

  getRouteForRole: (role, onboardingCompleted = true) => {
    if (!role) {
      return '/(auth)/login';
    }
    if (role === 'admin') {
      return '/admin-blocked';
    }
    if (role === 'teacher') {
      return '/(teacher-companion)/classes';
    }
    if (role === 'student') {
      if (!onboardingCompleted) {
        return '/(auth)/welcome';
      }
      return '/(student)/home';
    }
    return '/(auth)/login';
  }
}));
