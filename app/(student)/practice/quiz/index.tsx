import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/src/theme';

export default function QuizIndexRedirectScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace({
      pathname: '/(student)/learn',
      params: { tab: 'quiz' },
    });
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}
