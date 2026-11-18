import React from 'react';
import { Stack } from 'expo-router';

export default function TeacherCompanionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="teacher/classes/index" />
      <Stack.Screen name="teacher/classes/[classId]" />
      <Stack.Screen name="teacher/notifications" />
    </Stack>
  );
}
