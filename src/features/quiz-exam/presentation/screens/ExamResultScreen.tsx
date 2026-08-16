import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export const ExamResultScreen = () => {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-surface pt-14 px-6 pb-10" showsVerticalScrollIndicator={false}>
      <Text className="text-2xl font-bold text-neutralInk mb-1">Kết Quả Đề Thi Thử 🏆</Text>
      <Text className="text-xs text-neutralGray mb-6">Dự đoán điểm TOEIC dựa trên thuật toán AI</Text>

      {/* TOEIC Score Badge */}
      <View className="bg-cardWhite p-6 rounded-3xl border border-gray-100 items-center shadow-sm mb-6">
        <Text className="text-xs text-neutralGray uppercase font-bold mb-1">Dự Đoán Điểm TOEIC</Text>
        <Text className="text-5xl font-extrabold text-primary mb-2">780 / 990</Text>
        <Text className="text-xs text-success font-semibold">↑ Cao hơn 45 điểm so với bài thi trước</Text>
      </View>

      {/* Skill Breakdown */}
      <View className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-8 shadow-sm gap-3">
        <Text className="text-sm font-bold text-neutralInk">Chi Tiết Theo Kỹ Năng</Text>

        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-neutralInk font-medium">Reading Part 5 (Incomplete Sentences):</Text>
          <Text className="text-xs font-bold text-success">9/10 câu</Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-neutralInk font-medium">Reading Part 6 (Text Completion):</Text>
          <Text className="text-xs font-bold text-secondary">7/10 câu</Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/(student)/practice' as any)}
        className="bg-primary py-4 rounded-xl items-center shadow-md active:bg-primaryDark"
      >
        <Text className="text-white font-bold text-base">Hoàn Thành & Trở Về Trung Tâm AI</Text>
      </Pressable>
    </ScrollView>
  );
};
