import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Star,
  Crown,
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
  Receipt,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/core/flows/authStore';
import { useRoleGateStore } from '@/src/core/flows/roleGateStore';
import { getProfileApi } from '@/src/features/profile-settings/data/profileApi';
import { colors } from '@/src/theme/colors';
import { StudentInvoicesModal } from '@/src/features/subscription-paywall/presentation/components/StudentInvoicesModal';
import { UserAvatar } from '@/src/core/components/UserAvatar';
import { planExpiryText, planLabel } from '@/src/core/utils/plan';
import { ChristmasScene } from '@/src/components/xmas/ChristmasScenes';
import { useXmasActive } from '@/src/core/services/xmas';
import { Garland } from '@/src/components/xmas/XmasArt';
import { PineBranch, ShimmerSweep, SnowEdge, SparkleRing } from '@/src/components/xmas/WinterUI';
import { SantaHat } from '@/src/features/learning-path/presentation/winter/WinterArt';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Coins } from 'lucide-react-native';
import { dk, isDarkTheme } from '@/src/theme/themeMode';

const BADGES = [
  { icon: Flame, label: 'Người lửa', color: colors.streak, bg: colors.streakSoft },
  { icon: BookOpen, label: 'Mọt sách', color: colors.primary, bg: colors.primarySoft },
  { icon: Mic, label: 'Xướng ngôn', color: colors.secondary, bg: colors.secondarySoft },
  { icon: Trophy, label: 'Vô địch', color: colors.xpDeep, bg: colors.xpSoft },
];

