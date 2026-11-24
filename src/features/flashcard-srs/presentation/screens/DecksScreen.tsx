import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Zap,
  Briefcase,
  Plane,
  Sparkles,
  Folder,
  Plus,
  BookOpen,
  Layers,
  Coffee,
  Crown,
  Lock,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  AlertCircle,
} from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';
import { GuestLoginPrompt } from '@/src/core/components/GuestLoginPrompt';
import {
  fetchSystemDecksApi,
  fetchMyDecksApi,
  createDeckApi,
  DeckItemDTO,
} from '../../data/deckApi';
import { getTopicsApi } from '../../data/vocabularyApi';
import { colors, palette, font } from '@/src/theme';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import { TabLoadingState } from '@/src/components/ui/TabLoadingState';
import { BackButton } from '@/src/core/components/BackButton';
import { UserAvatar } from '@/src/core/components/UserAvatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hasActivePremium } from '@/src/core/utils/plan';
import { ChristmasScene } from '@/src/components/xmas/ChristmasScenes';
import { useXmasActive } from '@/src/core/services/xmas';
import { DeckArt, getDeckXmas } from '@/src/components/xmas/DeckArt';
import { PineBranch, ShimmerSweep, SnowEdge } from '@/src/components/xmas/WinterUI';
import { ds, dsFont } from '@/src/theme/ds';
import { isLevelMatch, sortByLevelCloseness } from '@/src/features/onboarding/application/learnerLevel';
import { dk } from '@/src/theme/themeMode';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 14) / 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Cấu hình Gradient & Theme theo chủ đề Deck
interface DeckThemeConfig {
  gradient: [string, string];
  iconBg: string;
  iconColor: string;
  badgeBg: string;
}

const getDeckTheme = (name: string, index: number): DeckThemeConfig => {
  const lower = name.toLowerCase();
  if (lower.includes('du lịch') || lower.includes('travel') || lower.includes('bay')) {
    return {
      gradient: ['#0EA5E9', '#2563EB'],
      iconBg: '#E0F2FE',
      iconColor: '#0284C7',
      badgeBg: '#F0F9FF',
    };
  }
  if (lower.includes('công nghệ') || lower.includes('ai') || lower.includes('it')) {
    return {
      gradient: ['#8B5CF6', '#D946EF'],
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
      badgeBg: '#FAF5FF',
    };
  }
  if (lower.includes('kinh doanh') || lower.includes('đàm phán') || lower.includes('business')) {
    return {
      gradient: ['#F59E0B', '#EA580C'],
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      badgeBg: '#FFFBEB',
    };
  }
  if (lower.includes('đời sống') || lower.includes('giao tiếp') || lower.includes('daily')) {
    return {
      gradient: ['#10B981', '#0D9488'],
      iconBg: '#D1FAE5',
      iconColor: '#059669',
      badgeBg: '#ECFDF5',
    };
  }

  const fallbacks: DeckThemeConfig[] = [
    {
      gradient: ['#4F46E5', '#3B82F6'],
      iconBg: '#EEF2FF',
      iconColor: '#4338CA',
      badgeBg: '#F8FAFC',
    },
    {
      gradient: ['#EC4899', '#8B5CF6'],
      iconBg: '#FDF2F8',
      iconColor: '#DB2777',
      badgeBg: '#FDF4FF',
    },
  ];

  return fallbacks[index % fallbacks.length];
};

/** Tab đang chọn kiểu thư viện phép thuật: nền xanh thông, viền vàng ấm. */
const XMAS_SEGMENT_ACTIVE = {
  backgroundColor: '#14532D',
  borderWidth: 1,
  borderColor: 'rgba(251,191,36,0.55)',
  shadowColor: '#FBBF24',
  shadowOpacity: 0.5,
  shadowRadius: 8,
} as const;

interface DeckCardItemProps {
  deck: DeckItemDTO;
  index: number;
  isUserPremium: boolean;
  /** Bộ thẻ hệ thống gần trình độ của học viên. */
  levelMatch?: boolean;
  onPress: (deck: DeckItemDTO) => void;
  /** Thư viện phép thuật Giáng sinh (giao diện tối). */
  xmas?: boolean;
}

