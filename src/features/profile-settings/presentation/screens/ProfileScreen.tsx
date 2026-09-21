<<<<<<< HEAD
import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
=======
import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
>>>>>>> f37f8517a898417072d6c4330feeb6bc3c7ceabc
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
<<<<<<< HEAD
  Flame,
  BookOpen,
  Trophy,
=======
  User,
>>>>>>> f37f8517a898417072d6c4330feeb6bc3c7ceabc
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/core/flows/authStore';
<<<<<<< HEAD
import { colors } from '@/src/theme/colors';

const MENU_ITEMS = [
  { icon: GraduationCap, label: 'Lớp Học Của Tôi', route: '/(student)/classes' },
  { icon: Bell, label: 'Thông báo', route: '/(student)/notifications' },
  { icon: Mic, label: 'Giọng đọc TTS', route: '/(student)/profile/settings' },
  { icon: Palette, label: 'Giao diện (Light/Dark)', route: '/(student)/profile/settings' },
  { icon: Globe, label: 'Ngôn ngữ', route: '/(student)/profile/settings' },
  { icon: Download, label: 'Xuất dữ liệu', route: '/(student)/profile/settings' },
] as const;

const BADGES = [
  { icon: Flame, label: 'Người lửa', color: colors.streak, bg: colors.streakSoft },
  { icon: BookOpen, label: 'Mọt sách', color: colors.primary, bg: colors.primarySoft },
  { icon: Mic, label: 'Xưởng ngôn', color: colors.secondary, bg: colors.secondarySoft },
  { icon: Trophy, label: 'Vô địch', color: colors.xpDeep, bg: colors.xpSoft },
];

export const ProfileScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, logout, userStats } = useAuthStore();
=======
import { getProfileApi } from '@/src/features/profile-settings/data/profileApi';

export const ProfileScreen = () => {
  const router = useRouter();
  const { currentUser, logout, userStats, updateCurrentUser } = useAuthStore();
>>>>>>> f37f8517a898417072d6c4330feeb6bc3c7ceabc

  const progressWidth = useSharedValue(0);
  useEffect(() => {
    progressWidth.value = withTiming(45, { duration: 1200 });
  }, []);
<<<<<<< HEAD
=======

  // Refresh profile from Neon backend whenever screen gains focus
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
        } catch (e) {
          // Silent fallback to cached store
        }
      };
      fetchLatestProfile();
      return () => {
        isMounted = false;
      };
    }, [currentUser?.id])
  );

>>>>>>> f37f8517a898417072d6c4330feeb6bc3c7ceabc
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
<<<<<<< HEAD
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header — Navy deep */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[s.hero, { paddingTop: safeTop }]}
      >
        {/* User Row */}
        <View style={s.userRow}>
          <View style={s.avatarWrap}>
            <Image
              source={{
                uri: currentUser?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
              }}
              style={s.avatar}
            />
            <View style={s.verifiedBadge}>
              <CheckCircle2 color="#FFFFFF" size={10} strokeWidth={3} />
=======
    <ScrollView className="flex-1 bg-[#F8FAFC]" showsVerticalScrollIndicator={false}>
      <View className="w-full max-w-xl mx-auto">
        {/* Top Dark Hero Curved Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="bg-gradient-to-b from-[#0F172A] to-[#0D3B73] pt-14 px-6 pb-8 rounded-b-3xl shadow-xl relative"
        >
        {/* User Info Row */}
        <View className="flex-row justify-between items-center mb-6">
          <Pressable
            onPress={() => router.push('/(student)/profile/edit' as any)}
            className="flex-row items-center gap-4 flex-1 mr-2"
          >
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
            <View className="flex-1">
              <Text className="text-xl font-bold text-white mb-1" numberOfLines={1}>
                {currentUser?.display_name || 'Nguyễn Minh'}
              </Text>
              <View className="bg-white/15 px-3 py-1 rounded-full border border-white/20 self-start">
                <Text className="text-xs font-semibold text-gray-200">Level {userStats?.level ?? 1} — Scholar 🎓</Text>
              </View>
>>>>>>> f37f8517a898417072d6c4330feeb6bc3c7ceabc
            </View>
          </Pressable>

          <View style={s.userInfo}>
            <Text style={s.userName}>
              {currentUser?.display_name || 'Nguyễn Minh'}
            </Text>
            <View style={s.levelBadge}>
              <Text style={s.levelBadgeText}>
                Level {userStats?.level ?? 1} — Scholar
              </Text>
            </View>
          </View>

          <View style={s.heroActions}>
            <Pressable
              onPress={() => router.push('/(student)/profile/settings' as any)}
              style={s.heroActionBtn}
            >
              <Settings color="#FFFFFF" size={17} strokeWidth={1.8} />
            </Pressable>
            <Pressable
<<<<<<< HEAD
              onPress={() => alert('Chỉnh sửa thông tin cá nhân...')}
              style={s.heroActionBtn}
=======
              onPress={() => router.push('/(student)/profile/edit' as any)}
              className="w-10 h-10 rounded-xl bg-white/15 justify-center items-center border border-white/20 active:bg-white/25"
