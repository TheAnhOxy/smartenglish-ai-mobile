import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="choose-goal" />
      <Stack.Screen name="placement-intro" />
      <Stack.Screen name="placement-test" />
      <Stack.Screen name="placement-result" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
