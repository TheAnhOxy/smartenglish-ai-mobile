import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
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
  GraduationCap,
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

  const progressWidth = useSharedValue(0);
  useEffect(() => {
    progressWidth.value = withTiming(45, { duration: 1200 });
  }, []);
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
            </View>
          </View>

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
              onPress={() => alert('Chỉnh sửa thông tin cá nhân...')}
              style={s.heroActionBtn}
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
