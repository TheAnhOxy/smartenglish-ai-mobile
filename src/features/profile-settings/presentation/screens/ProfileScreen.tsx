import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Star,
  Pencil,
  Settings,
  Bell,
  Mic,
  Palette,
  Globe,
  Download,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Target,
  GraduationCap
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import { useAuthStore } from '@/src/core/flows/authStore';

export const ProfileScreen = () => {
  const router = useRouter();
  const { currentUser, logout, userStats } = useAuthStore();

  // Progress Bar Animation
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(45, { duration: 1200 });
  }, []);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`
  }));

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/welcome' as any);
  };

  return (
    <ScrollView className="flex-1 bg-[#F8FAF9]" showsVerticalScrollIndicator={false}>
      {/* Top Dark Hero Curved Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        className="bg-[#0D3B73] pt-14 px-6 pb-8 rounded-b-3xl shadow-xl relative"
      >
        {/* User Info Row */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center gap-4">
            {/* Avatar with Verified Badge */}
            <View className="relative">
              <Image
                source={{
                  uri:
                    currentUser?.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
                }}
                className="w-18 h-18 rounded-full border-2 border-white/40"
              />
              <View className="w-5 h-5 rounded-full bg-[#00BCD4] justify-center items-center absolute bottom-0 right-0 border-2 border-[#0D3B73]">
                <CheckCircle2 color="#FFFFFF" size={12} strokeWidth={3} />
              </View>
            </View>

            {/* Name & Scholar Level Badge */}
            <View>
              <Text className="text-xl font-bold text-white mb-1">
                {currentUser?.display_name || 'Nguyễn Minh'}
              </Text>
              <View className="bg-white/15 px-3 py-1 rounded-full border border-white/20 self-start">
                <Text className="text-xs font-semibold text-gray-200">Level {userStats?.level ?? 1} — Scholar 🎓</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons (Edit & Settings) */}
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push('/(student)/profile/settings' as any)}
              className="w-10 h-10 rounded-xl bg-white/15 justify-center items-center border border-white/20 active:bg-white/25"
            >
              <Settings color="#FFFFFF" size={18} />
            </Pressable>

            <Pressable
              onPress={() => alert('Chỉnh sửa thông tin cá nhân...')}
              className="w-10 h-10 rounded-xl bg-white/15 justify-center items-center border border-white/20 active:bg-white/25"
            >
              <Pencil color="#FFFFFF" size={18} />
            </Pressable>
          </View>
        </View>

        {/* 4 Stats Row */}
        <View className="flex-row justify-around items-center pt-3 border-t border-white/15">
          <View className="items-center">
            <Text className="text-lg font-extrabold text-white">{(userStats?.xp_total ?? 0).toLocaleString('vi-VN')}</Text>
            <Text className="text-[11px] font-medium text-gray-300">XP</Text>
          </View>

          <View className="w-[1px] h-7 bg-white/20" />

          <View className="items-center">
            <Text className="text-lg font-extrabold text-white">{userStats?.coins ?? 0}</Text>
            <Text className="text-[11px] font-medium text-gray-300">Coins</Text>
          </View>

          <View className="w-[1px] h-7 bg-white/20" />

          <View className="items-center">
            <Text className="text-lg font-extrabold text-white">{userStats?.streak_current ?? 0} 🔥</Text>
            <Text className="text-[11px] font-medium text-gray-300">Streak</Text>
          </View>

          <View className="w-[1px] h-7 bg-white/20" />

          <View className="items-center">
            <Text className="text-lg font-extrabold text-white">{userStats?.level ?? 1}</Text>
            <Text className="text-[11px] font-medium text-gray-300">Level</Text>
          </View>
        </View>
      </Animated.View>

      {/* Main Body Content */}
      <View className="px-6 pt-5 pb-12">
        {/* Premium Plan Metallic Blue Glow Card */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <View className="bg-gradient-to-r from-[#143E6D] to-[#0A2647] bg-[#143E6D] p-5 rounded-3xl mb-5 flex-row justify-between items-center shadow-lg border border-white/20 relative overflow-hidden">
            <View className="flex-row items-center gap-3.5 flex-1 mr-2">
              <View className="w-12 h-12 rounded-2xl bg-white/15 justify-center items-center border border-white/20">
                <Star color="#FFC93C" size={24} fill="#FFC93C" />
              </View>

              <View className="flex-1">
                <Text className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-0.5">
                  Gói hiện tại
                </Text>
                <Text className="text-base font-bold text-white mb-0.5">
                  ⭐ {currentUser?.plan === 'premium_yearly' ? 'Premium Yearly' : 'Premium Monthly'}
                </Text>
                <Text className="text-xs text-gray-300 font-medium">Hết hạn: 24 Th09, 2026</Text>
              </View>
            </View>

            {/* Manage Subscription Button */}
            <Pressable
              onPress={() => router.push('/(student)/profile/premium' as any)}
              className="bg-white/20 px-3.5 py-2.5 rounded-2xl border border-white/30 active:bg-white/30"
            >
              <Text className="text-xs font-bold text-white">Quản lý gói</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Learning Goal Card (White Card with Animated Progress) */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-6 shadow-sm">
            <View className="flex-row items-center gap-3.5 mb-3">
              <View className="w-11 h-11 rounded-2xl bg-[#E0F2FE] justify-center items-center">
                <Target color="#0284C7" size={22} />
              </View>

              <View>
                <Text className="text-base font-bold text-neutralInk">
                  Mục tiêu: {currentUser?.target_goal || 'IELTS 6.5'}
                </Text>
                <Text className="text-xs text-neutralGray">
                  Còn 4 tháng • Trình độ hiện tại: {currentUser?.cefr_level || 'B1'}
                </Text>
              </View>
            </View>

            {/* Reanimated Animated Progress Bar */}
            <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <Animated.View
                className="h-full bg-[#00BCD4] rounded-full"
                style={animatedProgressStyle}
              />
            </View>
          </View>
        </Animated.View>

        {/* "Huy hiệu của tôi" Section */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-neutralInk">Huy hiệu của tôi</Text>
              <Pressable onPress={() => alert('Danh sách tất cả huy hiệu...')}>
                <Text className="text-xs font-bold text-[#0284C7]">Tất cả</Text>
              </Pressable>
            </View>

            <View className="flex-row justify-between">
              {/* Badge 1 */}
              <View className="w-[22%] bg-white p-3 rounded-2xl border border-gray-100 items-center shadow-sm">
                <View className="w-10 h-10 rounded-full bg-red-50 justify-center items-center mb-1.5">
                  <Text className="text-xl">🔥</Text>
                </View>
                <Text className="text-[11px] font-bold text-neutralInk text-center">Người lửa</Text>
              </View>

              {/* Badge 2 */}
              <View className="w-[22%] bg-white p-3 rounded-2xl border border-gray-100 items-center shadow-sm">
                <View className="w-10 h-10 rounded-full bg-blue-50 justify-center items-center mb-1.5">
                  <Text className="text-xl">📚</Text>
                </View>
                <Text className="text-[11px] font-bold text-neutralInk text-center">Mọt sách</Text>
              </View>

              {/* Badge 3 */}
              <View className="w-[22%] bg-white p-3 rounded-2xl border border-gray-100 items-center shadow-sm">
                <View className="w-10 h-10 rounded-full bg-cyan-50 justify-center items-center mb-1.5">
                  <Text className="text-xl">🎙️</Text>
                </View>
                <Text className="text-[11px] font-bold text-neutralInk text-center">Xưởng ngôn</Text>
              </View>

              {/* Badge 4 */}
              <View className="w-[22%] bg-white p-3 rounded-2xl border border-gray-100 items-center shadow-sm">
                <View className="w-10 h-10 rounded-full bg-amber-50 justify-center items-center mb-1.5">
                  <Text className="text-xl">🏆</Text>
                </View>
                <Text className="text-[11px] font-bold text-neutralInk text-center">Vô địch</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Settings Menu Card List */}
        <Animated.View entering={FadeInDown.delay(450).duration(400)}>
          <View className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            {/* Community Entry */}
            <Pressable
              onPress={() => router.push('/(student)/feed' as any)}
              className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50"
            >
              <View className="flex-row items-center gap-3">
                <Globe color="#0EA5E9" size={20} />
                <Text className="text-sm font-bold text-neutralInk">Cộng Đồng Học Viên</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="bg-[#E0F2FE] px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-[#0EA5E9]">Mới</Text>
                </View>
                <ChevronRight color="#94A3B8" size={18} />
              </View>
            </Pressable>

            {/* My Classes Entry */}
            <Pressable
              onPress={() => router.push('/(student)/classes' as any)}
              className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50"
            >
              <View className="flex-row items-center gap-3">
                <GraduationCap color="#475569" size={20} />
                <Text className="text-sm font-semibold text-neutralInk">Lớp Học Của Tôi</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} />
            </Pressable>

            {/* Notifications */}
            <Pressable
              onPress={() => router.push('/(student)/notifications' as any)}
              className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50"
            >
              <View className="flex-row items-center gap-3">
                <Bell color="#475569" size={20} />
                <Text className="text-sm font-semibold text-neutralInk">Thông báo</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} />
            </Pressable>

            {/* TTS Voice Settings */}
            <Pressable
              onPress={() => router.push('/(student)/profile/settings' as any)}
              className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50"
            >
              <View className="flex-row items-center gap-3">
                <Mic color="#475569" size={20} />
                <Text className="text-sm font-semibold text-neutralInk">Giọng đọc TTS</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} />
            </Pressable>

            {/* Theme Toggle */}
            <Pressable
              onPress={() => router.push('/(student)/profile/settings' as any)}
              className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50"
            >
              <View className="flex-row items-center gap-3">
                <Palette color="#475569" size={20} />
                <Text className="text-sm font-semibold text-neutralInk">Giao diện (Light/Dark)</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} />
            </Pressable>

            {/* Language Selection */}
            <Pressable
              onPress={() => router.push('/(student)/profile/settings' as any)}
              className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50"
            >
              <View className="flex-row items-center gap-3">
                <Globe color="#475569" size={20} />
                <Text className="text-sm font-semibold text-neutralInk">Ngôn ngữ</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} />
            </Pressable>

            {/* Data Export */}
            <Pressable
              onPress={() => router.push('/(student)/profile/settings' as any)}
              className="p-4 flex-row justify-between items-center active:bg-gray-50"
            >
              <View className="flex-row items-center gap-3">
                <Download color="#475569" size={20} />
                <Text className="text-sm font-semibold text-neutralInk">Xuất dữ liệu</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Red Logout Button Card */}
        <Animated.View entering={FadeInDown.delay(550).duration(400)}>
          <Pressable
            onPress={handleLogout}
            className="bg-red-50 p-4 rounded-2xl border border-red-100 flex-row items-center gap-3 active:bg-red-100 shadow-sm"
          >
            <LogOut color="#EF4444" size={20} />
            <Text className="text-sm font-bold text-red-600">Đăng xuất</Text>
          </Pressable>
        </Animated.View>
      </View>
    </ScrollView>
  );
};
