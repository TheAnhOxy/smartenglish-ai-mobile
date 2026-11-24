import React from 'react';
import { Stack } from 'expo-router';
import { useThemeSwitching } from '@/src/theme/useThemeMode';

export default function TeacherCompanionLayout() {
  const switching = useThemeSwitching();
  return (
    <Stack screenOptions={{ headerShown: false, animation: switching ? 'none' : 'slide_from_right', gestureEnabled: true }}>
      <Stack.Screen name="teacher/classes/index" />
      <Stack.Screen name="teacher/classes/[classId]" />
      <Stack.Screen name="teacher/notifications" />
    </Stack>
  );
}
