import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Coins,
  Flame,
  Layers,
  LogIn,
  MessageSquare,
  Play,
  ScanText,
  Zap,
} from '@/src/components/ds/icons';
import { Reveal, Tap, dsText } from '@/src/components/ds';
import { ds, dsFont, dsRadius, dsShadow, dsSize } from '@/src/theme/ds';
import { useAuthStore } from '@/src/core/flows/authStore';
import { useRoleGateStore } from '@/src/core/flows/roleGateStore';
import { LoxeraFoxMascot } from '@/src/core/components/LoxeraFoxMascot';
import { UserAvatar } from '@/src/core/components/UserAvatar';
import { useMyDecksQuery } from '@/src/features/flashcard-srs/application/useFlashcardSrs';
import { useUserStatsQuery } from '../../application/useDashboard';
import { DailyQuestList } from '../components/DailyQuestList';
import { WordOfDayCard } from '../components/WordOfDayCard';

type IconType = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface QuickAction {
  key: string;
  label: string;
  hint: string;
  icon: IconType;
  tint: string;
  tone: string;
  route: string | { pathname: string; params: Record<string, string> };
  visible: boolean;
}

const greetingOf = (hour: number) => (hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối');

export const HomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, userStats, setUserStats } = useAuthStore();
  const { hasPermission, syncRolePermissions, guestMode } = useRoleGateStore();
  const isLoggedIn = !!currentUser && !guestMode;

  useEffect(() => {
    syncRolePermissions();
  }, [syncRolePermissions]);

  const { data: realStats } = useUserStatsQuery(isLoggedIn ? String(currentUser?.id) : '');
  useEffect(() => {
    if (realStats) setUserStats(realStats);
  }, [realStats, setUserStats]);
  const stats = realStats ?? userStats;

  const { data: myDecks } = useMyDecksQuery(isLoggedIn);
  const continueDeck = isLoggedIn ? (myDecks ?? []).find((d) => (d.cardCount ?? 0) > 0) : undefined;

  const actions: QuickAction[] = [
    {
      key: 'flashcard',
      label: 'Flashcard',
      hint: 'Ôn lặp ngắt quãng',
      icon: Layers,
      tint: ds.btn,
      tone: ds.skySoft,
      route: '/(student)/review',
      visible: hasPermission('learn_flashcard'),
    },
    {
      key: 'chat',
      label: 'Hội thoại AI',
      hint: 'Nói chuyện với gia sư',
      icon: MessageSquare,
      tint: ds.green,
      tone: ds.greenSoft,
      route: '/(student)/assistant',
      visible: hasPermission('access_ai_tools'),
    },
    {
      key: 'scan',
      label: 'Quét ảnh',
      hint: 'Học từ vật xung quanh',
      icon: ScanText,
      tint: ds.amberText,
      tone: ds.amberSoft,
      route: '/(student)/practice/scan',
      visible: hasPermission('use_ai_scan'),
    },
    {
      key: 'quiz',
      label: 'Kiểm tra',
      hint: 'Đề luyện và thi thử',
      icon: BrainCircuit,
      tint: ds.ink,
      tone: ds.line,
      route: { pathname: '/(student)/learn', params: { tab: 'quiz' } },
      visible: hasPermission('take_quiz_exam'),
    },
  ].filter((a) => a.visible);

  const go = (route: QuickAction['route']) => router.push(route as never);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: (insets.top || 16) + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Reveal delay={0}>
        <View style={s.header}>
          <Pressable onPress={() => go(isLoggedIn ? '/(student)/profile' : '/(auth)/login')} style={s.headerLeft}>
            <View style={s.avatarRing}>
              <UserAvatar uri={currentUser?.avatar_url} size={44} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>{greetingOf(new Date().getHours())}</Text>
              <Text style={s.name} numberOfLines={1}>
                {isLoggedIn ? currentUser?.display_name || 'Học viên' : 'Khách'}
              </Text>
            </View>
          </Pressable>
          {isLoggedIn ? (
            <Tap onPress={() => go('/(student)/notifications')} style={s.bellBtn} accessibilityLabel="Thông báo">
              <Bell size={22} color={ds.ink} />
            </Tap>
          ) : null}
        </View>
      </Reveal>

      {/* Chỉ số học tập */}
      <Reveal delay={60}>
        {isLoggedIn ? (
          <View style={s.statsRow}>
            <StatChip
              icon={<WobbleFlame />}
              tone={ds.amberSoft}
              value={`${stats?.streak_current ?? 0}`}
              label="ngày streak"
            />
            <StatChip
              icon={<Zap size={22} color={ds.btn} />}
              tone={ds.skySoft}
              value={(stats?.xp_total ?? 0).toLocaleString('vi-VN')}
              label="tổng XP"
            />
            <StatChip
              icon={<Coins size={22} color={ds.amberText} />}
              tone={ds.amberSoft}
              value={(stats?.coins ?? 0).toLocaleString('vi-VN')}
              label="xu"
            />
          </View>
        ) : (
          <Tap onPress={() => go('/(auth)/login')} style={s.loginCard} scaleTo={0.98}>
            <View style={s.loginIcon}>
              <LogIn size={22} color={ds.btn} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.loginTitle}>Đăng nhập để lưu tiến độ</Text>
              <Text style={s.loginSub}>Streak, XP và nhiệm vụ hằng ngày chỉ có khi đăng nhập</Text>
            </View>
            <ChevronRight size={20} color={ds.faint} />
          </Tap>
        )}
      </Reveal>

      {/* Thẻ tiếp tục học */}
      <Reveal delay={120}>
        <Tap
          onPress={() => go(continueDeck ? `/(student)/review/decks/${continueDeck.id}/study` : '/(student)/review')}
          style={s.hero}
          scaleTo={0.98}
        >
          <View style={[s.heroDot, { width: 180, height: 180, right: -60, top: -70 }]} />
          <View style={[s.heroDot, { width: 90, height: 90, right: 70, bottom: -50 }]} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={s.heroTag}>{continueDeck ? 'Tiếp tục học' : 'Bắt đầu hôm nay'}</Text>
            <Text style={s.heroTitle} numberOfLines={2}>
              {continueDeck ? continueDeck.name : 'Ôn từ vựng với Flashcard'}
            </Text>
            <Text style={s.heroSub}>
              {continueDeck ? `${continueDeck.cardCount} thẻ trong bộ` : 'Chọn bộ thẻ phù hợp với trình độ của bạn'}
            </Text>
            <View style={s.heroCtaWrap}>
              <View style={s.heroCtaEdge} />
              <View style={s.heroCta}>
                <Play size={16} color={ds.ink} fill={ds.ink} />
                <Text style={s.heroCtaText}>{continueDeck ? 'Học tiếp' : 'Khám phá'}</Text>
              </View>
            </View>
          </View>
          <LoxeraFoxMascot size={92} showGlow={false} showBook={false} animated />
        </Tap>
      </Reveal>

      {/* Lối tắt tính năng */}
      {actions.length > 0 ? (
        <Reveal delay={180} style={s.section}>
          <Text style={dsText.h2}>Luyện tập</Text>
          <View style={s.grid}>
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <Tap key={a.key} onPress={() => go(a.route)} style={s.actionTile}>
                  <View style={[s.actionIcon, { backgroundColor: a.tone }]}>
                    <Icon size={24} color={a.tint} />
                  </View>
                  <View style={{ gap: 2 }}>
                    <Text style={s.actionLabel} numberOfLines={1}>
                      {a.label}
                    </Text>
                    <Text style={s.actionHint} numberOfLines={1}>
                      {a.hint}
                    </Text>
                  </View>
                </Tap>
              );
            })}
          </View>
        </Reveal>
      ) : null}

      {/* Nhiệm vụ hằng ngày */}
      {isLoggedIn ? (
        <Reveal delay={240} style={s.section}>
          <View style={s.sectionRow}>
            <Text style={dsText.h2}>Nhiệm vụ hôm nay</Text>
            <Pressable onPress={() => go('/(student)/daily-challenge')} hitSlop={8}>
              <Text style={s.seeAll}>Xem tất cả</Text>
            </Pressable>
          </View>
          <DailyQuestList limit={3} />
        </Reveal>
      ) : null}

      {/* Từ vựng hôm nay */}
      <Reveal delay={300} style={s.section}>
        <WordOfDayCard />
      </Reveal>

      {/* Lộ trình */}
      <Reveal delay={340}>
        <Tap onPress={() => go('/(student)/learn')} style={s.pathRow} scaleTo={0.98}>
          <View style={[s.actionIcon, { backgroundColor: ds.skySoft }]}>
            <BookOpen size={22} color={ds.btn} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.actionLabel}>Lộ trình học</Text>
            <Text style={s.actionHint}>Bài học, luyện nói và đề kiểm tra</Text>
          </View>
          <ChevronRight size={20} color={ds.faint} />
        </Tap>
      </Reveal>
    </ScrollView>
  );
};

