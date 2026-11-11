import '../global.css';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
import { useFonts } from 'expo-font';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque/800ExtraBold';
import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/src/core/flows/authStore';
import { useRoleGateStore } from '@/src/core/flows/roleGateStore';
import { stopAllAudio } from '@/src/core/services/speechService';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/src/features/notifications/application/pushNotificationService';
import { useNotificationRealtimeSync } from '@/src/features/notifications/application/useNotificationRealtimeSync';

// Tắt một số cảnh báo thuộc tính deprecated không cần thiết
LogBox.ignoreLogs([
  'Expo AV has been deprecated',
  '[expo-av]',
  'pointerEvents',
  'shadow*',
  'boxShadow',
]);

// Bắt toàn bộ lỗi runtime chưa xử lý để in trực tiếp ra Metro bundler
if (typeof global !== 'undefined' && (global as any).ErrorUtils) {
  const originalHandler = (global as any).ErrorUtils.getGlobalHandler();
  (global as any).ErrorUtils.setGlobalHandler((err: any, isFatal: boolean) => {
    console.error('🚨 [CRITICAL_UNCAUGHT_ERROR]:', err?.message || err, err?.stack || '');
    if (originalHandler) {
      originalHandler(err, isFatal);
    }
  });
}

// Chỉ bọc console.warn MỘT lần: module có thể được nạp lại (fast refresh / web SSR),
// bọc lồng nhiều lớp làm stack phình to và từng gây tràn bộ nhớ dev server web.
const warnPatchFlag = '__smartEnglishWarnPatched';
if (__DEV__ && !(globalThis as Record<string, unknown>)[warnPatchFlag]) {
  (globalThis as Record<string, unknown>)[warnPatchFlag] = true;
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const msg = args.join(' ');
    if (msg.includes('pointerEvents') || msg.includes('shadow*') || msg.includes('boxShadow') || msg.includes('expo-av')) {
      return;
    }
    originalWarn(...args);
  };
}

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(auth)',
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
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  useEffect(() => {
    if (error) {
      console.warn('[RootLayout] Lỗi nạp font:', error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Font lỗi vẫn cho vào app (dùng font hệ thống), không kẹt ở splash
  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  const { currentUser, isHydrated } = useAuthStore();
  const { getRouteForRole, guestMode } = useRoleGateStore();
  const routeKey = segments.join('/');

  useEffect(() => {
    return () => {
      void stopAllAudio();
    };
  }, [routeKey]);

  // Nhận thông báo gần realtime khi app đang mở (polling 5s, giống tin nhắn chat)
  useNotificationRealtimeSync(currentUser?.id);

  // Đăng ký Push Token lên backend khi người dùng đăng nhập & lắng nghe click thông báo
  useEffect(() => {
    if (!currentUser?.id) return;

    registerForPushNotificationsAsync();

    let subscription: Notifications.EventSubscription | null = null;
    try {
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.targetLink && typeof data.targetLink === 'string') {
          try {
            router.push(data.targetLink as any);
          } catch (e) {
            console.warn('[PushNotification] Lỗi điều hướng targetLink:', e);
          }
        }
      });
    } catch (e) {
      console.warn('[PushNotification] Bỏ qua addNotificationResponseReceivedListener:', e);
    }

    return () => {
      subscription?.remove();
    };
  }, [currentUser?.id]);

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
      } else if (!role && guestMode) {
        // Khách dùng thử: vào khu học viên, quyền giới hạn theo vai trò guest
        if (inAuthGroup || currentSegment === '' || currentSegment === 'index') {
          router.replace('/(student)/home' as any);
        }
      } else if (!role && !inAuthGroup && !(segments as string[]).includes('practice')) {
        router.replace('/(auth)/welcome' as any);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [currentUser, isHydrated, segments, guestMode]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8FAFC' } }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
        <Stack.Screen name="(teacher-companion)" options={{ headerShown: false }} />
        <Stack.Screen name="admin-blocked" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
