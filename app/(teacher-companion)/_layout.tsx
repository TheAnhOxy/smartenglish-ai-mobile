import React from 'react';
import { Stack } from 'expo-router';

export default function TeacherCompanionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="classes/index" />
      <Stack.Screen name="classes/[classId]" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
