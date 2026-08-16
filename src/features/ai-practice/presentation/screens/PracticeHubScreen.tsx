import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export const PracticeHubScreen = () => {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-surface pt-14 px-6 pb-10" showsVerticalScrollIndicator={false}>
      <Text className="text-2xl font-bold text-neutralInk mb-1">Trung Tâm Luyện Tập 🎯</Text>
      <Text className="text-xs text-neutralGray mb-6">4 Công cụ luyện tập chuyên sâu dành riêng cho học viên SmartEnglish</Text>

      {/* Grid of 4 Feature Modules */}
      <View className="gap-4">
        {/* Module C: Scan */}
        <Pressable
          onPress={() => router.push('/(student)/practice/scan' as any)}
          className="bg-cardWhite p-5 rounded-2xl border border-gray-100 flex-row items-center gap-4 shadow-sm active:bg-gray-50"
        >
          <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center">
            <Text className="text-3xl">📷</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-neutralInk mb-0.5">Nhận Diện Từ Vựng Qua Ảnh</Text>
            <Text className="text-xs text-neutralGray">Quét ảnh bối cảnh thực tế & tạo ví dụ phân cấp từ vựng</Text>
          </View>
        </Pressable>

        {/* Module D: Speaking */}
        <Pressable
          onPress={() => router.push('/(student)/practice/speaking' as any)}
          className="bg-cardWhite p-5 rounded-2xl border border-gray-100 flex-row items-center gap-4 shadow-sm active:bg-gray-50"
        >
          <View className="w-14 h-14 rounded-2xl bg-secondary/10 items-center justify-center">
            <Text className="text-3xl">🗣️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-neutralInk mb-0.5">Luyện Phát Âm & Hội Thoại</Text>
            <Text className="text-xs text-neutralGray">Chấm điểm 4 chỉ số IPA & hội thoại giọng nói 2 chiều</Text>
          </View>
        </Pressable>

        {/* Module E: Writing */}
        <Pressable
          onPress={() => router.push('/(student)/practice/writing' as any)}
          className="bg-cardWhite p-5 rounded-2xl border border-gray-100 flex-row items-center gap-4 shadow-sm active:bg-gray-50"
        >
          <View className="w-14 h-14 rounded-2xl bg-accent/20 items-center justify-center">
            <Text className="text-3xl">✍️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-neutralInk mb-0.5">Trợ Lý Sửa Bài Viết</Text>
            <Text className="text-xs text-neutralGray">Chấm điểm IELTS Writing & so sánh bản tối ưu từ vựng</Text>
          </View>
        </Pressable>

        {/* Module F: Chatbot */}
        <Pressable
          onPress={() => router.push('/(student)/practice/chatbot' as any)}
          className="bg-cardWhite p-5 rounded-2xl border border-gray-100 flex-row items-center gap-4 shadow-sm active:bg-gray-50"
        >
          <View className="w-14 h-14 rounded-2xl bg-success/10 items-center justify-center">
            <Text className="text-3xl">⚡</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-neutralInk mb-0.5">Trợ Lý Học Tập Sparky</Text>
            <Text className="text-xs text-neutralGray">Hỏi đáp ngữ pháp 24/7 & diễn đạt tự nhiên chuẩn bản xứ</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
};
