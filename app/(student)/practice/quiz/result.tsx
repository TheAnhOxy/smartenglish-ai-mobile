import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/src/theme';

export default function QuizResultRedirectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ attemptId?: string }>();

  useEffect(() => {
    if (params.attemptId && Number(params.attemptId) > 0) {
      router.replace({
        pathname: '/(student)/practice/exam/result',
        params: { attemptId: String(params.attemptId) },
      });
    } else {
      router.replace({
        pathname: '/(student)/learn',
        params: { tab: 'quiz' },
      });
    }
  }, [params.attemptId, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}
