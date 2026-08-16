import { useMutation } from '@tanstack/react-query';
import { loginApi, LoginResponse } from '../data/authApi';
import { useAuthStore } from '@/src/core/flows/authStore';
import { useRoleGateStore } from '@/src/core/flows/roleGateStore';
import { useRouter } from 'expo-router';

export const useAuthFlow = () => {
  const { loginAsRole } = useAuthStore();
  const { setRole } = useRoleGateStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => loginApi(email, password),
    onSuccess: (data: LoginResponse) => {
      setRole(data.user.role);
      loginAsRole(data.user.role);
      
      if (data.user.role === 'admin') {
        router.replace('/admin-blocked' as any);
      } else if (data.user.role === 'teacher') {
        router.replace('/(teacher-companion)/classes' as any);
      } else {
        if (!data.user.onboarding_completed) {
          router.replace('/(auth)/welcome' as any);
        } else {
          router.replace('/(student)/home' as any);
        }
      }
    }
  });

  const selectDemoRole = (role: 'student' | 'teacher' | 'admin') => {
    setRole(role);
    loginAsRole(role);
    if (role === 'admin') {
      router.replace('/admin-blocked' as any);
    } else if (role === 'teacher') {
      router.replace('/(teacher-companion)/classes' as any);
    } else {
      router.replace('/(student)/home' as any);
    }
  };

  return {
    login: loginMutation.mutate,
    isPending: loginMutation.isPending,
    isError: loginMutation.isError,
    error: loginMutation.error,
    selectDemoRole
  };
};
