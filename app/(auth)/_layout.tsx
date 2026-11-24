import { Stack } from 'expo-router';
import { useThemeSwitching } from '@/src/theme/useThemeMode';

export const unstable_settings = {
  anchor: 'welcome',
};

export default function AuthLayout() {
  // Vừa đổi Sáng/Tối: không chạy hiệu ứng trượt khi quay lại đúng màn đang mở
  const switching = useThemeSwitching();
  return (
    <Stack screenOptions={{ headerShown: false, animation: switching ? 'none' : 'slide_from_right', gestureEnabled: true }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="choose-goal" />
      <Stack.Screen name="placement-intro" />
      <Stack.Screen name="placement-test" />
      <Stack.Screen name="placement-result" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="login-success" />
    </Stack>
  );
}