export const ProfileScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, logout, userStats, updateCurrentUser } = useAuthStore();
  const { hasPermission, syncRolePermissions } = useRoleGateStore();
  const [isInvoicesModalOpen, setIsInvoicesModalOpen] = useState(false);

  const canUseCommunity = hasPermission('use_community');
  const canJoinClass = hasPermission('join_class_submit');

  const progressWidth = useSharedValue(0);
  useEffect(() => {
    progressWidth.value = withTiming(45, { duration: 1200 });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const fetchLatestProfile = async () => {
        try {
          const userId = currentUser?.id ? String(currentUser.id) : undefined;
          syncRolePermissions();
          if (!userId) return;

          const fresh = await getProfileApi(userId);
          if (isMounted && fresh && Object.keys(fresh).length > 0) {
            // Bảo vệ: Nếu tài khoản học viên/giáo viên hiện tại nhận nhầm profile admin thì không ghi đè
            if (fresh.role === 'admin' && currentUser?.role && currentUser.role !== 'admin') {
              console.warn('[ProfileScreen] Bỏ qua dữ liệu admin profile không khớp với học viên hiện tại');
              return;
            }
            updateCurrentUser(fresh);
          }
        } catch (e) {}
      };
      fetchLatestProfile();
      return () => { isMounted = false; };
    }, [currentUser?.id, currentUser?.role])
  );

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%` as any,
  }));

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login' as any);
  };

  const stats = [
    { value: (userStats?.xp_total ?? 0).toLocaleString('vi-VN'), label: 'XP', Icon: Zap, tone: '#67E8F9' },
    { value: String(userStats?.coins ?? 0), label: 'Coins', Icon: Coins, tone: '#FBBF24' },
    { value: String(userStats?.streak_current ?? 0), label: 'Streak', Icon: Flame, tone: '#FB923C' },
    { value: String(userStats?.level ?? 1), label: 'Level', Icon: Star, tone: '#FDE68A' },
  ];

  const safeTop = (insets.top || 16) + 10;
  // Giáng sinh (giao diện tối): "Nhà gỗ Giáng sinh" — mọi màu trang trí viết inline
  const xmas = useXmasActive();
  const menuIcon = xmas ? '#93C5FD' : '#475569';
  const glass = xmas ? { backgroundColor: 'rgba(16,37,31,0.88)', borderColor: 'rgba(147,197,253,0.25)' } : undefined;

  return (
    <View style={{ flex: 1 }}>
    {xmas ? <ChristmasScene scene="lodge" /> : null}
    <ScrollView style={xmas ? { backgroundColor: 'transparent' } : undefined} className="flex-1 bg-[#F8FAFC] dark:bg-darkBg" showsVerticalScrollIndicator={false}>
      <View className="w-full max-w-xl mx-auto">
        {/* className không áp dụng được cho Animated.View của Reanimated → nền phải đặt bằng style */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{
            paddingTop: safeTop,
            paddingHorizontal: 24,
            paddingBottom: 32,
            backgroundColor: xmas ? '#10251F' : '#0D3B73',
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            overflow: xmas ? 'hidden' : undefined,
            borderBottomWidth: xmas ? 1.5 : 0,
            borderColor: 'rgba(251,191,36,0.45)',
          }}
        >
          {xmas ? (
            <>
              <LinearGradient colors={['#081421', '#14321F', '#3B2A12']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
              <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, top: safeTop - 14 }}>
                <Garland width={320} />
              </View>
              <PineBranch size={84} style={{ position: 'absolute', left: -18, bottom: -4 }} />
              <PineBranch size={84} flip style={{ position: 'absolute', right: -18, bottom: -4 }} />
            </>
          ) : null}
          <View className="flex-row justify-between items-center mb-6">
            <Pressable
              onPress={() => router.push('/(student)/profile/edit' as any)}
              className="flex-row items-center gap-4 flex-1 mr-2"
            >
              <View className="relative">
                <UserAvatar
                  uri={currentUser?.avatar_url}
                  size={64}
                  style={xmas ? { borderWidth: 3, borderColor: '#FBBF24', shadowColor: '#FBBF24', shadowOpacity: 0.9, shadowRadius: 10 } : { borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' }}
                />
                {xmas ? (
                  <>
                    <SparkleRing size={64} />
                    <SantaHat size={30} style={{ position: 'absolute', top: -16, left: -8, transform: [{ rotate: '-24deg' }] }} />
                  </>
                ) : null}
                <View className="w-5 h-5 rounded-full bg-[#00BCD4] justify-center items-center absolute bottom-0 right-0 border-2 border-[#0D3B73]">
                  <CheckCircle2 color="#FFFFFF" size={12} strokeWidth={3} />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-white mb-1" numberOfLines={1}>
                  {currentUser?.display_name || 'Học viên'}
                </Text>
                <View
                  className="bg-white/15 px-3 py-1 rounded-full border border-white/20 self-start dark:bg-darkCard"
                  style={xmas ? { backgroundColor: 'rgba(8,20,33,0.75)', borderColor: '#FBBF24', flexDirection: 'row', alignItems: 'center', gap: 4 } : undefined}
                >
                  {xmas ? <Star size={12} color="#FBBF24" fill="#FBBF24" /> : null}
                  <Text className="text-xs font-semibold text-gray-200" style={xmas ? { color: '#FDE68A' } : undefined}>Level {userStats?.level ?? 1} - Scholar</Text>
                </View>
              </View>
            </Pressable>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => router.push('/(student)/profile/settings' as any)}
                className={`w-10 h-10 rounded-xl bg-white/15 justify-center items-center border border-white/20 dark:bg-darkCard ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-white/25'}`}
                style={xmas ? { backgroundColor: 'rgba(8,20,33,0.6)', borderColor: 'rgba(147,197,253,0.4)' } : undefined}
              >
                <Settings color="#FFFFFF" size={17} strokeWidth={1.8} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/(student)/profile/edit' as any)}
                className={`w-10 h-10 rounded-xl bg-white/15 justify-center items-center border border-white/20 dark:bg-darkCard ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-white/25'}`}
                style={xmas ? { backgroundColor: 'rgba(8,20,33,0.6)', borderColor: 'rgba(147,197,253,0.4)' } : undefined}
              >
                <Pencil color="#FFFFFF" size={17} strokeWidth={1.8} />
              </Pressable>
            </View>
          </View>

          <View className="flex-row justify-around items-center pt-4 border-t border-white/15">
            {stats.map((item, i) => (
              <React.Fragment key={item.label}>
                <View className="items-center">
                  {xmas ? <item.Icon size={16} color={item.tone} fill={item.label === 'Level' ? item.tone : 'none'} style={{ marginBottom: 2 }} /> : null}
                  <Text className="text-lg font-extrabold text-white" style={xmas ? { color: item.tone, textShadowColor: item.tone, textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } } : undefined}>
                    {item.value}
                  </Text>
                  <Text className="text-[11px] font-medium text-white/70 mt-0.5">{item.label}</Text>
                </View>
                {i < stats.length - 1 && <View className="w-px h-7 bg-white/20 dark:bg-darkCard" />}
              </React.Fragment>
            ))}
          </View>
        </Animated.View>

        <View className="px-5 pt-5 pb-10 gap-4">
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <Pressable
              onPress={() => router.push('/(student)/profile/premium' as any)}
              className="bg-[#143454] rounded-3xl p-4 flex-row items-center gap-3 border border-white/10 active:opacity-95"
            >
              <View className="w-12 h-12 rounded-2xl items-center justify-center bg-amber-500/20 border border-amber-400/30">
                <Crown color="#F59E0B" size={22} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-0.5">Gói hiện tại</Text>
                <Text className="text-base font-extrabold text-white mb-0.5">
                  {planLabel(currentUser)}
                </Text>
                <Text className="text-[11px] text-white/60">
                  {planExpiryText(currentUser)}
                </Text>
              </View>
              <View
                className="px-3.5 py-2 rounded-2xl border border-white/25"
                style={xmas ? { backgroundColor: '#FBBF24', borderColor: '#FDE68A', overflow: 'hidden' } : { backgroundColor: 'rgba(255,255,255,0.18)' }}
              >
                {xmas ? <ShimmerSweep width={100} every={3000} /> : null}
                <Text className="text-xs font-bold text-white" style={xmas ? { color: dk('#3B2A12', 'text') } : undefined}>Quản lý gói</Text>
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <View className="bg-white rounded-3xl p-4 flex-row items-start gap-3 border border-gray-100 shadow-sm dark:bg-darkCard dark:border-darkLine" style={xmas ? { ...glass, borderColor: 'rgba(251,191,36,0.35)' } : undefined}>
              {xmas ? (
                <>
                  <SnowEdge />
                  <PineBranch size={64} flip style={{ position: 'absolute', right: -6, top: -12 }} />
                </>
              ) : null}
              <View className="w-11 h-11 rounded-2xl bg-[#E8F1F8] items-center justify-center mt-0.5 dark:bg-darkBg">
                <Target color={colors.primary} size={20} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900 mb-0.5 dark:text-darkInk">
                  Mục tiêu: {currentUser?.target_goal || 'IELTS 6.5'}
                </Text>
                <Text className="text-xs text-gray-500 mb-2.5 dark:text-darkMuted">
                  Còn 4 tháng - Trình độ hiện tại: {currentUser?.cefr_level || 'B1'}
                </Text>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden dark:bg-darkBg">
                  <Animated.View style={[{ height: '100%', backgroundColor: xmas ? '#FBBF24' : colors.secondary, borderRadius: 4 }, animatedProgressStyle]} />
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-bold text-gray-900 dark:text-darkInk" style={xmas ? { color: '#FDE68A' } : undefined}>Huy hiệu của tôi</Text>
            </View>
            <View className="flex-row gap-2">
              {BADGES.map((badge) => {
                const BadgeIcon = badge.icon;
                return (
                  <View
                    key={badge.label}
                    className="flex-1 bg-white rounded-2xl border border-gray-100 py-3 items-center gap-1.5 dark:bg-darkCard dark:border-darkLine"
                    style={xmas ? { backgroundColor: 'rgba(48,37,31,0.92)', borderColor: `${badge.color}88`, shadowColor: badge.color, shadowOpacity: 0.5, shadowRadius: 8 } : undefined}
                  >
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: badge.bg, alignItems: 'center', justifyContent: 'center' }}>
                      <BadgeIcon color={badge.color} size={20} strokeWidth={2} />
                    </View>
                    <Text className="text-[10px] font-bold text-gray-800 text-center dark:text-darkInk">{badge.label}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450).duration(400)}>
            <View className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-2 dark:bg-darkCard dark:border-darkLine" style={glass}>
              {xmas ? <SnowEdge /> : null}
              <Pressable onPress={() => router.push('/(student)/profile/edit' as any)} className={`p-4 flex-row justify-between items-center border-b border-gray-100 bg-sky-50/30 dark:border-darkLine dark:bg-transparent ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-gray-50'}`}>
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-2xl justify-center items-center" style={{ backgroundColor: 'rgba(13,59,115,0.1)' }}>
                    <User color={xmas ? '#93C5FD' : '#0D3B73'} size={18} />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-neutralInk dark:text-darkInk">Hồ sơ của tôi</Text>
                    <Text className="text-[11px] text-gray-500 font-medium dark:text-darkMuted">Chỉnh sửa thông tin cá nhân</Text>
                  </View>
                </View>
                <ChevronRight color={dk('#94A3B8', 'text')} size={18} />
              </Pressable>

              {canUseCommunity && (
                <Pressable onPress={() => router.push('/(student)/feed' as any)} className={`p-4 flex-row justify-between items-center border-b border-gray-100 dark:border-darkLine ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-gray-50'}`}>
                  <View className="flex-row items-center gap-3">
                    <Globe color="#0EA5E9" size={20} />
                    <Text className="text-sm font-bold text-neutralInk dark:text-darkInk">Cộng đồng học viên</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <View className="bg-[#E0F2FE] px-2 py-0.5 rounded-full dark:bg-darkBg">
                      <Text className="text-[10px] font-bold text-[#0EA5E9]">Mới</Text>
                    </View>
                    <ChevronRight color={dk('#94A3B8', 'text')} size={18} />
                  </View>
                </Pressable>
              )}

              {canJoinClass && (
                <Pressable onPress={() => router.push('/(student)/classes' as any)} className={`p-4 flex-row justify-between items-center border-b border-gray-100 dark:border-darkLine ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-gray-50'}`}>
                  <View className="flex-row items-center gap-3">
                    <GraduationCap color={menuIcon} size={20} />
                    <Text className="text-sm font-semibold text-neutralInk dark:text-darkInk">Lớp học của tôi</Text>
                  </View>
                  <ChevronRight color={dk('#94A3B8', 'text')} size={18} />
                </Pressable>
              )}

              <Pressable onPress={() => setIsInvoicesModalOpen(true)} className={`p-4 flex-row justify-between items-center border-b border-gray-100 dark:border-darkLine ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-gray-50'}`}>
                <View className="flex-row items-center gap-3">
                  <Receipt color={menuIcon} size={20} />
                  <Text className="text-sm font-semibold text-neutralInk dark:text-darkInk">Lịch sử giao dịch & Hóa đơn</Text>
                </View>
                <ChevronRight color={dk('#94A3B8', 'text')} size={18} />
              </Pressable>

              <Pressable onPress={() => router.push('/(student)/notifications' as any)} className={`p-4 flex-row justify-between items-center border-b border-gray-100 dark:border-darkLine ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-gray-50'}`}>
                <View className="flex-row items-center gap-3">
                  <Bell color={menuIcon} size={20} />
                  <Text className="text-sm font-semibold text-neutralInk dark:text-darkInk">Thông báo</Text>
                </View>
                <ChevronRight color={dk('#94A3B8', 'text')} size={18} />
              </Pressable>

              <Pressable onPress={() => router.push('/(student)/profile/settings' as any)} className={`p-4 flex-row justify-between items-center border-b border-gray-100 dark:border-darkLine ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-gray-50'}`}>
                <View className="flex-row items-center gap-3">
                  <Mic color={menuIcon} size={20} />
                  <Text className="text-sm font-semibold text-neutralInk dark:text-darkInk">Giọng đọc TTS</Text>
                </View>
                <ChevronRight color={dk('#94A3B8', 'text')} size={18} />
              </Pressable>

              <Pressable onPress={() => router.push('/(student)/profile/settings' as any)} className={`p-4 flex-row justify-between items-center border-b border-gray-100 dark:border-darkLine ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-gray-50'}`}>
                <View className="flex-row items-center gap-3">
                  <Palette color={menuIcon} size={20} />
                  <Text className="text-sm font-semibold text-neutralInk dark:text-darkInk">Giao diện (Sáng/Tối)</Text>
                </View>
                <ChevronRight color={dk('#94A3B8', 'text')} size={18} />
              </Pressable>

              <Pressable onPress={() => router.push('/(student)/profile/settings' as any)} className={`p-4 flex-row justify-between items-center border-b border-gray-100 dark:border-darkLine ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-gray-50'}`}>
                <View className="flex-row items-center gap-3">
                  <Globe color={menuIcon} size={20} />
                  <Text className="text-sm font-semibold text-neutralInk dark:text-darkInk">Ngôn ngữ</Text>
                </View>
                <ChevronRight color={dk('#94A3B8', 'text')} size={18} />
              </Pressable>

              <Pressable onPress={() => router.push('/(student)/profile/settings' as any)} className={`p-4 flex-row justify-between items-center ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-gray-50'}`}>
                <View className="flex-row items-center gap-3">
                  <Download color={menuIcon} size={20} />
                  <Text className="text-sm font-semibold text-neutralInk dark:text-darkInk">Xuất dữ liệu</Text>
                </View>
                <ChevronRight color={dk('#94A3B8', 'text')} size={18} />
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(550).duration(400)}>
            <Pressable
              onPress={handleLogout}
              className={`bg-red-50 p-4 rounded-2xl border border-red-100 flex-row items-center gap-2.5 dark:bg-darkRaised ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-red-100'}`}
            >
              <LogOut color={colors.danger} size={20} strokeWidth={1.8} />
              <Text className="text-sm font-bold text-red-500">Đăng xuất</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
      <StudentInvoicesModal
        visible={isInvoicesModalOpen}
        onClose={() => setIsInvoicesModalOpen(false)}
      />
    </ScrollView>
    </View>
  );
};