>>>>>>> f37f8517a898417072d6c4330feeb6bc3c7ceabc
            >
              <Pencil color="#FFFFFF" size={17} strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          {stats.map((item, i) => (
            <React.Fragment key={item.label}>
              <View style={s.statCell}>
                <Text style={s.statValue}>{item.value}</Text>
                <Text style={s.statLabel}>{item.label}</Text>
              </View>
              {i < stats.length - 1 && <View style={s.statDivider} />}
            </React.Fragment>
          ))}
        </View>
      </Animated.View>

      {/* Body */}
      <View style={s.body}>
        {/* Premium Card */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <View style={s.premiumCard}>
            <View style={s.premiumIconWrap}>
              <Star color={colors.xp} size={22} fill={colors.xp} strokeWidth={1.5} />
            </View>
            <View style={s.premiumInfo}>
              <Text style={s.premiumOverline}>Gói hiện tại</Text>
              <Text style={s.premiumTitle}>
                {currentUser?.plan === 'premium_yearly' ? 'Premium Yearly' : 'Premium Monthly'}
              </Text>
              <Text style={s.premiumExpiry}>Hết hạn: 24 Th09, 2026</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(student)/profile/premium' as any)}
              style={s.premiumBtn}
            >
              <Text style={s.premiumBtnText}>Quản lý gói</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Goal Card */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <View style={s.goalCard}>
            <View style={s.goalIconWrap}>
              <Target color={colors.primary} size={20} strokeWidth={2} />
            </View>
            <View style={s.goalInfo}>
              <Text style={s.goalTitle}>
                Mục tiêu: {currentUser?.target_goal || 'IELTS 6.5'}
              </Text>
              <Text style={s.goalSub}>
                Còn 4 tháng • Trình độ hiện tại: {currentUser?.cefr_level || 'B1'}
              </Text>
              <View style={s.progressTrack}>
                <Animated.View style={[s.progressFill, animatedProgressStyle]} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Badges */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} style={s.badgesSection}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Huy hiệu của tôi</Text>
            <Pressable>
              <Text style={s.sectionLink}>Tất cả</Text>
            </Pressable>
          </View>
          <View style={s.badgesRow}>
            {BADGES.map((badge) => {
              const BadgeIcon = badge.icon;
              return (
                <View key={badge.label} style={s.badgeCard}>
                  <View style={[s.badgeEmojiWrap, { backgroundColor: badge.bg }]}>
                    <BadgeIcon color={badge.color} size={20} strokeWidth={2} />
                  </View>
                  <Text style={s.badgeLabel}>{badge.label}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Menu List */}
        <Animated.View entering={FadeInDown.delay(450).duration(400)}>
<<<<<<< HEAD
          <View style={s.menuCard}>
            {MENU_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.route as any)}
                  style={({ pressed }) => [
                    s.menuRow,
                    i < MENU_ITEMS.length - 1 && s.menuRowBorder,
                    pressed && { backgroundColor: colors.surfaceMuted },
                  ]}
                >
                  <View style={s.menuLeft}>
                    <Icon color={colors.textSoft} size={20} strokeWidth={1.8} />
                    <Text style={s.menuLabel}>{item.label}</Text>
                  </View>
                  <ChevronRight color={colors.textFaint} size={18} strokeWidth={1.8} />
                </Pressable>
              );
            })}
=======
          <View className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            {/* My Profile Entry */}
            <Pressable
              onPress={() => router.push('/(student)/profile/edit' as any)}
              className="p-4 flex-row justify-between items-center border-b border-gray-100 active:bg-gray-50 bg-sky-50/30"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-2xl bg-[#0D3B73]/10 justify-center items-center">
                  <User color="#0D3B73" size={18} />
                </View>
                <View>
                  <Text className="text-sm font-bold text-neutralInk">Hồ sơ của tôi</Text>
                  <Text className="text-[11px] text-gray-500 font-medium">Chỉnh sửa thông tin cá nhân & đổi ảnh đại diện</Text>
                </View>
              </View>
              <ChevronRight color="#94A3B8" size={18} />
            </Pressable>

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
>>>>>>> f37f8517a898417072d6c4330feeb6bc3c7ceabc
          </View>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(550).duration(400)}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [s.logoutBtn, pressed && { backgroundColor: colors.dangerSoft }]}
          >
            <LogOut color={colors.danger} size={20} strokeWidth={1.8} />
            <Text style={s.logoutText}>Đăng xuất</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  </ScrollView>
);
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // ── Hero ──────────────────────────────────────────────────────────
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 8,
  },
  heroActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  statCell: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  // ── Body ──────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
  },
  // Premium Card
  premiumCard: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  premiumIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  premiumInfo: {
    flex: 1,
  },
  premiumOverline: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  premiumTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  premiumExpiry: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  premiumBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  premiumBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Goal Card
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  goalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  goalSub: {
    fontSize: 12,
    color: colors.textSoft,
    marginBottom: 10,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 4,
  },
  // Badges
  badgesSection: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  badgeEmojiWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 20,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  // Menu
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  // Logout
  logoutBtn: {
    backgroundColor: colors.dangerSoft,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(225, 84, 63, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
});
