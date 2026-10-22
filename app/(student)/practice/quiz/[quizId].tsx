import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/src/theme';

export default function QuizRedirectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ quizId?: string }>();

  useEffect(() => {
    const rawId = params.quizId ? String(params.quizId).replace(/\D/g, '') : '';
    if (rawId && Number(rawId) > 0) {
      router.replace({
        pathname: '/(student)/practice/exam/[examId]',
        params: { examId: rawId, mode: 'PRACTICE' },
      });
    } else {
      router.replace({
        pathname: '/(student)/learn',
        params: { tab: 'quiz' },
      });
    }
  }, [params.quizId, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}
