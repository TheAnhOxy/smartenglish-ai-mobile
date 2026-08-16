import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export const WritingCompareScreen = () => {
  const router = useRouter();
  const { original, rewritten } = useLocalSearchParams<{ original: string; rewritten: string }>();

  return (
    <View className="flex-1 bg-surface pt-14 px-6 justify-between pb-6">
      <View className="flex-1">
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-bold text-sm">← Phân Tích Chi Tiết</Text>
        </Pressable>

        <Text className="text-2xl font-bold text-neutralInk mb-1">So Sánh Bản Viết AI</Text>
        <Text className="text-xs text-neutralGray mb-6">Đối chiếu bài viết gốc và phiên bản AI tối ưu từ vựng</Text>

        {/* Dual-Column Split Comparison */}
        <View className="flex-1 flex-row gap-3">
          {/* Column 1: Original */}
          <View className="flex-1 bg-cardWhite p-4 rounded-2xl border border-gray-200">
            <Text className="text-xs font-bold text-error uppercase mb-2">Bài Gốc Của Bạn</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xs text-neutralInk leading-5">{original}</Text>
            </ScrollView>
          </View>

          {/* Column 2: Rewritten AI */}
          <View className="flex-1 bg-secondary/5 p-4 rounded-2xl border border-secondary/20">
            <Text className="text-xs font-bold text-secondary uppercase mb-2">Bản AI Tối Ưu</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xs text-neutralInk leading-5 font-medium">{rewritten}</Text>
            </ScrollView>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/(student)/practice' as any)}
        className="bg-primary py-3.5 rounded-xl items-center shadow-md active:bg-primaryDark mt-4"
      >
        <Text className="text-white font-bold text-base">Hoàn Thành & Trở Về</Text>
      </Pressable>
    </View>
  );
};
