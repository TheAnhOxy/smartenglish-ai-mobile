import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../application/useOnboardingStore';

const GOAL_OPTIONS = [
  { id: 'g1', title: 'Luyện Thi TOEIC 750+', icon: '🎯', desc: 'Tập trung từ vựng doanh nghiệp & Listening/Reading' },
  { id: 'g2', title: 'Luyện Thi IELTS 6.5+', icon: '📜', desc: 'Nâng cao Writing Task 2 & Academic Speaking' },
  { id: 'g3', title: 'Giao Tiếp Công Sở & Hằng Ngày', icon: '🗣️', desc: 'Thực hành phát âm IPA & Roleplay linh hoạt' },
  { id: 'g4', title: 'Mất Gốc Tiếng Anh', icon: '🌱', desc: 'Xây dựng lại từ vựng & ngữ pháp cơ bản từ đầu' }
];

export const ChooseGoalScreen = () => {
  const router = useRouter();
  const { targetGoal, setTargetGoal } = useOnboardingStore();

  const handleSelectGoal = (title: string) => {
    setTargetGoal(title);
  };

  const handleNext = () => {
    router.push('/(auth)/placement-intro' as any);
  };

  return (
    <View className="flex-1 bg-surface px-6 pt-14 pb-10 justify-between">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-neutralInk mb-2">Mục Tiêu Học Của Bạn Là Gì?</Text>
        <Text className="text-sm text-neutralGray mb-6">
          SmartEnglish AI sẽ tối ưu lộ trình và bài tập hàng ngày dựa trên lựa chọn của bạn.
        </Text>

        <View className="gap-3">
          {GOAL_OPTIONS.map((item) => {
            const isSelected = targetGoal === item.title;
            return (
              <Pressable
                key={item.id}
                onPress={() => handleSelectGoal(item.title)}
                className={`p-4 rounded-2xl border flex-row items-center gap-4 active:opacity-90 ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'bg-cardWhite border-gray-100'
                }`}
              >
                <Text className="text-3xl">{item.icon}</Text>
                <View className="flex-1">
                  <Text className={`font-bold text-base ${isSelected ? 'text-primary' : 'text-neutralInk'}`}>
                    {item.title}
                  </Text>
                  <Text className="text-xs text-neutralGray mt-0.5">{item.desc}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Pressable
        onPress={handleNext}
        className="bg-primary py-4 rounded-xl items-center shadow-md active:bg-primaryDark mt-4"
      >
        <Text className="text-white font-bold text-lg">Tiếp Tục</Text>
      </Pressable>
    </View>
  );
};
