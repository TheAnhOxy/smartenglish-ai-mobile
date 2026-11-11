import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClipboardCheck } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { useAuthStore } from '@/src/core/flows/authStore';
import { AuthButton } from '@/src/features/auth/presentation/components/AuthUI';
import { useOnboardingStore } from '../../application/useOnboardingStore';

const SKILLS = [
  { key: 'vocabulary', label: 'Từ vựng' },
  { key: 'grammar', label: 'Ngữ pháp' },
  { key: 'reading', label: 'Đọc hiểu' },
  { key: 'listening', label: 'Nghe hiểu' },
] as const;

export const PlacementResultScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { result } = useOnboardingStore();
  const { currentUser, updateCurrentUser } = useAuthStore();

  const finish = () => {
    if (currentUser) {
      updateCurrentUser({ onboarding_completed: true });
      router.replace('/(student)/home');
    } else {
      router.replace('/(auth)/register');
    }
  };

  // Không có kết quả thật (mở thẳng màn này / test lỗi) → không hiển thị số liệu giả
  if (!result) {
    return (
      <View className="flex-1 bg-surface dark:bg-darkBg items-center justify-center px-8" style={{ paddingTop: insets.top }}>
        <ClipboardCheck size={28} color={AppColors.neutralGray} />
        <Text className="text-sm text-neutralGray text-center my-4">Chưa có kết quả bài kiểm tra</Text>
        <View className="w-full">
          <AuthButton label="Làm bài kiểm tra" onPress={() => router.replace('/(auth)/placement-intro')} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-darkBg"
      contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center mb-6">
        <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-3">
          <Text className="text-3xl font-bold text-primary">{result.cefr_level}</Text>
        </View>
        <Text className="text-xl font-bold text-neutralInk dark:text-white">Trình độ {result.cefr_level}</Text>
        <Text className="text-sm text-neutralGray mt-1">Đúng {result.score_pct}%</Text>
      </View>

      {result.skills ? (
        <View className="bg-white dark:bg-darkCard rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
          {SKILLS.map(({ key, label }) => {
            const pct = result.skills[key];
            if (pct == null) return null;
            return (
              <View key={key} className="mb-3 last:mb-0">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-neutralInk dark:text-white">{label}</Text>
                  <Text className="text-sm font-bold text-primary">{pct}%</Text>
                </View>
                <View className="h-2 rounded-full bg-surface dark:bg-darkBg overflow-hidden">
                  <View className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {result.recommendedGoal || result.feedbackVi ? (
        <View className="bg-white dark:bg-darkCard rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
          {result.recommendedGoal ? (
            <Text className="text-sm font-bold text-neutralInk dark:text-white mb-1">Lộ trình gợi ý: {result.recommendedGoal}</Text>
          ) : null}
          {result.feedbackVi ? <Text className="text-sm text-neutralGray leading-5">{result.feedbackVi}</Text> : null}
        </View>
      ) : null}

      <AuthButton label={currentUser ? 'Bắt đầu học' : 'Tạo tài khoản để lưu kết quả'} onPress={finish} />
    </ScrollView>
  );
};
