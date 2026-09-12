import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../application/useOnboardingStore';
import { useAuthStore } from '@/src/core/flows/authStore';

export const PlacementResultScreen = () => {
  const router = useRouter();
  const { result } = useOnboardingStore();
  const { currentUser, loginAsRole } = useAuthStore();

  const cefr = result?.cefr_level || 'B1';
  const scorePct = result?.score_pct || 80;

  const handleFinishOnboarding = () => {
    if (currentUser) {
      currentUser.onboarding_completed = true;
      router.replace('/(student)/home' as any);
    } else {
      router.replace('/(auth)/register' as any);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface px-6 pt-14 pb-10">
      {/* Header Result */}
      <View className="items-center mb-8">
        <Text className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">
          Kết Quả Chẩn Đoán Trình Độ
        </Text>
        <View className="w-24 h-24 rounded-full bg-primary justify-center items-center my-3 shadow-lg">
          <Text className="text-4xl font-extrabold text-white">{cefr}</Text>
        </View>
        <Text className="text-2xl font-bold text-neutralInk">Trình Độ Khung CEFR: {cefr}</Text>
        <Text className="text-xs text-neutralGray mt-1">Độ chính xác bài test: {scorePct}%</Text>
      </View>

      {/* Breakdown Card */}
      <View className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-6 gap-4">
        <Text className="text-sm font-bold text-neutralInk">Chi Tiết Năng Lực 4 Kỹ Năng</Text>

        <View className="gap-3">
          <View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs font-semibold text-neutralInk">Từ Vựng (Vocabulary)</Text>
              <Text className="text-xs font-bold text-secondary">{result?.skills.vocabulary || 80}%</Text>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View className="h-full bg-secondary rounded-full" style={{ width: `${result?.skills.vocabulary || 80}%` }} />
            </View>
          </View>

          <View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs font-semibold text-neutralInk">Ngữ Pháp (Grammar)</Text>
              <Text className="text-xs font-bold text-primary">{result?.skills.grammar || 70}%</Text>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View className="h-full bg-primary rounded-full" style={{ width: `${result?.skills.grammar || 70}%` }} />
            </View>
          </View>

          <View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs font-semibold text-neutralInk">Đọc Hiểu (Reading)</Text>
              <Text className="text-xs font-bold text-success">{result?.skills.reading || 85}%</Text>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View className="h-full bg-success rounded-full" style={{ width: `${result?.skills.reading || 85}%` }} />
            </View>
          </View>

          <View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs font-semibold text-neutralInk">Nghe Hiểu (Listening)</Text>
              <Text className="text-xs font-bold text-warning">{result?.skills.listening || 75}%</Text>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View className="h-full bg-warning rounded-full" style={{ width: `${result?.skills.listening || 75}%` }} />
            </View>
          </View>
        </View>
      </View>

      {/* Action CTA */}
      <Pressable
        onPress={handleFinishOnboarding}
        className="bg-primary py-4 rounded-xl items-center shadow-md active:bg-primaryDark mb-10"
      >
        <Text className="text-white font-bold text-lg">Khám Phá Lộ Trình Học Ngay</Text>
      </Pressable>
    </ScrollView>
  );
};