const FlashcardDeckCard: React.FC<DeckCardItemProps> = ({
  deck,
  index,
  isUserPremium,
  levelMatch,
  onPress,
  xmas = false,
}) => {
  const cardSpring = usePressSpring(0.96);
  const theme = getDeckTheme(deck.name, index);
  const magic = getDeckXmas(deck.name);

  const getDeckIconComp = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('du lịch') || lower.includes('travel') || lower.includes('bay')) return Plane;
    if (lower.includes('công nghệ') || lower.includes('ai') || lower.includes('it')) return Sparkles;
    if (lower.includes('kinh doanh') || lower.includes('đàm phán') || lower.includes('business')) return Briefcase;
    if (lower.includes('đời sống') || lower.includes('giao tiếp') || lower.includes('daily')) return Coffee;
    if (lower.includes('sổ từ') || lower.includes('lưu')) return BookOpen;
    return Folder;
  };

  const IconComponent = getDeckIconComp(deck.name);

  return (
    <View style={styles.cardStackWrapper}>
      {/* Lớp thẻ bài phụ phía sau tạo hiệu ứng xếp chồng 3D (Card Stack Illusion) */}
      <View
        style={[
          styles.stackedLayerBack,
          {
            transform: [{ rotate: index % 2 === 0 ? '-2.5deg' : '2.5deg' }],
          },
          xmas && { backgroundColor: 'rgba(63,42,22,0.75)' },
        ]}
      />

      {/* Thẻ bài chính phía trước */}
      <AnimatedPressable
        onPress={() => onPress(deck)}
        onPressIn={cardSpring.onPressIn}
        onPressOut={cardSpring.onPressOut}
        style={[
          styles.deckCardMain,
          xmas && {
            backgroundColor: 'rgba(16,30,34,0.92)',
            borderColor: deck.isPremium ? '#FBBF24' : `${magic.glow}66`,
            borderWidth: deck.isPremium ? 1.5 : 1,
            overflow: 'hidden',
          },
          cardSpring.animatedStyle,
        ]}
      >
        {xmas ? (
          <>
            <LinearGradient colors={magic.tint} style={StyleSheet.absoluteFill} />
            <SnowEdge />
            {deck.isPremium ? <ShimmerSweep width={180} every={3400} delay={index * 500} color="rgba(251,191,36,0.35)" /> : null}
            <View pointerEvents="none" style={{ position: 'absolute', right: 8, bottom: 8, opacity: 0.95 }}>
              <DeckArt topic={magic.topic} size={46} />
            </View>
          </>
        ) : null}
        {/* Top Header Card */}
        <View style={styles.cardTopRow}>
          <LinearGradient
            colors={theme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBoxGradient}
          >
            <IconComponent color="#FFFFFF" size={20} />
          </LinearGradient>

          <View style={styles.cardTopBadgeRow}>
            {deck.isPremium && (
              <View style={[styles.proBadge, !isUserPremium && styles.proBadgeLocked]}>
                {isUserPremium ? (
                  <Crown color={dk('#B45309', 'text')} size={10} />
                ) : (
                  <Lock color={dk('#B45309', 'text')} size={10} />
                )}
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}

            <View style={styles.cardCountBadge}>
              <Text style={styles.cardCountText}>{deck.cardCount} thẻ</Text>
            </View>
          </View>
        </View>

        {/* Card Title & Desc */}
        <View style={[styles.cardMiddleWrap, xmas && { paddingRight: 42 }]}>
          <Text style={styles.deckCardName} numberOfLines={2}>
            {deck.name}
          </Text>
          <Text style={styles.deckCardDesc} numberOfLines={2}>
            {deck.description || 'Luyện tập phương pháp lặp lại ngắt quãng SRS'}
          </Text>
          {levelMatch && (
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Phù hợp trình độ</Text>
            </View>
          )}
        </View>
      </AnimatedPressable>
    </View>
  );
};

