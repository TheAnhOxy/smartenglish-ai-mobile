import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Image } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  ChevronRight,
  GraduationCap,
  Bell,
  Palette,
  CreditCard,
  ShieldCheck,
  Info,
  ExternalLink,
  Mail,
  LogOut,
  CheckCircle2,
  Minus,
  Plus
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/src/core/flows/authStore';

export const SettingsScreen = () => {
  const router = useRouter();
  const { currentUser, logout } = useAuthStore();

  // Settings State
  const [dailyCards, setDailyCards] = useState(20);
  const [ttsVoice, setTtsVoice] = useState('Anh - Mỹ');
  const [ttsSpeed, setTtsSpeed] = useState(1.0);

  // Notification Toggles
  const [reminders, setReminders] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [leaderboardNotifs, setLeaderboardNotifs] = useState(false);
  const [autoStreakFreeze, setAutoStreakFreeze] = useState(true);

  // Appearance Theme
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');

  // Security
  const [twoFactor, setTwoFactor] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/welcome' as any);
  };

  return (
    <View className="flex-1 bg-[#F8FAF9] pt-12">
      {/* Top Header Bar */}
      <View className="px-6 pb-4 flex-row justify-between items-center bg-white border-b border-gray-100 shadow-sm">
        <Pressable onPress={() => router.back()} className="p-1">
          <ArrowLeft color="#1E293B" size={20} />
        </Pressable>

        <Text className="text-lg font-bold text-neutralInk">Cài đặt</Text>

        <Pressable onPress={() => alert('Tìm kiếm cài đặt...')} className="p-1">
          <Search color="#1E293B" size={20} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5 pt-4 pb-12">
        {/* User Account Summary Card */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Pressable
            onPress={() => alert('Quản lý tài khoản...')}
            className="bg-white p-4 rounded-3xl border border-gray-100 flex-row justify-between items-center shadow-sm mb-6 active:bg-gray-50"
          >
            <View className="flex-row items-center gap-3.5 flex-1 mr-2">
              <View className="relative">
                <Image
                  source={{
                    uri:
                      currentUser?.avatar_url ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
                  }}
                  className="w-13 h-13 rounded-full border border-gray-200"
                />
                <View className="w-4 h-4 rounded-full bg-[#00BCD4] justify-center items-center absolute bottom-0 right-0 border-2 border-white">
                  <CheckCircle2 color="#FFFFFF" size={10} strokeWidth={3} />
                </View>
              </View>

              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text className="text-base font-bold text-neutralInk">
                    {currentUser?.display_name || 'Minh Nguyễn'}
                  </Text>
                  <View className="bg-cyan-100 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-extrabold text-[#0284C7]">PLUS</Text>
                  </View>
                </View>
                <Text className="text-xs text-neutralGray">Quản lý tài khoản ›</Text>
              </View>
            </View>

            <ChevronRight color="#94A3B8" size={20} />
          </Pressable>
        </Animated.View>

        {/* Section 1: HỌC TẬP */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text className="text-xs font-bold text-neutralGray uppercase tracking-wider mb-2 ml-1">
            🎓 HỌC TẬP
          </Text>

          <View className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            {/* Daily Cards Counter */}
            <View className="p-4 flex-row justify-between items-center border-b border-gray-100">
              <Text className="text-xs font-semibold text-neutralInk">Số thẻ học mỗi ngày</Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl p-1 gap-3">
                <Pressable
                  onPress={() => setDailyCards(Math.max(5, dailyCards - 5))}
                  className="w-7 h-7 rounded-lg bg-white justify-center items-center shadow-sm"
                >
                  <Minus color="#475569" size={14} />
                </Pressable>
                <Text className="text-xs font-bold text-neutralInk">{dailyCards}</Text>
                <Pressable
                  onPress={() => setDailyCards(dailyCards + 5)}
                  className="w-7 h-7 rounded-lg bg-white justify-center items-center shadow-sm"
                >
                  <Plus color="#475569" size={14} />
                </Pressable>
              </View>
            </View>

            {/* TTS Voice */}
            <View className="p-4 flex-row justify-between items-center border-b border-gray-100">
              <Text className="text-xs font-semibold text-neutralInk">Giọng đọc (TTS)</Text>
              <Pressable
                onPress={() => alert('Chọn giọng đọc...')}
                className="flex-row items-center gap-1"
              >
                <Text className="text-xs font-bold text-[#0284C7]">{ttsVoice}</Text>
                <Text className="text-xs text-[#0284C7]">∨</Text>
              </Pressable>
            </View>

            {/* TTS Speed Slider Sim */}
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-semibold text-neutralInk">Tốc độ phát âm</Text>
                <Text className="text-xs font-bold text-[#0284C7]">{ttsSpeed.toFixed(1)}x</Text>
              </View>

              {/* Slider Track Sim */}
              <View className="h-2 bg-gray-100 rounded-full relative justify-center">
                <View className="h-full bg-[#00BCD4] rounded-full" style={{ width: '50%' }} />
                <View className="w-5 h-5 rounded-full bg-white border-2 border-[#00BCD4] absolute left-1/2 -ml-2.5 shadow-md" />
              </View>
            </View>

            {/* UI Language */}
            <View className="p-4 flex-row justify-between items-center">
              <Text className="text-xs font-semibold text-neutralInk">Ngôn ngữ giao diện</Text>
              <Text className="text-xs font-bold text-neutralGray">Tiếng Việt</Text>
            </View>
          </View>
        </Animated.View>

        {/* Section 2: THÔNG BÁO */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text className="text-xs font-bold text-neutralGray uppercase tracking-wider mb-2 ml-1">
            🔔 THÔNG BÁO
          </Text>

          <View className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            {/* Learning Reminders */}
            <View className="p-4 flex-row justify-between items-center border-b border-gray-100">
              <Text className="text-xs font-semibold text-neutralInk">Nhắc nhở học tập</Text>
              <Switch
                value={reminders}
                onValueChange={setReminders}
                trackColor={{ false: '#E2E8F0', true: '#00BCD4' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Streak Alert */}
            <View className="p-4 flex-row justify-between items-center border-b border-gray-100">
              <Text className="text-xs font-semibold text-neutralInk">Cảnh báo chuỗi Streak</Text>
              <Switch
                value={streakAlerts}
                onValueChange={setStreakAlerts}
                trackColor={{ false: '#E2E8F0', true: '#00BCD4' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Leaderboard Notif */}
            <View className="p-4 flex-row justify-between items-center border-b border-gray-100">
              <Text className="text-xs font-semibold text-neutralInk">Bảng xếp hạng (Leaderboard)</Text>
              <Switch
                value={leaderboardNotifs}
                onValueChange={setLeaderboardNotifs}
                trackColor={{ false: '#E2E8F0', true: '#00BCD4' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Auto Streak Freeze */}
            <View className="p-4 flex-row justify-between items-center">
              <View>
                <Text className="text-xs font-semibold text-neutralInk">Tự động Streak Freeze</Text>
                <Text className="text-[10px] text-neutralGray mt-0.5">Dùng 1 vật phẩm khi lỡ học</Text>
              </View>
              <Switch
                value={autoStreakFreeze}
                onValueChange={setAutoStreakFreeze}
                trackColor={{ false: '#E2E8F0', true: '#00BCD4' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </Animated.View>

        {/* Section 3: GIAO DIỆN */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text className="text-xs font-bold text-neutralGray uppercase tracking-wider mb-2 ml-1">
            🎨 GIAO DIỆN
          </Text>

          <View className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm mb-6">
            {/* Theme 3 Previews */}
            <View className="flex-row justify-between mb-4">
              {/* Light Card */}
              <Pressable
                onPress={() => setThemeMode('light')}
                className={`w-[31%] p-3 rounded-2xl border items-center ${
                  themeMode === 'light' ? 'border-[#00BCD4] bg-cyan-50/40 shadow-sm' : 'border-gray-200'
                }`}
              >
                <View className="w-full h-12 rounded-xl bg-[#F8FAF9] p-2 mb-2 border border-gray-200">
                  <View className="w-3/4 h-2 bg-gray-300 rounded-full mb-1" />
                  <View className="w-full h-3 bg-[#00BCD4] rounded-md" />
                </View>
                <Text className="text-xs font-bold text-neutralInk">Sáng</Text>
              </Pressable>

              {/* Dark Card */}
              <Pressable
                onPress={() => setThemeMode('dark')}
                className={`w-[31%] p-3 rounded-2xl border items-center ${
                  themeMode === 'dark' ? 'border-[#00BCD4] bg-cyan-50/40 shadow-sm' : 'border-gray-200'
                }`}
              >
                <View className="w-full h-12 rounded-xl bg-[#1E293B] p-2 mb-2">
                  <View className="w-3/4 h-2 bg-gray-600 rounded-full mb-1" />
                  <View className="w-full h-3 bg-[#0284C7] rounded-md" />
                </View>
                <Text className="text-xs font-bold text-neutralInk">Tối</Text>
              </Pressable>

              {/* Auto Card */}
              <Pressable
                onPress={() => setThemeMode('system')}
                className={`w-[31%] p-3 rounded-2xl border items-center ${
                  themeMode === 'system' ? 'border-[#00BCD4] bg-cyan-50/40 shadow-sm' : 'border-gray-200'
                }`}
              >
                <View className="w-full h-12 rounded-xl bg-gradient-to-r from-gray-200 to-gray-700 p-2 mb-2 border border-gray-300">
                  <View className="w-3/4 h-2 bg-gray-500 rounded-full mb-1" />
                  <View className="w-full h-3 bg-[#00BCD4] rounded-md" />
                </View>
                <Text className="text-xs font-bold text-neutralInk">Tự động</Text>
              </Pressable>
            </View>

            {/* Font Size Slider */}
            <View className="pt-2">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-semibold text-neutralInk">Cỡ chữ</Text>
                <Text className="text-xs font-bold text-neutralGray">Trung bình</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-xs font-bold text-gray-400">A</Text>
                <View className="flex-1 h-2 bg-gray-100 rounded-full relative justify-center">
                  <View className="h-full bg-[#00BCD4] rounded-full" style={{ width: '50%' }} />
                  <View className="w-4 h-4 rounded-full bg-[#0D3B73] absolute left-1/2 -ml-2" />
                </View>
                <Text className="text-base font-bold text-gray-700">A</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Section 4: TÀI KHOẢN & GÓI CƯỚC */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text className="text-xs font-bold text-neutralGray uppercase tracking-wider mb-2 ml-1">
            💳 TÀI KHOẢN & GÓI CƯỚC
          </Text>

          <View className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <Pressable
              onPress={() => router.push('/(student)/profile/premium' as any)}
              className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50"
            >
              <Text className="text-xs font-semibold text-neutralInk">Gói hiện tại</Text>
              <Text className="text-xs font-bold text-[#0284C7]">Premium Annual</Text>
            </Pressable>

            <Pressable
              onPress={() => alert('Lịch sử giao dịch...')}
              className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50"
            >
              <Text className="text-xs font-semibold text-neutralInk">Lịch sử giao dịch</Text>
              <ChevronRight color="#94A3B8" size={18} />
            </Pressable>

            <Pressable
              onPress={() => alert('Khôi phục mua hàng thành công!')}
              className="p-4 flex-row justify-between items-center active:bg-gray-50"
            >
              <Text className="text-xs font-semibold text-neutralInk">Khôi phục mua hàng</Text>
              <ChevronRight color="#94A3B8" size={18} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Section 5: BẢO MẬT */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Text className="text-xs font-bold text-neutralGray uppercase tracking-wider mb-2 ml-1">
            🛡️ BẢO MẬT
          </Text>

          <View className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <Pressable
              onPress={() => alert('Đổi mật khẩu...')}
              className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50"
            >
              <Text className="text-xs font-semibold text-neutralInk">Đổi mật khẩu</Text>
              <ChevronRight color="#94A3B8" size={18} />
            </Pressable>

            <View className="p-4 flex-row justify-between items-center">
              <View>
                <Text className="text-xs font-semibold text-neutralInk">Xác thực 2 bước</Text>
                <Text className="text-[10px] text-neutralGray mt-0.5">Tăng cường bảo vệ tài khoản</Text>
              </View>
              <Switch
                value={twoFactor}
                onValueChange={setTwoFactor}
                trackColor={{ false: '#E2E8F0', true: '#00BCD4' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </Animated.View>

        {/* Section 6: THÔNG TIN KHÁC */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <Text className="text-xs font-bold text-neutralGray uppercase tracking-wider mb-2 ml-1">
            ℹ️ THÔNG TIN KHÁC
          </Text>

          <View className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
            <Pressable
              onPress={() => alert('Điều khoản sử dụng...')}
              className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50"
            >
              <Text className="text-xs font-semibold text-neutralInk">Điều khoản sử dụng</Text>
              <ExternalLink color="#94A3B8" size={16} />
            </Pressable>

            <Pressable
              onPress={() => alert('Chính sách quyền riêng tư...')}
              className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50"
            >
              <Text className="text-xs font-semibold text-neutralInk">Chính sách quyền riêng tư</Text>
              <ExternalLink color="#94A3B8" size={16} />
            </Pressable>

            <View className="p-4 flex-row justify-between items-center border-b border-gray-100">
              <Text className="text-xs font-semibold text-neutralInk">Phiên bản ứng dụng</Text>
              <Text className="text-xs font-bold text-neutralGray">2.4.1 (Build 108)</Text>
            </View>

            <Pressable
              onPress={() => alert('Liên hệ hỗ trợ: support@smartenglish.ai')}
              className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50"
            >
              <Text className="text-xs font-semibold text-neutralInk">Liên hệ hỗ trợ</Text>
              <Mail color="#94A3B8" size={16} />
            </Pressable>

            {/* Red Logout Row at bottom of card */}
            <Pressable
              onPress={handleLogout}
              className="p-4 flex-row justify-center items-center gap-2 bg-red-50 active:bg-red-100"
            >
              <LogOut color="#EF4444" size={18} />
              <Text className="text-xs font-bold text-red-600">Đăng xuất</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Footer Note */}
        <View className="items-center pb-8">
          <Text className="text-[11px] text-gray-400 text-center mb-2">
            Cảm ơn bạn đã học tập cùng SmartEnglish AI
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};
