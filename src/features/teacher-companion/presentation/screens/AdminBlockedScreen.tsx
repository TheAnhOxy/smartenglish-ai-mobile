import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAuthStore } from '@/src/core/flows/authStore';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { isDarkTheme } from '@/src/theme/themeMode';

export const AdminBlockedScreen = () => {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login' as any);
  };

  return (
    <View className="flex-1 bg-surface px-6 justify-center items-center dark:bg-darkBg">
      <View className="w-20 h-20 rounded-full bg-gray-200 justify-center items-center mb-6">
        <Lock size={36} color={AppColors.error} />
      </View>

      <Text className="text-xl font-bold text-neutralInk text-center mb-2 dark:text-darkInk">
        Tài Khoản Quản Trị Viên Chỉ Được Sử Dụng Trên Web Portal
      </Text>

      <Text className="text-sm text-neutralGray text-center mb-8 px-4 leading-6 dark:text-darkMuted">
        Nghiệp vụ quản trị hệ thống, quản lý học liệu và đối soát doanh thu không hỗ trợ trên ứng dụng di động. Vui lòng đăng nhập trên trình duyệt máy tính.
      </Text>

      <Pressable
        onPress={handleLogout}
        className={`border border-gray-300 px-8 py-3.5 rounded-xl bg-cardWhite shadow-sm dark:bg-darkCard ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-gray-100'}`}
      >
        <Text className="text-neutralInk font-bold text-base dark:text-darkInk">Đăng Xuất</Text>
      </Pressable>
    </View>
  );
};
