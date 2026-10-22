import { useMutation } from '@tanstack/react-query';
import {
  loginApi,
  registerApi,
  verifyOtpApi,
  resendOtpApi,
  googleLoginApi,
  LoginResponse,
  RegisterPayload,
  RegisterResult,
} from '../data/authApi';
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

  const handleAuthSuccess = (data: LoginResponse) => {
    setRole(data.user.role);
    setAuthUser(data.user, data.access_token, data.refresh_token);
    if (typeof window !== 'undefined') {
      (globalThis as any).__loginMeta = {
        onboarding_completed: data.user.onboarding_completed,
      };
    }
    refreshGamificationStats(String(data.user.id));
    goWithTransition(data.user.role);
  };

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginApi(email, password),
    onSuccess: (data: LoginResponse) => {
      handleAuthSuccess(data);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => registerApi(payload),
    onSuccess: (data: RegisterResult) => {
      // Sau khi đăng ký thành công, chuyển sang màn hình Xác thực OTP
      router.push(`/(auth)/verify-otp?email=${encodeURIComponent(data.email)}` as any);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ email, otpCode }: { email: string; otpCode: string }) =>
      verifyOtpApi(email, otpCode),
    onSuccess: (data: LoginResponse) => {
      handleAuthSuccess(data);
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: (email: string) => resendOtpApi(email),
  });

  const googleLoginMutation = useMutation({
    mutationFn: (idToken: string) => googleLoginApi(idToken),
    onSuccess: (data: LoginResponse) => {
      handleAuthSuccess(data);
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
    verifyOtp: verifyOtpMutation.mutate,
    resendOtp: resendOtpMutation.mutate,
    googleLogin: googleLoginMutation.mutate,
    isPending:
      loginMutation.isPending ||
      registerMutation.isPending ||
      verifyOtpMutation.isPending ||
      googleLoginMutation.isPending,
    isResendingOtp: resendOtpMutation.isPending,
    isError:
      loginMutation.isError ||
      registerMutation.isError ||
      verifyOtpMutation.isError ||
      googleLoginMutation.isError,
    error:
      loginMutation.error ||
      registerMutation.error ||
      verifyOtpMutation.error ||
      googleLoginMutation.error,
    selectDemoRole,
  };
};
