import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeTopic } from '@/src/core/realtime/stompClient';
import { fetchUserConversationsApi } from '@/src/features/social-feed/data/socialApi';
import { fetchUnreadNotificationCountApi } from '@/src/features/notifications/data/notificationApi';
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
  PenLine,
  Play,
  ScanText,
  School,
  Search,
  Users,
  Zap,
} from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';
import { useRoleGateStore } from '@/src/core/flows/roleGateStore';
import { LoxeraFoxMascot } from '@/src/core/components/LoxeraFoxMascot';
import { UserAvatar } from '@/src/core/components/UserAvatar';
import { colors } from '@/src/theme';
import { heroGradient } from '@/src/theme/gradients';
import { useMyDecksQuery } from '@/src/features/flashcard-srs/application/useFlashcardSrs';
import { useUserStatsQuery } from '../../application/useDashboard';
import { DailyQuestList } from '../components/DailyQuestList';
import { WordOfDayCard } from '../components/WordOfDayCard';
import { QuickWordLookupModal } from '@/src/features/flashcard-srs/presentation/screens/QuickWordLookupModal';

type IconType = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface QuickAction {
  key: string;
  label: string;
  icon: IconType;
  route: string | { pathname: string; params: Record<string, string> };
  visible: boolean;
}

const greetingOf = (hour: number) => (hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối');

export const HomeScreen = () => {
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
    { key: 'flashcard', label: 'Flashcard', icon: Layers, route: '/(student)/review', visible: hasPermission('learn_flashcard') },
    { key: 'chat', label: 'Hội thoại AI', icon: MessageSquare, route: '/(student)/assistant', visible: hasPermission('access_ai_tools') },
    { key: 'scan', label: 'Quét ảnh', icon: ScanText, route: '/(student)/practice/scan', visible: hasPermission('use_ai_scan') },
    {
      key: 'quiz',
      label: 'Kiểm tra',
      icon: BrainCircuit,
      route: { pathname: '/(student)/learn', params: { tab: 'quiz' } },
      visible: hasPermission('take_quiz_exam'),
    },
  ].filter((a) => a.visible);

  const connectActions: QuickAction[] = [
    { key: 'classes', label: 'Lớp học', icon: School, route: '/(student)/classes', visible: isLoggedIn && hasPermission('join_class_submit') },
    { key: 'community', label: 'Cộng đồng', icon: Users, route: '/(student)/feed', visible: isLoggedIn && hasPermission('use_community') },
  ].filter((a) => a.visible);

  const go = (route: QuickAction['route']) => router.push(route as never);
  // Phải thoát chế độ khách trước, nếu không layout gốc sẽ đẩy khách từ màn đăng nhập về lại trang chủ
  const goLogin = () => {
    exitGuestMode();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: (insets.top || 16) + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => (isLoggedIn ? go('/(student)/profile') : goLogin())} style={s.headerLeft}>
          <UserAvatar uri={currentUser?.avatar_url} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{greetingOf(new Date().getHours())}</Text>
            <Text style={s.name} numberOfLines={1}>
              {isLoggedIn ? currentUser?.display_name || 'Học viên' : 'Khách'}
            </Text>
          </View>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => setLookupOpen(true)} style={s.bellBtn} accessibilityLabel="Tra từ vựng">
            <Search size={20} color={colors.text} />
          </Pressable>
          {isLoggedIn ? (
            <Pressable onPress={() => go('/(student)/notifications')} style={s.bellBtn} accessibilityLabel="Thông báo">
              <Bell size={20} color={colors.text} />
              {unreadNotifications > 0 ? (
                <View style={s.unreadBadge} accessibilityLabel={`${unreadNotifications} thông báo chưa đọc`}>
                  <Text style={s.unreadText}>{unreadNotifications > 99 ? '99+' : unreadNotifications}</Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
        </View>
      </View>
      <QuickWordLookupModal visible={lookupOpen} onClose={() => setLookupOpen(false)} />

      {/* Chỉ số học tập */}
      {isLoggedIn ? (
        <View style={s.statsCard}>
          <StatTile icon={Flame} color={colors.streak} value={`${stats?.streak_current ?? 0}`} label="Ngày streak" />
          <View style={s.statDivider} />
          <StatTile icon={Zap} color={colors.xpDeep} value={(stats?.xp_total ?? 0).toLocaleString('vi-VN')} label="Tổng XP" />
          <View style={s.statDivider} />
          <StatTile icon={Coins} color={colors.coin} value={(stats?.coins ?? 0).toLocaleString('vi-VN')} label="Xu" onPress={() => go('/(student)/shop')} />
        </View>
      ) : (
        <Pressable onPress={goLogin} style={s.loginCard}>
          <View style={s.loginIcon}>
            <LogIn size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.loginTitle}>Đăng nhập để lưu tiến độ</Text>
            <Text style={s.loginSub}>Streak, XP và nhiệm vụ hằng ngày chỉ có khi đăng nhập</Text>
          </View>
          <ChevronRight size={18} color={colors.textSoft} />
        </Pressable>
      )}

      {/* Thẻ tiếp tục học */}
      <Pressable
        onPress={() => go(continueDeck ? `/(student)/review/decks/${continueDeck.id}/study` : '/(student)/review')}
        style={s.heroWrap}
      >
        <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={s.heroTag}>{continueDeck ? 'Tiếp tục học' : 'Bắt đầu hôm nay'}</Text>
            <Text style={s.heroTitle} numberOfLines={2}>
              {continueDeck ? continueDeck.name : 'Ôn từ vựng với Flashcard'}
            </Text>
            <Text style={s.heroSub}>
              {continueDeck ? `${continueDeck.cardCount} thẻ trong bộ` : 'Chọn bộ thẻ phù hợp với trình độ của bạn'}
            </Text>
            <View style={s.heroCta}>
              <Play size={14} color={colors.primary} fill={colors.primary} />
              <Text style={s.heroCtaText}>{continueDeck ? 'Học tiếp' : 'Khám phá'}</Text>
            </View>
          </View>
          <LoxeraFoxMascot size={96} showGlow={false} showBook={false} animated />
        </LinearGradient>
      </Pressable>

      {/* Lối tắt tính năng */}
      {actions.length > 0 ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Luyện tập</Text>
          <View style={s.grid}>
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <Pressable key={a.key} onPress={() => go(a.route)} style={s.actionTile}>
                  <View style={s.actionIcon}>
                    <Icon size={22} color={colors.primary} strokeWidth={2} />
                  </View>
                  <Text style={s.actionLabel}>{a.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Lớp học & Cộng đồng */}
      {connectActions.length > 0 ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Lớp học & Cộng đồng</Text>
          <View style={s.grid}>
            {connectActions.map((a) => {
              const Icon = a.icon;
              return (
                <Pressable key={a.key} onPress={() => go(a.route)} style={[s.pathRow, { flex: 1 }]}>
                  <View style={s.actionIcon}>
                    <Icon size={20} color={colors.primary} strokeWidth={2} />
                  </View>
                  <Text style={[s.pathTitle, { flex: 1 }]} numberOfLines={1}>{a.label}</Text>
                  {a.key === 'community' && unreadMessages > 0 ? (
                    <View style={s.unreadBadge} accessibilityLabel={`${unreadMessages} tin nhắn chưa đọc`}>
                      <Text style={s.unreadText}>{unreadMessages > 99 ? '99+' : unreadMessages}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Nhiệm vụ hằng ngày */}
      {isLoggedIn ? (
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Nhiệm vụ hôm nay</Text>
            <Pressable onPress={() => go('/(student)/daily-challenge')} hitSlop={8}>
              <Text style={s.seeAll}>Xem tất cả</Text>
            </Pressable>
          </View>
          <DailyQuestList limit={3} />
        </View>
      ) : null}

      {/* Từ vựng hôm nay */}
      <View style={s.section}>
        <WordOfDayCard />
      </View>

      {/* Luyện viết với AI */}
      {isLoggedIn ? (
        <Pressable onPress={() => go('/(student)/practice/writing')} style={s.pathRow}>
          <View style={s.actionIcon}>
            <PenLine size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.pathTitle}>Luyện viết với AI</Text>
            <Text style={s.pathSub}>Chấm lỗi, chấm điểm và viết lại bài của bạn</Text>
          </View>
          <ChevronRight size={18} color={colors.textSoft} />
        </Pressable>
      ) : null}

      {/* Lộ trình */}
      <Pressable onPress={() => go('/(student)/learn')} style={s.pathRow}>
        <View style={s.actionIcon}>
          <BookOpen size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.pathTitle}>Lộ trình học</Text>
          <Text style={s.pathSub}>Bài học, luyện nói và đề kiểm tra</Text>
        </View>
        <ChevronRight size={18} color={colors.textSoft} />
      </Pressable>
    </ScrollView>
  );
};

const StatTile: React.FC<{ icon: IconType; color: string; value: string; label: string; onPress?: () => void }> = ({ icon: Icon, color, value, label, onPress }) => (
  <Pressable style={s.statTile} onPress={onPress} disabled={!onPress} accessibilityLabel={onPress ? `${label} - mở cửa hàng` : undefined}>
    <Icon size={18} color={color} />
    <Text style={s.statValue}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </Pressable>
);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 48, gap: 16, maxWidth: 600, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  greeting: { fontSize: 13, color: colors.textSoft },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
  },
  statTile: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },
  statValue: { fontSize: 16, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSoft },
  loginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  loginIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  loginTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  loginSub: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
  heroWrap: { borderRadius: 24, overflow: 'hidden' },
  hero: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 8 },
  heroTag: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 6,
  },
  heroCtaText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  section: { gap: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  seeAll: { fontSize: 13, fontWeight: '600', color: colors.primary },
  grid: { flexDirection: 'row', gap: 10 },
  actionTile: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  unreadBadge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  pathTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  pathSub: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
});
