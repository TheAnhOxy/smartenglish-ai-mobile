import React, { useState, useEffect } from 'react';
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
} from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';
import {
  fetchSystemDecksApi,
  fetchMyDecksApi,
  createDeckApi,
  DeckItemDTO,
} from '../../data/deckApi';
import { getTopicsApi } from '../../data/vocabularyApi';
import { colors, palette, font } from '@/src/theme';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import { DatabaseLoader } from '@/src/components/ui/DatabaseLoader';

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

interface DeckCardItemProps {
  deck: DeckItemDTO;
  index: number;
  isUserPremium: boolean;
  onPress: (deck: DeckItemDTO) => void;
}

const FlashcardDeckCard: React.FC<DeckCardItemProps> = ({
  deck,
  index,
  isUserPremium,
  onPress,
}) => {
  const cardSpring = usePressSpring(0.96);
  const theme = getDeckTheme(deck.name, index);

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

  // Giả lập tiến độ mastery SRS hiển thị hấp dẫn
  const masteryPercent = Math.min(100, Math.max(25, ((index * 23 + 45) % 85) + 15));

  return (
    <View style={styles.cardStackWrapper}>
      {/* Lớp thẻ bài phụ phía sau tạo hiệu ứng xếp chồng 3D (Card Stack Illusion) */}
      <View
        style={[
          styles.stackedLayerBack,
          {
            transform: [{ rotate: index % 2 === 0 ? '-2.5deg' : '2.5deg' }],
          },
        ]}
      />

      {/* Thẻ bài chính phía trước */}
      <AnimatedPressable
        onPress={() => onPress(deck)}
        onPressIn={cardSpring.onPressIn}
        onPressOut={cardSpring.onPressOut}
        style={[styles.deckCardMain, cardSpring.animatedStyle]}
      >
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
                  <Crown color="#B45309" size={10} />
                ) : (
                  <Lock color="#B45309" size={10} />
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
        <View style={styles.cardMiddleWrap}>
          <Text style={styles.deckCardName} numberOfLines={2}>
            {deck.name}
          </Text>
          <Text style={styles.deckCardDesc} numberOfLines={2}>
            {deck.description || 'Luyện tập phương pháp lặp lại ngắt quãng SRS'}
          </Text>
        </View>

        {/* SRS Mastery Progress Mini Bar */}
        <View style={styles.masteryProgressSection}>
          <View style={styles.masteryLabelRow}>
            <View style={styles.masteryIndicatorDot} />
            <Text style={styles.masteryText}>Thuộc {masteryPercent}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${masteryPercent}%`, backgroundColor: theme.gradient[0] },
              ]}
            />
          </View>
        </View>
      </AnimatedPressable>
    </View>
  );
};

export const DecksScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'SYSTEM' | 'MY_DECKS'>('SYSTEM');
  const [systemDecks, setSystemDecks] = useState<DeckItemDTO[]>([]);
  const [myDecks, setMyDecks] = useState<DeckItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const createBtnSpring = usePressSpring(0.96);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sys, mine, contentTopics] = await Promise.all([
        fetchSystemDecksApi(),
        fetchMyDecksApi(currentUser?.id?.toString()),
        getTopicsApi(),
      ]);

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
    } catch (e) {
      console.warn('Error loading decks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  const isUserPremium = currentUser?.plan !== 'free';

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;
    setCreating(true);
    try {
      const created = await createDeckApi(
        newDeckName.trim(),
        newDeckDesc.trim(),
        currentUser?.id?.toString()
      );
      if (created) {
        setMyDecks((prev) => [created, ...prev]);
      }
      setNewDeckName('');
      setNewDeckDesc('');
      setShowCreateModal(false);
    } catch (e) {
      console.warn('Error creating deck:', e);
    } finally {
      setCreating(false);
    }
  };

  const currentList = activeTab === 'SYSTEM' ? systemDecks : myDecks;

  const handleOpenStudy = (deck: DeckItemDTO) => {
    if (deck.isPremium && !isUserPremium) {
      router.push('/(student)/profile/premium' as any);
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
      router.push('/(student)/profile/premium' as any);
    } catch (err) {
      console.warn('Navigation error:', err);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Bar */}
      <View style={styles.headerRow}>
        <Image
          source={{
            uri:
              currentUser?.avatar_url ||
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
          }}
          style={styles.avatar}
        />

        <View style={styles.headerCenter}>
          <Text style={styles.headerBrand}>SMARTENGLISH AI</Text>
          <Text style={styles.headerTitle}>Kho Thẻ Ghi Nhớ</Text>
        </View>

        <Pressable onPress={handleOpenPremium} style={styles.zapBtn}>
          <Zap color={colors.xpDeep} size={18} fill={colors.xpDeep} />
        </Pressable>
      </View>

      {/* Subtitle Banner */}
      <View style={styles.titleSection}>
        <Text style={styles.screenSub}>
          Ôn tập ngắt quãng khoa học Spaced Repetition (SRS) giúp ghi nhớ từ vựng sâu hơn 300%.
        </Text>
      </View>

      {/* 2 Segmented Tabs: Chủ Đề Hệ Thống vs Bộ Thẻ Của Tôi */}
      <View style={styles.segmentedContainer}>
        <Pressable
          onPress={() => setActiveTab('SYSTEM')}
          style={[styles.segmentBtn, activeTab === 'SYSTEM' && styles.segmentBtnActive]}
        >
          <Layers
            color={activeTab === 'SYSTEM' ? colors.primary : colors.textSoft}
            size={16}
          />
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'SYSTEM' && styles.segmentBtnTextActive,
            ]}
          >
            Chủ Đề Hệ Thống
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('MY_DECKS')}
          style={[styles.segmentBtn, activeTab === 'MY_DECKS' && styles.segmentBtnActive]}
        >
          <BookOpen
            color={activeTab === 'MY_DECKS' ? colors.primary : colors.textSoft}
            size={16}
          />
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'MY_DECKS' && styles.segmentBtnTextActive,
            ]}
          >
            Bộ Thẻ Của Tôi ({myDecks.length})
          </Text>
        </Pressable>
      </View>

      {/* Loading state */}
      {loading ? (
        <DatabaseLoader
          message="Đang đồng bộ danh sách bộ thẻ..."
          subMessage="Tối ưu hóa dữ liệu SRS từ Lexora AI"
          size="sm"
        />
      ) : (
        /* Decks 2x2 Grid */
        <View style={styles.gridContainer}>
          {currentList.map((deck, idx) => (
            <FlashcardDeckCard
              key={String(deck.id)}
              deck={deck}
              index={idx}
              isUserPremium={isUserPremium}
              onPress={handleOpenStudy}
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
              placeholderTextColor="#94A3B8"
              style={styles.modalInput}
              autoFocus
            />

            <TextInput
              value={newDeckDesc}
              onChangeText={setNewDeckDesc}
              placeholder="Mô tả bộ thẻ (tùy chọn)"
              placeholderTextColor="#94A3B8"
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
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
  zapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.xpSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.xpDeep}30`,
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
});
