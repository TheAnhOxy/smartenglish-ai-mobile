import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export const LessonDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface pt-14 px-6 justify-between pb-10">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-bold text-sm">← Lộ Trình Bài Học</Text>
        </Pressable>

        <Text className="text-2xl font-bold text-neutralInk mb-1">Thì Hiện Tại Hoàn Thành</Text>
        <Text className="text-xs text-neutralGray mb-6">Present Perfect Tense • 30 XP • 10 phút</Text>

        <View className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-4 shadow-sm gap-3">
          <Text className="text-sm font-bold text-secondary">1. Công Thức Căn Bản</Text>
          <Text className="text-xs text-neutralInk leading-5">
            Subject + have / has + Past Participle (V3 / V-ed)
          </Text>
          <View className="bg-surface p-3 rounded-xl">
            <Text className="text-xs text-neutralGray italic">Ví dụ: I have lived in Hanoi for 5 years.</Text>
          </View>
        </View>

        <View className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-6 shadow-sm gap-3">
          <Text className="text-sm font-bold text-secondary">2. Dấu Hiệu Nhận Biết</Text>
          <Text className="text-xs text-neutralInk leading-5">
            Already, yet, just, ever, never, for + khoảng thời gian, since + mốc thời gian.
          </Text>
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.back()}
        className="bg-primary py-4 rounded-xl items-center shadow-md active:bg-primaryDark"
      >
        <Text className="text-white font-bold text-lg">Hoàn Thành Bài Học (+30 XP)</Text>
      </Pressable>
    </View>
  );
};
