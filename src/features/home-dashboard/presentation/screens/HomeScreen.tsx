import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, PenLine, School, Search, Users } from 'lucide-react-native';
import { subscribeTopic } from '@/src/core/realtime/stompClient';
import { fetchUserConversationsApi } from '@/src/features/social-feed/data/socialApi';
import { fetchUnreadNotificationCountApi } from '@/src/features/notifications/data/notificationApi';
import {
  Bell,
  BookOpen,
  FileText,
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
import { UserAvatar } from '@/src/core/components/UserAvatar';
import { decksKeys, useMyDecksQuery } from '@/src/features/flashcard-srs/application/useFlashcardSrs';
import { fetchDeckDueCardsApi } from '@/src/features/flashcard-srs/data/deckApi';
import { usePlacementStatusQuery } from '@/src/features/onboarding/application/usePlacementStatus';
import { QuickWordLookupModal } from '@/src/features/flashcard-srs/presentation/screens/QuickWordLookupModal';
import { useUserStatsQuery } from '../../application/useDashboard';
import { DailyQuestList } from '../components/DailyQuestList';
import { WordOfDayCard } from '../components/WordOfDayCard';
import { LearningPlanCards } from '../components/LearningPlanCards';
import { AiScanFeatureCard } from '../components/AiScanFeatureCard';
import { ThinkingFox } from '../components/ThinkingFox';
import { NEON, NeonText } from '@/src/components/neon/Neon';
import { Garland } from '@/src/components/xmas/XmasArt';
import { WinterHeroScene, XmasGreeting } from '../components/WinterHome';
import { ThemeToggle } from '@/src/core/components/ThemeToggle';
import RA, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { WinterBackdrop } from '@/src/features/learning-path/presentation/winter/WinterBackdrop';
import { Lantern, Reindeer, SantaHat } from '@/src/features/learning-path/presentation/winter/WinterArt';
import { Snowman } from '@/src/components/xmas/XmasArt';
import { PineBranch, ShimmerSweep, SnowCorner, SnowEdge, SparkleRing, XMAS, glassCard } from '@/src/components/xmas/WinterUI';
import { LinearGradient } from 'expo-linear-gradient';
import { useXmasActive } from '@/src/core/services/xmas';
import { TeacherCoursesShowcase } from '@/src/features/learning-path/presentation/components/TeacherCoursesShowcase';

type IconType = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface QuickAction {
  key: string;
  label: string;
  hint?: string;
  icon: IconType;
  tint?: string;
  tone?: string;
  route: string | { pathname: string; params: Record<string, string> };
  visible: boolean;
}

const greetingOf = (hour: number) => (hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối');

export const HomeScreen = () => {
  const xmas = useXmasActive();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const { width: windowWidth } = useWindowDimensions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, userStats, setUserStats } = useAuthStore();
  const { hasPermission, syncRolePermissions, guestMode, exitGuestMode } = useRoleGateStore();
  const isLoggedIn = !!currentUser && !guestMode;
  const [lookupOpen, setLookupOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  // Có tin nhắn mới qua WebSocket → cập nhật chấm đỏ ngay, không chờ lượt hỏi kế tiếp
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) return undefined;
    return subscribeTopic(`/topic/user/${currentUser.id}`, () => {
      queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
    });
  }, [isLoggedIn, currentUser?.id, queryClient]);

  // Tổng tin nhắn chưa đọc → chấm đỏ trên lối tắt Cộng đồng
  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['unread-messages', currentUser?.id],
    queryFn: async () => {
      const conversations = await fetchUserConversationsApi();
      return conversations.reduce((sum, c) => sum + (Number(c.unreadCount) || 0), 0);
    },
    enabled: isLoggedIn && isFocused,
    refetchInterval: isFocused ? 15000 : false,
  });

  // Khoá bắt đầu bằng 'notifications' → tự làm mới khi có thông báo mới hoặc khi đánh dấu đã đọc
  const { data: unreadNotifications = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count', currentUser?.id],
    queryFn: fetchUnreadNotificationCountApi,
    enabled: isLoggedIn && isFocused,
    refetchInterval: isFocused ? 15000 : false,
  });

  // Thẻ đến hạn ôn hôm nay (SM-2) và trạng thái bài kiểm tra đầu vào
  const { data: dueSession, refetch: refetchDue } = useQuery({
    queryKey: decksKeys.dueCards(),
    queryFn: () => fetchDeckDueCardsApi(),
    enabled: isLoggedIn,
    staleTime: 30_000,
  });
  const dueToday = isLoggedIn ? dueSession?.totalDue ?? 0 : 0;
  const { data: placement, refetch: refetchPlacement } = usePlacementStatusQuery(isLoggedIn ? currentUser?.id : null, isLoggedIn);
  const needsPlacement = !isLoggedIn || (placement != null && !placement.completed);
  useFocusEffect(
    React.useCallback(() => {
      if (!isLoggedIn) return;
      void refetchDue();
      void refetchPlacement();
    }, [isLoggedIn, refetchDue, refetchPlacement])
  );

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
      label: 'Thẻ từ vựng',
      hint: 'Ôn đúng lúc sắp quên',
      icon: Layers,
      tint: ds.btn,
      tone: ds.skySoft,
      route: '/(student)/review',
      visible: hasPermission('learn_flashcard'),
    },
    {
      key: 'chat',
      label: 'Trò chuyện AI',
      hint: 'Nói chuyện với gia sư',
      icon: MessageSquare,
      tint: ds.green,
      tone: ds.greenSoft,
      route: '/(student)/assistant',
      visible: hasPermission('access_ai_tools'),
    },
    {
      key: 'scan',
      label: 'Quét ảnh AI',
      hint: 'Chụp đồ vật, học từ vựng',
      icon: ScanText,
      tint: ds.amberText,
      tone: ds.amberSoft,
      route: '/(student)/practice/scan',
      visible: hasPermission('use_ai_scan'),
    },
    {
      key: 'quiz',
      label: 'Luyện đề',
      hint: 'Đề luyện và thi thử',
      icon: FileText,
      tint: ds.amberText,
      tone: ds.amberSoft,
      route: { pathname: '/(student)/learn', params: { tab: 'quiz' } },
      visible: hasPermission('take_quiz_exam'),
    },
  ].filter((a) => a.visible);

  // Quét ảnh AI được làm nổi bật bằng thẻ riêng, các mục còn lại xếp thành ô
  const scanAction = actions.find((a) => a.key === 'scan');
  const practiceTiles = actions.filter((a) => a.key !== 'scan');

  const connectActions: QuickAction[] = [
    {
      key: 'classes',
      label: 'Lớp học',
      hint: 'Bài tập của giáo viên',
      icon: School,
      tint: ds.btn,
      tone: ds.skySoft,
      route: '/(student)/classes',
      visible: isLoggedIn && hasPermission('join_class_submit'),
    },
    {
      key: 'community',
      label: 'Cộng đồng',
      hint: 'Bạn học và tin nhắn',
      icon: Users,
      tint: ds.green,
      tone: ds.greenSoft,
      route: '/(student)/feed',
      visible: isLoggedIn && hasPermission('use_community'),
    },
  ].filter((a) => a.visible);

  const go = (route: QuickAction['route']) => router.push(route as never);
  // Phải thoát chế độ khách trước, nếu không layout gốc sẽ đẩy khách từ màn đăng nhập về lại trang chủ
  const goLogin = () => {
    exitGuestMode();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[{ flex: 1 }, xmas && { backgroundColor: XMAS.midnight }]}>
    {/* Nền đêm mùa đông: trời, cực quang, sao, núi + rừng thông (parallax khi cuộn) */}
    {xmas ? <WinterBackdrop scrollY={scrollY} showMoon={false} /> : null}
    <RA.ScrollView
      style={[s.root, xmas && { backgroundColor: 'transparent' }]}
      contentContainerStyle={[s.content, { paddingTop: (insets.top || 16) + 8 }]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {/* Dây đèn Giáng sinh */}
      {xmas ? (
        <View style={{ marginTop: -6, marginBottom: 2 }}>
          <Garland width={Math.min(windowWidth, 600) - 40} />
          <PineBranch size={64} style={{ position: 'absolute', left: -22, top: -10 }} />
          <PineBranch size={64} flip style={{ position: 'absolute', right: -22, top: -10 }} />
        </View>
      ) : null}

      {/* Header */}
      <Reveal delay={0}>
        <View style={s.header}>
          <Pressable onPress={() => (isLoggedIn ? go('/(student)/profile') : goLogin())} style={s.headerLeft}>
            <View>
              <View style={[s.avatarRing, xmas && { borderColor: XMAS.gold, shadowColor: XMAS.gold, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }]}>
                <UserAvatar uri={currentUser?.avatar_url} size={44} />
              </View>
              {xmas ? (
                <>
                  <SparkleRing size={52} />
                  <SantaHat size={26} style={{ position: 'absolute', top: -15, right: -9, transform: [{ rotate: '22deg' }] }} />
                </>
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>{greetingOf(new Date().getHours())}</Text>
              <Text style={s.name} numberOfLines={1}>
                {isLoggedIn ? currentUser?.display_name || 'Học viên' : 'Khách'}
              </Text>
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ThemeToggle style={{ width: 46, height: 46, borderRadius: 16 }} />
            <Tap onPress={() => setLookupOpen(true)} style={[s.bellBtn, xmas && glassCard()]} accessibilityLabel="Tra từ vựng">
              <Search size={22} color={ds.ink} />
            </Tap>
            {isLoggedIn ? (
              <Tap onPress={() => go('/(student)/notifications')} style={[s.bellBtn, xmas && glassCard()]} accessibilityLabel="Thông báo">
                <Bell size={22} color={ds.ink} />
                {unreadNotifications > 0 ? (
                  <View style={s.unreadBadge} accessibilityLabel={`${unreadNotifications} thông báo chưa đọc`}>
                    <Text style={s.unreadText}>{unreadNotifications > 99 ? '99+' : unreadNotifications}</Text>
                  </View>
                ) : null}
              </Tap>
            ) : null}
          </View>
        </View>
      </Reveal>
      <QuickWordLookupModal visible={lookupOpen} onClose={() => setLookupOpen(false)} />
      {xmas ? <XmasGreeting /> : null}

      {/* Chỉ số học tập */}
      <Reveal delay={60}>
        {isLoggedIn ? (
          <View style={s.statsRow}>
            <StatChip winter={xmas} glow="rgba(251,146,60,0.45)" icon={<WobbleFlame />} tone={ds.amberSoft} value={`${stats?.streak_current ?? 0}`} label="ngày streak" />
            <StatChip
              winter={xmas}
              glow="rgba(103,232,249,0.45)"
              icon={<Zap size={22} color={xmas ? XMAS.cyan : ds.btn} />}
              tone={ds.skySoft}
              value={(stats?.xp_total ?? 0).toLocaleString('vi-VN')}
              label="tổng XP"
            />
            <StatChip
              winter={xmas}
              glow="rgba(251,191,36,0.5)"
              shimmer
              icon={<Coins size={22} color={xmas ? XMAS.gold : ds.amberText} />}
              tone={ds.amberSoft}
              value={(stats?.coins ?? 0).toLocaleString('vi-VN')}
              label="xu"
              onPress={() => go('/(student)/shop')}
            />
          </View>
        ) : (
          <Tap onPress={goLogin} style={s.loginCard} scaleTo={0.98}>
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
          onPress={() =>
            go(
              dueToday > 0
                ? '/(student)/review/due'
                : continueDeck
                  ? `/(student)/review/decks/${continueDeck.id}/study`
                  : '/(student)/review'
            )
          }
          style={s.hero}
          scaleTo={0.98}
          accessibilityLabel={dueToday > 0 ? `Ôn ${dueToday} thẻ đến hạn hôm nay` : undefined}
        >
          {xmas ? (
            <>
              <LinearGradient colors={['#0B1730', '#172554', '#1E1B4B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <WinterHeroScene />
            </>
          ) : (
            <>
              <View style={[s.heroDot, { width: 180, height: 180, right: -60, top: -70 }]} />
              <View style={[s.heroDot, { width: 90, height: 90, right: 70, bottom: -50 }]} />
            </>
          )}
          <View style={{ flex: 1, gap: 6 }}>
            <NeonText color={NEON.cyan} style={s.heroTag}>
              {dueToday > 0 ? 'Ôn tập hôm nay' : continueDeck ? 'Tiếp tục học' : 'Bắt đầu hôm nay'}
            </NeonText>
            <Text style={s.heroTitle} numberOfLines={2}>
              {dueToday > 0 ? `${dueToday} thẻ đến hạn ôn` : continueDeck ? continueDeck.name : 'Ôn từ vựng với Flashcard'}
            </Text>
            <Text style={s.heroSub}>
              {dueToday > 0
                ? 'Ôn đúng lúc sắp quên để nhớ lâu hơn'
                : continueDeck
                  ? `${continueDeck.cardCount} thẻ trong bộ`
                  : 'Chọn bộ thẻ phù hợp với trình độ của bạn'}
            </Text>
            <View style={s.heroCtaWrap}>
              <View style={s.heroCtaEdge} />
              <View style={[s.heroCta, xmas && { overflow: 'hidden', backgroundColor: XMAS.gold }]}>
                {xmas ? <ShimmerSweep width={150} every={2800} /> : null}
                <Play size={16} color={ds.ink} fill={ds.ink} />
                <Text style={s.heroCtaText}>{dueToday > 0 ? 'Ôn ngay' : continueDeck ? 'Học tiếp' : 'Khám phá'}</Text>
              </View>
            </View>
          </View>
          <ThinkingFox size={86} xmas={xmas} />
        </Tap>
      </Reveal>

      {/* Kế hoạch học sau bài kiểm tra đầu vào */}
      {isLoggedIn && currentUser?.id != null ? <LearningPlanCards userId={currentUser.id} /> : null}

      {/* Lối tắt tính năng */}
      {actions.length > 0 ? (
        <Reveal delay={180} style={s.section}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Text style={dsText.h2}>Luyện tập</Text>
            {xmas ? (
              <PineBranch size={96} flip style={{ marginRight: -20, marginBottom: -6 }} />
            ) : null}
          </View>
          {scanAction ? <AiScanFeatureCard onPress={() => go(scanAction.route)} /> : null}
          <View style={s.grid}>
            {practiceTiles.map((a) => {
              const Icon = a.icon;
              return (
                <Tap
                  key={a.key}
                  onPress={() => go(a.route)}
                  style={s.practiceTile}
                  accessibilityLabel={`${a.label}: ${a.hint}`}
                >
                  <View style={[s.practiceIcon, { backgroundColor: a.tone }]}>
                    <Icon size={22} color={a.tint} />
                  </View>
                  <Text style={s.practiceLabel} numberOfLines={2}>
                    {a.label}
                  </Text>
                  <Text style={s.practiceHint} numberOfLines={2}>
                    {a.hint}
                  </Text>
                  {xmas ? <SnowEdge /> : null}
                </Tap>
              );
            })}
          </View>
        </Reveal>
      ) : null}

      {/* Lớp học & Cộng đồng */}
      {connectActions.length > 0 ? (
        <Reveal delay={210} style={s.section}>
          <View style={s.sectionRow}>
            <Text style={dsText.h2}>Lớp học & Cộng đồng</Text>
            {xmas ? <Reindeer size={40} style={{ marginBottom: -6 }} /> : null}
          </View>
          <View style={s.grid}>
            {connectActions.map((a) => {
              const Icon = a.icon;
              return (
                <Tap key={a.key} onPress={() => go(a.route)} style={[s.actionTile, xmas && glassCard()]}>
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
                  {a.key === 'community' && unreadMessages > 0 ? (
                    <View style={s.unreadInline} accessibilityLabel={`${unreadMessages} tin nhắn chưa đọc`}>
                      <Text style={s.unreadText}>{unreadMessages > 99 ? '99+' : unreadMessages}</Text>
                    </View>
                  ) : null}
                </Tap>
              );
            })}
          </View>
        </Reveal>
      ) : null}

      {/* Nhiệm vụ hằng ngày */}
      {isLoggedIn ? (
        <Reveal delay={260} style={s.section}>
          <View style={s.sectionRow}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
              <Text style={dsText.h2}>Nhiệm vụ hôm nay</Text>
              {xmas ? <Snowman size={26} /> : null}
            </View>
            <Pressable onPress={() => go('/(student)/daily-challenge')} hitSlop={8}>
              <Text style={s.seeAll}>Xem tất cả</Text>
            </Pressable>
          </View>
          <DailyQuestList />
        </Reveal>
      ) : null}

      {/* Từ vựng hôm nay */}
      <Reveal delay={300} style={s.section}>
        <WordOfDayCard />
      </Reveal>

      {/* Luyện viết với AI */}
      {isLoggedIn ? (
        <Reveal delay={320}>
          <Tap onPress={() => go('/(student)/practice/writing')} style={[s.pathRow, xmas && glassCard()]} scaleTo={0.98}>
            <View style={[s.actionIcon, { backgroundColor: ds.greenSoft }]}>
              <PenLine size={22} color={ds.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.actionLabel}>Luyện viết với AI</Text>
              <Text style={s.actionHint}>Chấm lỗi, chấm điểm và viết lại bài của bạn</Text>
            </View>
            <ChevronRight size={20} color={ds.faint} />
          </Tap>
        </Reveal>
      ) : null}

      {/* Bài kiểm tra đầu vào: chưa làm thì mời làm để xếp lộ trình */}
      {needsPlacement && hasPermission('take_quiz_exam') ? (
        <Reveal delay={330}>
          <Tap onPress={() => go('/(student)/placement')} style={[s.pathRow, xmas && glassCard()]} scaleTo={0.98} accessibilityLabel="Làm bài kiểm tra đầu vào">
            <View style={[s.actionIcon, { backgroundColor: ds.amberSoft }]}>
              <ClipboardCheck size={22} color={ds.amberText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.actionLabel}>Kiểm tra trình độ đầu vào</Text>
              <Text style={s.actionHint}>Khoảng 3 phút, lộ trình sẽ bắt đầu đúng trình độ của bạn</Text>
            </View>
            <ChevronRight size={20} color={ds.faint} />
          </Tap>
        </Reveal>
      ) : null}

      {/* Lộ trình */}
      {xmas ? (
        <View pointerEvents="none" style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: -8, paddingHorizontal: 12 }}>
          <Lantern size={30} delay={200} />
          <Lantern size={30} delay={900} />
        </View>
      ) : null}
      <Reveal delay={340}>
        <Tap onPress={() => go('/(student)/learn')} style={[s.pathRow, xmas && glassCard()]} scaleTo={0.98}>
          <View style={[s.actionIcon, { backgroundColor: ds.skySoft }]}>
            <BookOpen size={22} color={ds.btn} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.actionLabel}>Lộ trình học</Text>
            <Text style={s.actionHint}>
              {placement?.completed && placement.cefrLevel
                ? `Bắt đầu từ trình độ ${placement.cefrLevel} theo bài kiểm tra đầu vào`
                : 'Bài học, luyện nói và đề kiểm tra'}
            </Text>
          </View>
          <ChevronRight size={20} color={ds.faint} />
        </Tap>
      </Reveal>

      {/* Khóa học của giáo viên, ưu tiên đúng trình độ đầu vào */}
      <Reveal delay={360}>
        <TeacherCoursesShowcase />
      </Reveal>
    </RA.ScrollView>
    </View>
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

const StatChip: React.FC<{
  icon: React.ReactNode;
  tone: string;
  value: string;
  label: string;
  onPress?: () => void;
  /** Kiểu thẻ kính mùa đông (giao diện tối + Giáng sinh). */
  winter?: boolean;
  glow?: string;
  /** Ánh kim chạy qua biểu tượng (đồng xu). */
  shimmer?: boolean;
}> = ({ icon, tone, value, label, onPress, winter, glow, shimmer }) => (
  <Pressable
    style={[s.statChip, winter && glassCard(glow)]}
    onPress={onPress}
    disabled={!onPress}
    accessibilityLabel={onPress ? `${label} - mở cửa hàng` : undefined}
  >
    <View style={[s.statIcon, { backgroundColor: tone }, winter && { overflow: 'hidden' }]}>
      {icon}
      {winter && shimmer ? <ShimmerSweep width={40} every={2600} /> : null}
    </View>
    <View style={{ flexShrink: 1 }}>
      <Text style={s.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={s.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
    {winter ? <SnowCorner size={30} /> : null}
  </Pressable>
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
  unreadBadge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: ds.red,
    borderWidth: 2,
    borderColor: ds.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadInline: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: ds.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { color: ds.white, fontSize: 11, fontFamily: dsFont.bold },
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
  statChipTap: { flex: 1 },
  statChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ds.card,
    borderRadius: dsRadius.md,
    borderWidth: 1.5,
    borderColor: ds.line,
    borderBottomWidth: 4,
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
    backgroundColor: ds.hero,
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
  grid: { flexDirection: 'row', gap: 8 },
  connectRow: { flexDirection: 'row', gap: 10 },
  actionTile: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    backgroundColor: ds.card,
    borderRadius: dsRadius.md,
    borderWidth: 1.5,
    borderColor: ds.line,
    borderBottomWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  practiceTile: {
    flex: 1,
    gap: 4,
    backgroundColor: ds.card,
    borderRadius: dsRadius.lg,
    borderWidth: 1.5,
    borderColor: ds.line,
    borderBottomWidth: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 124,
  },
  practiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  practiceLabel: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.ink },
  practiceHint: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted, lineHeight: 16 },
  actionIconSm: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionTileLabel: { fontFamily: dsFont.semibold, fontSize: dsSize.xs, color: ds.ink, textAlign: 'center' },
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
