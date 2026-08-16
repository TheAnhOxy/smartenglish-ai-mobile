import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export const AnalyticsScreen = () => {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-surface pt-14 px-6 pb-10" showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-primary font-bold text-sm">← Trang Chủ</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-neutralInk mb-1">Bảng Phân Tích Học Tập</Text>
      <Text className="text-xs text-neutralGray mb-6">Thống kê thời lượng học & điểm số trung bình 7 ngày qua</Text>

      {/* 7-Day Study Time Bar Chart Mock */}
      <View className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-6 shadow-sm">
        <Text className="text-sm font-bold text-neutralInk mb-4">Thời Lượng Học 7 Ngày Qua (Phút)</Text>
        <View className="flex-row justify-between items-end h-32 pt-4 px-2">
          {[
            { day: 'T2', min: 25 },
            { day: 'T3', min: 40 },
            { day: 'T4', min: 15 },
            { day: 'T5', min: 30 },
            { day: 'T6', min: 50 },
            { day: 'T7', min: 35 },
            { day: 'CN', min: 45 }
          ].map((item, idx) => (
            <View key={idx} className="items-center flex-1">
              <View className="w-6 bg-secondary/20 rounded-t-md justify-end overflow-hidden" style={{ height: `${(item.min / 50) * 100}%` }}>
                <View className="w-full bg-secondary rounded-t-md" style={{ height: '80%' }} />
              </View>
              <Text className="text-[10px] text-neutralGray font-semibold mt-2">{item.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Radar Skill Overview */}
      <View className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-10 shadow-sm">
        <Text className="text-sm font-bold text-neutralInk mb-4">Đánh Giá Năng Lực Theo Kỹ Năng</Text>
        <View className="gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-semibold text-neutralInk">Từ Vựng (Vocabulary)</Text>
            <Text className="text-xs font-bold text-secondary">85 / 100</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-semibold text-neutralInk">Ngữ Pháp (Grammar)</Text>
            <Text className="text-xs font-bold text-primary">70 / 100</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-semibold text-neutralInk">Phát Âm (Speaking IPA)</Text>
            <Text className="text-xs font-bold text-success">78 / 100</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
