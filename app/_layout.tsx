// Đổi ngôn ngữ: bình thường đã nạp từ index.js; nạp lại ở đây (không chạy hai lần) phòng khi entry chưa chạy
import '@/src/i18n/bootstrap';
// Theme phải nạp ĐẦU TIÊN: đổi token + bọc StyleSheet.create trước khi màn hình nào được tạo
import '@/src/theme/themeMode';
import '../global.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LogBox, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
import { useFonts } from 'expo-font';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque/800ExtraBold';
import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname, useRouter, useSegments } from 'expo-router';
import { useThemeMode, useThemeSwitching } from '@/src/theme/useThemeMode';
import { useLanguage } from '@/src/i18n/useLanguage';
import { colors } from '@/src/theme/colors';
import { BackgroundMusic } from '@/src/core/components/BackgroundMusic';
import { Snowfall } from '@/src/components/xmas/Snowfall';
import { ThemeFade } from '@/src/core/components/ThemeFade';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/src/core/api/queryClient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useAuthStore } from '@/src/core/flows/authStore';
import { useRoleGateStore } from '@/src/core/flows/roleGateStore';
import { stopAllAudio } from '@/src/core/services/speechService';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/src/features/notifications/application/pushNotificationService';
import { useNotificationRealtimeSync } from '@/src/features/notifications/application/useNotificationRealtimeSync';
import { useEntitlementSync } from '@/src/core/flows/useEntitlementSync';

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
  const router = useRouter();
  const { dark, version: themeOnlyVersion } = useThemeMode();
  // Đổi theme HOẶC ngôn ngữ đều vẽ lại toàn bộ cây giao diện
  const { version: langVersion } = useLanguage();
  const themeVersion = `${themeOnlyVersion}.${langVersion}`;
  const themeSwitching = useThemeSwitching();
  const pathname = usePathname();

  // Đổi theme → vẽ lại toàn bộ cây giao diện (key mới) rồi quay về đúng màn đang mở
  // Màu nền trước khi đổi theme → phủ lên rồi mờ dần
  const bgBeforeTheme = useRef(colors.bg);
  const [fadeFrom, setFadeFrom] = useState<string | null>(null);
  const clearFade = useCallback(() => setFadeFrom(null), []);
  const pathBeforeTheme = useRef(pathname);
  const renderedThemeVersion = useRef(themeVersion);
  if (renderedThemeVersion.current === themeVersion) pathBeforeTheme.current = pathname;
  useEffect(() => {
    if (renderedThemeVersion.current === themeVersion) return;
    renderedThemeVersion.current = themeVersion;
    setFadeFrom(bgBeforeTheme.current);
    bgBeforeTheme.current = colors.bg;
    const target = pathBeforeTheme.current;
    const timer = setTimeout(() => router.replace(target as never), 0);
    return () => clearTimeout(timer);
  }, [themeVersion, router]);
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
  useEntitlementSync(currentUser?.id);

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
    // Màn chào sau đăng nhập tự chuyển tới trang theo vai trò; điều hướng thêm ở đây sẽ chạy đè
    // (gây cảnh báo ROUTE_NAMES_CHANGED và bỏ qua màn chào).
    const onLoginSuccess = inAuthGroup && (segments as string[])[1] === 'login-success';
    if (onLoginSuccess && role) return;

    const timer = setTimeout(() => {
      if (role === 'admin' && !inAdminRoute) {
        router.replace('/admin-blocked' as any);
      } else if ((role === 'student' || role === 'teacher') && (inAuthGroup || inTeacherGroup || inAdminRoute || currentSegment === '' || currentSegment === 'index')) {
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
    <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <BackgroundMusic />
      <View key={themeVersion} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack screenOptions={{ headerShown: false, animation: themeSwitching ? 'none' : 'fade', contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
        <Stack.Screen name="(teacher-companion)" options={{ headerShown: false }} />
        <Stack.Screen name="admin-blocked" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      {/* Tuyết rơi mùa Giáng sinh (không chặn chạm, tắt ở màn học) */}
      <Snowfall />
      </View>
      {fadeFrom ? <ThemeFade color={fadeFrom} onDone={clearFade} /> : null}
    </ThemeProvider>
  );
}
