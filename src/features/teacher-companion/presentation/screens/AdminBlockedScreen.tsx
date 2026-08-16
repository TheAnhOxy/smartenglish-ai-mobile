import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAuthStore } from '@/src/core/flows/authStore';
import { useRouter } from 'expo-router';

export const AdminBlockedScreen = () => {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login' as any);
  };

  return (
    <View className="flex-1 bg-surface px-6 justify-center items-center">
      <View className="w-20 h-20 rounded-full bg-gray-200 justify-center items-center mb-6">
        <Text className="text-4xl">🔒</Text>
      </View>

      <Text className="text-xl font-bold text-neutralInk text-center mb-2">
        Tài Khoản Quản Trị Viên Chỉ Được Sử Dụng Trên Web Portal
      </Text>

      <Text className="text-sm text-neutralGray text-center mb-8 px-4 leading-6">
        Nghiệp vụ quản trị hệ thống, quản lý học liệu và đối soát doanh thu không hỗ trợ trên ứng dụng di động. Vui lòng đăng nhập trên trình duyệt máy tính.
      </Text>

      <Pressable
        onPress={handleLogout}
        className="border border-gray-300 px-8 py-3.5 rounded-xl bg-cardWhite active:bg-gray-100 shadow-sm"
      >
        <Text className="text-neutralInk font-bold text-base">Đăng Xuất</Text>
      </Pressable>
    </View>
  );
};
