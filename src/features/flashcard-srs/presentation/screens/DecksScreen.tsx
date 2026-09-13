import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
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
import { DatabaseLoader } from '@/src/components/ui/DatabaseLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

export const DecksScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  // 2 Segmented Tabs: 'SYSTEM' vs 'MY_DECKS'
  const [activeTab, setActiveTab] = useState<'SYSTEM' | 'MY_DECKS'>('SYSTEM');
  const [systemDecks, setSystemDecks] = useState<DeckItemDTO[]>([]);
  const [myDecks, setMyDecks] = useState<DeckItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [creating, setCreating] = useState(false);

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

  const getDeckIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('du lịch') || lower.includes('travel') || lower.includes('bay')) return Plane;
    if (lower.includes('công nghệ') || lower.includes('ai') || lower.includes('it')) return Sparkles;
    if (lower.includes('kinh doanh') || lower.includes('đàm phán') || lower.includes('business')) return Briefcase;
    if (lower.includes('đời sống') || lower.includes('giao tiếp') || lower.includes('daily')) return Coffee;
    if (lower.includes('sổ từ') || lower.includes('lưu')) return BookOpen;
    return Folder;
  };

  const getDeckColors = (index: number) => {
    const colors = [
      { bg: '#FFF7ED', ring: '#FF6B35' },
      { bg: '#ECFEFF', ring: '#00BCD4' },
      { bg: '#FAF5FF', ring: '#A855F7' },
      { bg: '#ECFDF5', ring: '#10B981' },
    ];
    return colors[index % colors.length];
  };

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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Top Header Bar */}
      <View style={styles.headerRow}>
        <Image
          source={{
            uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
          }}
          style={styles.avatar}
        />

        <Text style={styles.headerTitle}>SmartEnglish AI</Text>

        <Pressable onPress={handleOpenPremium} style={styles.zapBtn}>
          <Zap color={colors.xpDeep} size={20} fill={colors.xpDeep} />
        </Pressable>
      </View>

      {/* Section Title */}
      <View style={styles.titleSection}>
        <View style={styles.titleTextWrap}>
          <Text style={styles.screenTitle}>Kho Thẻ Ghi Nhớ</Text>
          <Text style={styles.screenSub}>Ôn tập ngắt quãng khoa học Spaced Repetition (SRS)</Text>
        </View>

        {activeTab === 'MY_DECKS' && (
          <Pressable onPress={() => setShowCreateModal(true)} style={styles.createBadgeBtn}>
            <Plus color={colors.primary} size={14} />
            <Text style={styles.createBadgeText}>Tạo Thẻ</Text>
          </Pressable>
        )}
      </View>

      {/* 2 Segmented Tabs: Chủ đề hệ thống vs Bộ thẻ của tôi */}
      <View style={styles.segmentedContainer}>
        <Pressable
          onPress={() => setActiveTab('SYSTEM')}
          style={[styles.segmentBtn, activeTab === 'SYSTEM' && styles.segmentBtnActive]}
        >
          <Layers color={activeTab === 'SYSTEM' ? colors.primary : colors.textSoft} size={16} />
          <Text style={[styles.segmentBtnText, activeTab === 'SYSTEM' && styles.segmentBtnTextActive]}>
            Chủ Đề Hệ Thống
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('MY_DECKS')}
          style={[styles.segmentBtn, activeTab === 'MY_DECKS' && styles.segmentBtnActive]}
        >
          <BookOpen color={activeTab === 'MY_DECKS' ? colors.primary : colors.textSoft} size={16} />
          <Text style={[styles.segmentBtnText, activeTab === 'MY_DECKS' && styles.segmentBtnTextActive]}>
            Bộ Thẻ Của Tôi ({myDecks.length})
          </Text>
        </Pressable>
      </View>

      {/* Loading state với custom DatabaseLoader */}
      {loading ? (
        <DatabaseLoader
          message="Đang tải danh sách bộ thẻ..."
          subMessage="Đồng bộ tiến độ học tập với đám mây"
          size="sm"
        />
      ) : (
        /* Decks 2x2 Grid */
        <View style={styles.gridContainer}>
          {currentList.map((deck, idx) => {
            const IconComp = getDeckIcon(deck.name);
            const styleColor = getDeckColors(idx);
            return (
              <Pressable
                key={String(deck.id)}
                onPress={() => handleOpenStudy(deck)}
                style={styles.deckCard}
              >
                {/* Top Row: Icon & Cards Indicator */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.iconBox, { backgroundColor: styleColor.bg }]}>
                    <IconComp color={styleColor.ring} size={22} />
                  </View>

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
                      <Text style={styles.cardCountText}>{deck.cardCount} Thẻ</Text>
                    </View>
                  </View>
                </View>

                {/* Bottom Info: Title & Subtitle */}
                <View style={styles.cardBottomWrap}>
                  <Text style={styles.deckCardName} numberOfLines={2}>
                    {deck.name}
                  </Text>
                  <Text style={styles.deckCardDesc} numberOfLines={2}>
                    {deck.description || 'Luyện tập phương pháp lặp lại ngắt quãng'}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {/* Create Deck Card button when in MY_DECKS tab */}
          {activeTab === 'MY_DECKS' && (
            <Pressable onPress={() => setShowCreateModal(true)} style={styles.createDashedCard}>
              <View style={styles.plusCircle}>
                <Plus color="#475569" size={26} />
              </View>
              <Text style={styles.createDashedText}>Tạo Thẻ Mới</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Create Deck Modal */}
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
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  zapBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.xpSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  titleTextWrap: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  screenSub: {
    fontSize: 12,
    color: colors.textSoft,
    marginTop: 4,
    fontWeight: '500',
  },
  createBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  createBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    padding: 4,
    borderRadius: 16,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSoft,
  },
  segmentBtnTextActive: {
    color: colors.primary,
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    marginBottom: 32,
  },
  deckCard: {
    width: CARD_WIDTH,
    minHeight: 165,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  proBadgeLocked: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  proBadgeText: {
    fontSize: 9,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#B45309',
  },
  cardCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cardCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  cardBottomWrap: {
    marginTop: 12,
  },
  deckCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 19,
    marginBottom: 4,
  },
  deckCardDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 15,
  },
  createDashedCard: {
    width: CARD_WIDTH,
    minHeight: 165,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  plusCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  createDashedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
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
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
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
    color: '#475569',
    fontSize: 13,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
