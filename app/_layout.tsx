import '../global.css';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/src/core/flows/authStore';
import { useRoleGateStore } from '@/src/core/flows/roleGateStore';

// Tắt cảnh báo thuộc tính deprecated của react-native-web khi chạy môi trường Web
LogBox.ignoreAllLogs(true);

if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const msg = args.join(' ');
    if (msg.includes('pointerEvents') || msg.includes('shadow*') || msg.includes('boxShadow')) {
      return;
    }
    originalWarn(...args);
  };
}

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5 // 5 mins
    }
  }
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  const { currentUser, isHydrated } = useAuthStore();
  const { getRouteForRole } = useRoleGateStore();

  useEffect(() => {
    if (!isHydrated) return;

    const role = currentUser?.role || null;
    const targetRoute = getRouteForRole(role, currentUser?.onboarding_completed ?? true);
    const currentSegment = (segments[0] as string) || '';
    const inAuthGroup = currentSegment === '(auth)';
    const inTeacherGroup = currentSegment === '(teacher-companion)';
    const inAdminRoute = currentSegment === 'admin-blocked';

    const timer = setTimeout(() => {
      if (role === 'admin' && !inAdminRoute) {
        router.replace('/admin-blocked' as any);
      } else if (role === 'teacher' && !inTeacherGroup) {
        router.replace('/(teacher-companion)/classes' as any);
      } else if (role === 'student' && (inAuthGroup || inTeacherGroup || inAdminRoute || currentSegment === '' || currentSegment === 'index')) {
        router.replace('/(student)/home' as any);
      } else if (!role && !inAuthGroup) {
        router.replace('/(auth)/welcome' as any);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [currentUser, isHydrated, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