/** Ngọn lửa streak lay nhẹ */
const WobbleFlame: React.FC = () => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View
      style={{
        transform: [
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] }) },
          { scale: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.08, 1] }) },
        ],
      }}
    >
      <Flame size={22} color={ds.amberDeep} />
    </Animated.View>
  );
};

const StatChip: React.FC<{ icon: React.ReactNode; tone: string; value: string; label: string }> = ({ icon, tone, value, label }) => (
  <View style={s.statChip}>
    <View style={[s.statIcon, { backgroundColor: tone }]}>{icon}</View>
    <View style={{ flexShrink: 1 }}>
      <Text style={s.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={s.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  </View>
);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  content: { paddingHorizontal: 20, paddingBottom: 48, gap: 18, maxWidth: 600, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarRing: { padding: 2, borderRadius: 26, borderWidth: 2, borderColor: ds.sky },
  greeting: { fontFamily: dsFont.medium, fontSize: dsSize.sm, color: ds.muted },
  name: { fontFamily: dsFont.display, fontSize: dsSize.lg, color: ds.ink, letterSpacing: -0.2 },
  bellBtn: {
    width: 46,
    height: 46,
    borderRadius: dsRadius.md,
    backgroundColor: ds.card,
    borderWidth: 1.5,
    borderColor: ds.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ds.card,
    borderRadius: dsRadius.md,
    borderWidth: 1.5,
    borderColor: ds.line,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  statIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: dsFont.displayHeavy, fontSize: dsSize.md, color: ds.ink },
  statLabel: { fontFamily: dsFont.medium, fontSize: 11, color: ds.muted },
  loginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ds.card,
    borderRadius: dsRadius.lg,
    borderWidth: 1.5,
    borderColor: ds.line,
    padding: 14,
  },
  loginIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: ds.skySoft, alignItems: 'center', justifyContent: 'center' },
  loginTitle: { fontFamily: dsFont.bold, fontSize: dsSize.base, color: ds.ink },
  loginSub: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted, marginTop: 2 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 8,
    borderRadius: dsRadius.xl,
    backgroundColor: ds.ink,
    overflow: 'hidden',
    ...dsShadow.lift,
  },
  heroDot: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(14,165,233,0.18)' },
  heroTag: { fontFamily: dsFont.bold, fontSize: dsSize.xs, color: ds.skyLight, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { fontFamily: dsFont.displayHeavy, fontSize: dsSize.xl, color: ds.white, letterSpacing: -0.4 },
  heroSub: { fontFamily: dsFont.body, fontSize: dsSize.sm, color: ds.onInk },
  heroCtaWrap: { alignSelf: 'flex-start', marginTop: 8, height: 44 },
  heroCtaEdge: { position: 'absolute', left: 0, right: 0, top: 4, height: 40, borderRadius: 13, backgroundColor: ds.amberDeep },
  heroCta: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ds.amber,
    borderRadius: 13,
    paddingHorizontal: 16,
  },
  heroCtaText: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.ink },
  section: { gap: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAll: { fontFamily: dsFont.semibold, fontSize: dsSize.sm, color: ds.btn },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionTile: {
    flexGrow: 1,
    flexBasis: '46%',
    gap: 12,
    backgroundColor: ds.card,
    borderRadius: dsRadius.lg,
    borderWidth: 1.5,
    borderColor: ds.line,
    borderBottomWidth: 4,
    padding: 14,
  },
  actionIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: dsFont.bold, fontSize: dsSize.base, color: ds.ink },
  actionHint: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ds.card,
    borderRadius: dsRadius.lg,
    borderWidth: 1.5,
    borderColor: ds.line,
    borderBottomWidth: 4,
    padding: 14,
  },
});
