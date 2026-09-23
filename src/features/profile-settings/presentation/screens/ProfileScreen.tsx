import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
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
  GraduationCap,
  User,
  Flame,
  BookOpen,
  Trophy,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/core/flows/authStore';
import { getProfileApi } from '@/src/features/profile-settings/data/profileApi';
import { colors } from '@/src/theme/colors';

const BADGES = [
  { icon: Flame, label: 'Nguoi lua', color: colors.streak, bg: colors.streakSoft },
  { icon: BookOpen, label: 'Mot sach', color: colors.primary, bg: colors.primarySoft },
  { icon: Mic, label: 'Xuong ngon', color: colors.secondary, bg: colors.secondarySoft },
  { icon: Trophy, label: 'Vo dich', color: colors.xpDeep, bg: colors.xpSoft },
];

export const ProfileScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, logout, userStats, updateCurrentUser } = useAuthStore();

  const progressWidth = useSharedValue(0);
  useEffect(() => {
    progressWidth.value = withTiming(45, { duration: 1200 });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const fetchLatestProfile = async () => {
        try {
          const userId = currentUser?.id ? String(currentUser.id) : '1';
          const fresh = await getProfileApi(userId);
          if (isMounted && fresh && Object.keys(fresh).length > 0) {
            updateCurrentUser(fresh);
          }
        } catch (e) {}
      };
      fetchLatestProfile();
      return () => { isMounted = false; };
    }, [currentUser?.id])
  );

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%` as any,
  }));

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/welcome' as any);
  };

  const stats = [
    { value: (userStats?.xp_total ?? 0).toLocaleString('vi-VN'), label: 'XP' },
    { value: String(userStats?.coins ?? 0), label: 'Coins' },
    { value: String(userStats?.streak_current ?? 0), label: 'Streak' },
    { value: String(userStats?.level ?? 1), label: 'Level' },
  ];

  const safeTop = Math.max(insets.top, 48) + 12;

  return (
    <ScrollView className="flex-1 bg-[#F8FAFC]" showsVerticalScrollIndicator={false}>
      <View className="w-full max-w-xl mx-auto">
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="bg-[#0D3B73] pt-14 px-6 pb-8 rounded-b-3xl shadow-xl"
        >
          <View className="flex-row justify-between items-center mb-6">
            <Pressable
              onPress={() => router.push('/(student)/profile/edit' as any)}
              className="flex-row items-center gap-4 flex-1 mr-2"
            >
              <View className="relative">
                <Image
                  source={{ uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300' }}
                  className="w-16 h-16 rounded-full border-2 border-white/40"
                />
                <View className="w-5 h-5 rounded-full bg-[#00BCD4] justify-center items-center absolute bottom-0 right-0 border-2 border-[#0D3B73]">
                  <CheckCircle2 color="#FFFFFF" size={12} strokeWidth={3} />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-white mb-1" numberOfLines={1}>
                  {currentUser?.display_name || 'Nguyen Minh'}
                </Text>
                <View className="bg-white/15 px-3 py-1 rounded-full border border-white/20 self-start">
                  <Text className="text-xs font-semibold text-gray-200">Level {userStats?.level ?? 1} - Scholar</Text>
                </View>
              </View>
            </Pressable>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => router.push('/(student)/profile/settings' as any)}
                className="w-10 h-10 rounded-xl bg-white/15 justify-center items-center border border-white/20 active:bg-white/25"
              >
                <Settings color="#FFFFFF" size={17} strokeWidth={1.8} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/(student)/profile/edit' as any)}
                className="w-10 h-10 rounded-xl bg-white/15 justify-center items-center border border-white/20 active:bg-white/25"
              >
                <Pencil color="#FFFFFF" size={17} strokeWidth={1.8} />
              </Pressable>
            </View>
          </View>

          <View className="flex-row justify-around items-center pt-4 border-t border-white/15">
            {stats.map((item, i) => (
              <React.Fragment key={item.label}>
                <View className="items-center">
                  <Text className="text-lg font-extrabold text-white">{item.value}</Text>
                  <Text className="text-[11px] font-medium text-white/70 mt-0.5">{item.label}</Text>
                </View>
                {i < stats.length - 1 && <View className="w-px h-7 bg-white/20" />}
              </React.Fragment>
            ))}
          </View>
        </Animated.View>

        <View className="px-5 pt-5 pb-10 gap-4">
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <View className="bg-[#143454] rounded-3xl p-4 flex-row items-center gap-3 border border-white/10">
              <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                <Star color={colors.xp} size={22} fill={colors.xp} strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-0.5">Goi hien tai</Text>
                <Text className="text-base font-extrabold text-white mb-0.5">
                  {currentUser?.plan === 'premium_yearly' ? 'Premium Yearly' : 'Premium Monthly'}
                </Text>
                <Text className="text-[11px] text-white/60">Het han: 24 Th09, 2026</Text>
              </View>
              <Pressable
                onPress={() => router.push('/(student)/profile/premium' as any)}
                className="px-3 py-2 rounded-2xl border border-white/25 active:bg-white/30" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
              >
                <Text className="text-xs font-bold text-white">Quan ly goi</Text>
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <View className="bg-white rounded-3xl p-4 flex-row items-start gap-3 border border-gray-100 shadow-sm">
              <View className="w-11 h-11 rounded-2xl bg-[#E8F1F8] items-center justify-center mt-0.5">
                <Target color={colors.primary} size={20} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900 mb-0.5">
                  Muc tieu: {currentUser?.target_goal || 'IELTS 6.5'}
                </Text>
                <Text className="text-xs text-gray-500 mb-2.5">
                  Con 4 thang - Trinh do hien tai: {currentUser?.cefr_level || 'B1'}
                </Text>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <Animated.View style={[{ height: '100%', backgroundColor: colors.secondary, borderRadius: 4 }, animatedProgressStyle]} />
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-bold text-gray-900">Huy hieu cua toi</Text>
              <Pressable><Text className="text-sm font-semibold text-[#1F4E79]">Tat ca</Text></Pressable>
            </View>
            <View className="flex-row gap-2">
              {BADGES.map((badge) => {
                const BadgeIcon = badge.icon;
                return (
                  <View key={badge.label} className="flex-1 bg-white rounded-2xl border border-gray-100 py-3 items-center gap-1.5">
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: badge.bg, alignItems: 'center', justifyContent: 'center' }}>
                      <BadgeIcon color={badge.color} size={20} strokeWidth={2} />
                    </View>
                    <Text className="text-[10px] font-bold text-gray-800 text-center">{badge.label}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450).duration(400)}>
            <View className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-2">
              <Pressable onPress={() => router.push('/(student)/profile/edit' as any)} className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50 bg-sky-50/30">
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-2xl justify-center items-center" style={{ backgroundColor: 'rgba(13,59,115,0.1)' }}>
                    <User color="#0D3B73" size={18} />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-neutralInk">Ho so cua toi</Text>
                    <Text className="text-[11px] text-gray-500 font-medium">Chinh sua thong tin ca nhan</Text>
                  </View>
                </View>
                <ChevronRight color="#94A3B8" size={18} />
              </Pressable>

              <Pressable onPress={() => router.push('/(student)/feed' as any)} className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50">
                <View className="flex-row items-center gap-3">
                  <Globe color="#0EA5E9" size={20} />
                  <Text className="text-sm font-bold text-neutralInk">Cong Dong Hoc Vien</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="bg-[#E0F2FE] px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-[#0EA5E9]">Moi</Text>
                  </View>
                  <ChevronRight color="#94A3B8" size={18} />
                </View>
              </Pressable>

              <Pressable onPress={() => router.push('/(student)/classes' as any)} className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50">
                <View className="flex-row items-center gap-3">
                  <GraduationCap color="#475569" size={20} />
                  <Text className="text-sm font-semibold text-neutralInk">Lop Hoc Cua Toi</Text>
                </View>
                <ChevronRight color="#94A3B8" size={18} />
              </Pressable>

              <Pressable onPress={() => router.push('/(student)/notifications' as any)} className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50">
                <View className="flex-row items-center gap-3">
                  <Bell color="#475569" size={20} />
                  <Text className="text-sm font-semibold text-neutralInk">Thong bao</Text>
                </View>
                <ChevronRight color="#94A3B8" size={18} />
              </Pressable>

              <Pressable onPress={() => router.push('/(student)/profile/settings' as any)} className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50">
                <View className="flex-row items-center gap-3">
                  <Mic color="#475569" size={20} />
                  <Text className="text-sm font-semibold text-neutralInk">Giong doc TTS</Text>
                </View>
                <ChevronRight color="#94A3B8" size={18} />
              </Pressable>

              <Pressable onPress={() => router.push('/(student)/profile/settings' as any)} className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50">
                <View className="flex-row items-center gap-3">
                  <Palette color="#475569" size={20} />
                  <Text className="text-sm font-semibold text-neutralInk">Giao dien (Light/Dark)</Text>
                </View>
                <ChevronRight color="#94A3B8" size={18} />
              </Pressable>

              <Pressable onPress={() => router.push('/(student)/profile/settings' as any)} className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50">
                <View className="flex-row items-center gap-3">
                  <Globe color="#475569" size={20} />
                  <Text className="text-sm font-semibold text-neutralInk">Ngon ngu</Text>
                </View>
                <ChevronRight color="#94A3B8" size={18} />
              </Pressable>

              <Pressable onPress={() => router.push('/(student)/profile/settings' as any)} className="p-4 flex-row justify-between items-center active:bg-gray-50">
                <View className="flex-row items-center gap-3">
                  <Download color="#475569" size={20} />
                  <Text className="text-sm font-semibold text-neutralInk">Xuat du lieu</Text>
                </View>
                <ChevronRight color="#94A3B8" size={18} />
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(550).duration(400)}>
            <Pressable
              onPress={handleLogout}
              className="bg-red-50 p-4 rounded-2xl border border-red-100 flex-row items-center gap-2.5 active:bg-red-100"
            >
              <LogOut color={colors.danger} size={20} strokeWidth={1.8} />
              <Text className="text-sm font-bold text-red-500">Dang xuat</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </ScrollView>
  );
};
