import { useMutation } from '@tanstack/react-query';
import { loginApi, registerApi, LoginResponse, RegisterPayload } from '../data/authApi';
import { useAuthStore } from '@/src/core/flows/authStore';
import { useRoleGateStore } from '@/src/core/flows/roleGateStore';
import { useRouter } from 'expo-router';
import { fetchUserStatsApi } from '@/src/features/home-dashboard/data/dashboardApi';

export const useAuthFlow = () => {
  const { setAuthUser, loginAsRole, setUserStats } = useAuthStore();
  const { setRole } = useRoleGateStore();
  const router = useRouter();

  const goWithTransition = (role: string) => {
    if (role === 'admin') {
      router.replace('/admin-blocked' as any);
      return;
    }
    router.replace(`/(auth)/login-success?role=${role}` as any);
  };

  /** After successful auth, fetch real gamification stats from backend */
  const refreshGamificationStats = async (userId: string) => {
    try {
      const stats = await fetchUserStatsApi(userId);
      setUserStats(stats);
    } catch (err) {
      // Non-fatal: UI will show 0 values until next fetch
      console.warn('[AuthFlow] Could not refresh gamification stats:', err);
    }
  };

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginApi(email, password),
    onSuccess: (data: LoginResponse) => {
      setRole(data.user.role);
      setAuthUser(data.user, data.access_token, data.refresh_token);
      if (typeof window !== 'undefined') {
        (globalThis as any).__loginMeta = {
          onboarding_completed: data.user.onboarding_completed,
        };
      }
      // Fetch real gamification stats in background
      refreshGamificationStats(String(data.user.id));
      goWithTransition(data.user.role);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => registerApi(payload),
    onSuccess: (data: LoginResponse) => {
      setRole(data.user.role);
      setAuthUser(data.user, data.access_token, data.refresh_token);
      if (typeof window !== 'undefined') {
        (globalThis as any).__loginMeta = {
          onboarding_completed: data.user.onboarding_completed,
        };
      }
      // New users start with 0 stats — nothing to fetch yet
      goWithTransition(data.user.role);
    },
  });

  const selectDemoRole = (role: 'student' | 'teacher' | 'admin') => {
    setRole(role);
    loginAsRole(role);
    if (typeof window !== 'undefined') {
      (globalThis as any).__loginMeta = { onboarding_completed: true };
    }
    goWithTransition(role);
  };

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    isPending: loginMutation.isPending || registerMutation.isPending,
    isError: loginMutation.isError || registerMutation.isError,
    error: loginMutation.error || registerMutation.error,
    selectDemoRole,
  };
};
