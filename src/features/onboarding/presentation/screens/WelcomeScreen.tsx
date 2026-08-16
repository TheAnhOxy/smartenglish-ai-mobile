import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export const WelcomeScreen = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface px-6 justify-between py-14">
      <View className="items-center mt-10">
        <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center mb-6 shadow-sm">
          <Text className="text-6xl">🔥</Text>
        </View>
        <Text className="text-3xl font-bold text-neutralInk text-center mb-3">
          SmartEnglish
        </Text>
        <Text className="text-base text-neutralGray text-center px-4 leading-6">
          Trợ lý đồng hành thông minh giúp bạn làm chủ tiếng Anh với lộ trình cá nhân hóa.
        </Text>
      </View>

      <View className="gap-3">
        <Pressable
          onPress={() => router.push('/(auth)/register' as any)}
          className="bg-primary py-4 rounded-2xl items-center shadow-sm active:bg-primaryDark"
        >
          <Text className="text-white font-bold text-base">Tạo Tài Khoản Mới ➔</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(auth)/choose-goal' as any)}
          className="bg-secondary py-3.5 rounded-2xl items-center shadow-sm active:opacity-90"
        >
          <Text className="text-white font-bold text-base">Bắt Đầu Ngay (Placement Test)</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(auth)/login' as any)}
          className="bg-cardWhite border border-gray-200 py-3.5 rounded-2xl items-center active:bg-gray-50"
        >
          <Text className="text-neutralInk font-semibold text-sm">Đã Có Tài Khoản? Đăng Nhập</Text>
        </Pressable>
      </View>
    </View>
  );
};
