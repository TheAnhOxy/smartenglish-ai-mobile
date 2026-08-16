import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export const PlacementIntroScreen = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface px-6 justify-between py-14">
      <View className="mt-8">
        <View className="w-20 h-20 bg-secondary/10 rounded-full items-center justify-center mb-6 self-center">
          <Text className="text-4xl">📝</Text>
        </View>

        <Text className="text-2xl font-bold text-neutralInk text-center mb-3">
          Bài Kiểm Tra Xếp Trình Độ (Placement Test)
        </Text>
        <Text className="text-sm text-neutralGray text-center leading-6 mb-8 px-2">
          Bài kiểm tra gồm 5 câu hỏi nhanh tổng hợp Từ vựng, Ngữ pháp và Đọc hiểu để xác định trình độ CEFR (A1–B2) của bạn.
        </Text>

        <View className="bg-cardWhite p-5 rounded-2xl border border-gray-100 gap-3">
          <View className="flex-row items-center gap-3">
            <Text className="text-lg">⏱️</Text>
            <Text className="text-xs text-neutralInk font-medium">Thời lượng: ~3 phút làm bài</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Text className="text-lg">🔒</Text>
            <Text className="text-xs text-neutralInk font-medium">Không quay lại câu trước khi làm</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Text className="text-lg">📊</Text>
            <Text className="text-xs text-neutralInk font-medium">Nhận kết quả chẩn đoán CEFR ngay lập tức</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/(auth)/placement-test' as any)}
        className="bg-primary py-4 rounded-xl items-center shadow-md active:bg-primaryDark"
      >
        <Text className="text-white font-bold text-lg">Bắt Đầu Kiểm Tra</Text>
      </Pressable>
    </View>
  );
};