/** `embedded`: nằm trong tab Lộ trình → không nút quay lại, không cộng vùng an toàn lần nữa. */
export const DecksScreen = ({ embedded = false }: { embedded?: boolean }) => {
  const xmas = useXmasActive();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'SYSTEM' | 'MY_DECKS'>('SYSTEM');
  const [systemDecks, setSystemDecks] = useState<DeckItemDTO[]>([]);
  const [myDecks, setMyDecks] = useState<DeckItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const createBtnSpring = usePressSpring(0.96);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Khách vãng lai: chỉ tải bộ thẻ hệ thống (công khai); "Của tôi" cần đăng nhập
      const [sysRes, mineRes, topicsRes] = await Promise.allSettled([
        fetchSystemDecksApi(),
        currentUser ? fetchMyDecksApi() : Promise.resolve([] as DeckItemDTO[]),
        getTopicsApi(),
      ]);
      if (sysRes.status === 'rejected' && topicsRes.status === 'rejected') {
        throw topicsRes.reason;
      }
      const sys = sysRes.status === 'fulfilled' ? sysRes.value : [];
      const mine = mineRes.status === 'fulfilled' ? mineRes.value : [];
      const contentTopics = topicsRes.status === 'fulfilled' ? topicsRes.value : [];

      if (contentTopics && contentTopics.length > 0) {
        const mappedSystemTopics: DeckItemDTO[] = contentTopics.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description || `Bộ từ vựng chủ đề ${t.name}`,
          source: 'SYSTEM_TOPIC',
          cardCount: t.wordCount !== undefined ? t.wordCount : 0,
          studyMode: 'srs',
          targetExam: t.difficultyLevel || 'B1',
          isPremium: Boolean(t.isPremium),
        }));
        setSystemDecks(mappedSystemTopics);
      } else {
        setSystemDecks(sys);
      }

      setMyDecks(mine);
    } catch (e: any) {
      console.warn('Error loading decks:', e);
      setError(e?.response?.data?.message || e?.message || 'Không thể tải danh sách bộ thẻ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isUserPremium = hasActivePremium(currentUser);

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;
    setCreating(true);
    try {
      const created = await createDeckApi(
        newDeckName.trim(),
        newDeckDesc.trim()
      );
      if (created) {
        setMyDecks((prev) => [created, ...prev]);
      }
      setNewDeckName('');
      setNewDeckDesc('');
      setShowCreateModal(false);
    } catch (e: any) {
      console.warn('Error creating deck:', e);
      Alert.alert(
        'Lỗi tạo bộ thẻ',
        e?.response?.data?.message || e?.message || 'Không thể tạo bộ thẻ mới. Vui lòng thử lại.'
      );
    } finally {
      setCreating(false);
    }
  };

  const learnerLevel = currentUser?.cefr_level;
  // Bộ thẻ hệ thống: chủ đề gần trình độ học viên lên trước
  const sortedSystemDecks = useMemo(
    () => sortByLevelCloseness(systemDecks, learnerLevel, (d) => d.targetExam),
    [systemDecks, learnerLevel],
  );
  const currentList = activeTab === 'SYSTEM' ? sortedSystemDecks : myDecks;

  const handleOpenStudy = (deck: DeckItemDTO) => {
    if (deck.isPremium && !isUserPremium) {
      router.push({ pathname: '/(student)/profile/premium', params: { from: 'learn' } } as any);
      return;
    }
    try {
      router.push({
        pathname: `/(student)/review/decks/[deckId]/study`,
        params: {
          deckId: String(deck.id),
          topicId: deck.source === 'SYSTEM_TOPIC' ? String(deck.id) : '',
          deckName: deck.name,
        },
      } as any);
    } catch (err) {
      console.warn('Navigation error:', err);
    }
  };

  const handleOpenPremium = () => {
    try {
      router.push({ pathname: '/(student)/profile/premium', params: { from: 'learn' } } as any);
    } catch (err) {
      console.warn('Navigation error:', err);
    }
  };

  return (
    <View style={{ flex: 1 }}>
    {/* Giáng sinh (giao diện tối): Thư viện phép thuật */}
    {xmas ? <ChristmasScene scene="library" /> : null}
    <ScrollView
      style={[styles.container, xmas && { backgroundColor: 'transparent' }]}
      contentContainerStyle={[styles.scrollContent, !embedded && { paddingTop: insets.top + 10 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Bar */}
      <View style={styles.headerRow}>
        {embedded ? <UserAvatar uri={currentUser?.avatar_url} size={40} /> : <BackButton />}

        <View style={styles.headerCenter}>
          <Text style={styles.headerBrand}>SMARTENGLISH AI</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {xmas ? <BookOpen size={18} color="#FBBF24" /> : null}
            <Text style={[styles.headerTitle, xmas && { color: '#FDE7BD', textShadowColor: 'rgba(251,191,36,0.7)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } }]}>
              Kho Thẻ Ghi Nhớ
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleOpenPremium}
          style={[styles.proBtn, xmas && { backgroundColor: '#FBBF24', overflow: 'hidden', shadowColor: '#FBBF24', shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }]}
        >
          {xmas ? <ShimmerSweep width={40} every={2600} /> : null}
          <Crown color={xmas ? '#78350F' : '#D97706'} size={19} fill={xmas ? '#FDE68A' : '#F59E0B'} />
        </Pressable>
      </View>

      {/* 2 Segmented Tabs: Hệ thống vs Của tôi */}
      <View style={[styles.segmentedContainer, xmas && { backgroundColor: 'rgba(16,30,34,0.85)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)' }]}>
        <Pressable
          onPress={() => setActiveTab('SYSTEM')}
          style={[styles.segmentBtn, activeTab === 'SYSTEM' && styles.segmentBtnActive, xmas && activeTab === 'SYSTEM' && XMAS_SEGMENT_ACTIVE]}
        >
          <Layers
            color={activeTab === 'SYSTEM' ? (xmas ? '#FDE68A' : colors.primary) : colors.textSoft}
            size={16}
          />
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'SYSTEM' && styles.segmentBtnTextActive,
              xmas && activeTab === 'SYSTEM' && { color: '#FDE68A' },
            ]}
          >
            Hệ thống
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('MY_DECKS')}
          style={[styles.segmentBtn, activeTab === 'MY_DECKS' && styles.segmentBtnActive, xmas && activeTab === 'MY_DECKS' && XMAS_SEGMENT_ACTIVE]}
        >
          <BookOpen
            color={activeTab === 'MY_DECKS' ? (xmas ? '#FDE68A' : colors.primary) : colors.textSoft}
            size={16}
          />
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'MY_DECKS' && styles.segmentBtnTextActive,
              xmas && activeTab === 'MY_DECKS' && { color: '#FDE68A' },
            ]}
          >
            Của tôi
          </Text>
        </Pressable>
        {xmas ? <PineBranch size={60} flip style={{ position: 'absolute', right: -10, top: -16 }} /> : null}
      </View>

      {/* Loading state */}
      {loading && (
        <TabLoadingState
          message="Đang tải kho bộ thẻ..."
        />
      )}

      {/* Khách vãng lai mở tab "Của tôi" → mời đăng nhập */}
      {activeTab === 'MY_DECKS' && !currentUser && <GuestLoginPrompt title="Đăng nhập để tạo và lưu bộ thẻ của riêng bạn" />}

      {/* Error state */}
      {!loading && error && (activeTab === 'SYSTEM' || !!currentUser) && (
        <View style={styles.errorContainer}>
          <AlertCircle size={38} color="#EF4444" />
          <Text style={styles.errorTitle}>Lỗi kết nối máy chủ</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <Pressable onPress={loadData} style={styles.retryBtn}>
            <RotateCcw size={15} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      )}

      {/* Empty state khi không có thẻ */}
      {!loading && !error && currentList.length === 0 && activeTab === 'SYSTEM' && (
        <View style={styles.emptyContainer}>
          <BookOpen size={40} color={dk('#94A3B8', 'text')} />
          <Text style={styles.emptyTitle}>Chưa có bộ thẻ hệ thống nào</Text>
          <Text style={styles.emptySubtitle}>Các chủ đề từ vựng chuẩn sẽ sớm được xuất bản.</Text>
        </View>
      )}

      {!loading && !error && !!currentUser && currentList.length === 0 && activeTab === 'MY_DECKS' && (
        <View style={styles.emptyContainer}>
          <BookOpen size={40} color={dk('#94A3B8', 'text')} />
          <Text style={styles.emptyTitle}>Chưa có bộ thẻ</Text>
          <Text style={styles.emptySubtitle}>Bạn chưa có bộ thẻ cá nhân nào. Hãy bấm nút bên dưới để tạo bộ thẻ từ vựng đầu tiên!</Text>
        </View>
      )}

      {/* Decks 2x2 Grid */}
      {!loading && !error && (activeTab === 'SYSTEM' || !!currentUser) && (
        <View style={styles.gridContainer}>
          {currentList.map((deck, idx) => (
            <FlashcardDeckCard
              key={String(deck.id)}
              deck={deck}
              index={idx}
              isUserPremium={isUserPremium}
              levelMatch={activeTab === 'SYSTEM' && deck.source === 'SYSTEM_TOPIC' && isLevelMatch(learnerLevel, deck.targetExam)}
              onPress={handleOpenStudy}
              xmas={xmas}
            />
          ))}

          {/* Nút Tạo Thẻ Mới trong Tab CỦA TÔI */}
          {activeTab === 'MY_DECKS' && (
            <View style={styles.cardStackWrapper}>
              <AnimatedPressable
                onPress={() => setShowCreateModal(true)}
                onPressIn={createBtnSpring.onPressIn}
                onPressOut={createBtnSpring.onPressOut}
                style={[styles.createDashedCard, createBtnSpring.animatedStyle]}
              >
                <View style={styles.plusCircle}>
                  <Plus color={colors.primary} size={26} strokeWidth={2.5} />
                </View>
                <Text style={styles.createDashedText}>Tạo Thẻ Mới</Text>
                <Text style={styles.createDashedSub}>Lưu từ riêng của bạn</Text>
              </AnimatedPressable>
            </View>
          )}
        </View>
      )}

      {/* Modal Tạo Bộ Thẻ Cá Nhân */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tạo Bộ Thẻ Cá Nhân Mới</Text>
            <Text style={styles.modalSub}>Lưu các từ vựng bạn muốn tập trung ghi nhớ sâu</Text>

            <TextInput
              value={newDeckName}
              onChangeText={setNewDeckName}
              placeholder="Tên bộ thẻ (VD: Từ vựng IELTS Writing...)"
              placeholderTextColor={dk('#94A3B8', 'text')}
              style={styles.modalInput}
              autoFocus
            />

            <TextInput
              value={newDeckDesc}
              onChangeText={setNewDeckDesc}
              placeholder="Mô tả bộ thẻ (tùy chọn)"
              placeholderTextColor={dk('#94A3B8', 'text')}
              style={[styles.modalInput, { marginBottom: 20 }]}
            />

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>

              <Pressable
                onPress={handleCreateDeck}
                disabled={creating}
                style={[styles.modalConfirmBtn, creating && { opacity: 0.6 }]}
              >
                <Text style={styles.modalConfirmText}>
                  {creating ? 'Đang tạo...' : 'Tạo Bộ Thẻ'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerBrand: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 19,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  proBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  titleSection: {
    marginBottom: 16,
  },
  screenSub: {
    fontSize: 12,
    fontFamily: font.family,
    color: colors.textSoft,
    lineHeight: 17,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    padding: 4,
    borderRadius: 18,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentBtnText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.textSoft,
  },
  segmentBtnTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
    marginBottom: 32,
  },
  cardStackWrapper: {
    width: CARD_WIDTH,
    minHeight: 180,
    position: 'relative',
  },
  stackedLayerBack: {
    position: 'absolute',
    top: 4,
    left: 2,
    right: 2,
    bottom: -4,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  deckCardMain: {
    width: '100%',
    minHeight: 180,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBoxGradient: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: ds.greenSoft,
  },
  levelBadgeText: {
    fontSize: 10,
    fontFamily: dsFont.semibold,
    color: ds.greenText,
  },
  cardTopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  proBadgeLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  proBadgeText: {
    fontSize: 9,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#B45309',
  },
  cardCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cardCountText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#475569',
  },
  cardMiddleWrap: {
    marginTop: 10,
    marginBottom: 10,
  },
  deckCardName: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 4,
  },
  deckCardDesc: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 15,
  },
  masteryProgressSection: {
    marginTop: 4,
  },
  masteryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  masteryIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  masteryText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.textSoft,
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  createDashedCard: {
    width: '100%',
    minHeight: 180,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA',
    zIndex: 2,
  },
  plusCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  createDashedText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.primary,
  },
  createDashedSub: {
    fontSize: 10,
    fontFamily: font.family,
    color: colors.textSoft,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    fontFamily: font.family,
    color: '#64748B',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 10,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  modalCancelText: {
    fontWeight: '600',
    fontFamily: font.family,
    color: '#475569',
    fontSize: 13,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.streak,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: font.family,
    fontSize: 13,
  },
  errorContainer: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  errorTitle: {
    fontSize: 15,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorSub: {
    fontSize: 13,
    fontFamily: font.family,
    color: '#B91C1C',
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  retryBtnText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: font.family,
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 18,
  },
});
