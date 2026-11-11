import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  Bot,
  Mic,
  Volume2,
  ChevronRight,
  Lock,
  Sparkles,
  Layers,
  Flame,
  CheckCircle,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TabLoadingState } from '@/src/components/ui/TabLoadingState';
import { useAuthStore } from '@/src/core/flows/authStore';
import { AppColors } from '@/src/core/theme/colors';
import { MessageCircle, SlidersHorizontal, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryFilterMenu } from '../components/CategoryFilterMenu';
import {
  fetchPronunciationLessonsApi,
  fetchRoleplayScenariosApi,
  PronunciationLesson,
  RoleplayScenario,
  useSpeakingQuotaStore,
  FREE_SPEAKING_DAILY_LIMIT,
} from '../../data/speakingApi';

const { width } = Dimensions.get('window');

// Bảng màu đồng bộ chuẩn Admin (Slate / Navy / Indigo)
const ADMIN_THEME = {
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
  textMain: '#0F172A',
  textSub: '#475569',
  textMuted: '#94A3B8',
  primary: '#4F46E5', // Indigo-600
  primarySoft: '#EEF2FF',
  primaryBorder: '#C7D2FE',
};

// Huy hiệu CEFR đồng bộ Web Admin
const CEFR_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  A1: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  A2: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  B1: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  B2: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
  C1: { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' },
  C2: { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
};

const CATEGORIES = ['Tất cả', 'Giao tiếp', 'Công việc', 'Đời sống', 'Du lịch'];

export const SpeakingHomeScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';

  const { getQuota } = useSpeakingQuotaStore();
  const quota = getQuota(isPremium);

  // Tabs: 'roleplay' (Hội thoại AI) | 'pronunciation' (Luyện phát âm)
  const [activeTab, setActiveTab] = useState<'roleplay' | 'pronunciation'>('roleplay');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [showFilter, setShowFilter] = useState(false);
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [pronLessons, setPronLessons] = useState<PronunciationLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // allSettled: một nguồn lỗi (vd. khách chưa đăng nhập bị 401) không làm hỏng cả màn hình
    Promise.allSettled([fetchRoleplayScenariosApi(), fetchPronunciationLessonsApi()])
      .then(([roleplayRes, lessonsRes]) => {
        setScenarios(roleplayRes.status === 'fulfilled' ? roleplayRes.value : []);
        setPronLessons(lessonsRes.status === 'fulfilled' ? lessonsRes.value : []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Lọc kịch bản Roleplay
  const filteredScenarios = useMemo(() => {
    return scenarios.filter((sc) => {
      const matchCat =
        selectedCategory === 'Tất cả' ||
        (sc.category && sc.category.toLowerCase().includes(selectedCategory.toLowerCase()));
      const matchQuery =
        !searchQuery.trim() ||
        sc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sc.title_en && sc.title_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
        sc.ai_persona.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [scenarios, selectedCategory, searchQuery]);

  // Lọc bài phát âm
  const filteredLessons = useMemo(() => {
    return pronLessons.filter((item) => {
      const matchCat =
        selectedCategory === 'Tất cả' ||
        (item.category && item.category.toLowerCase().includes(selectedCategory.toLowerCase()));
      const matchQuery =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.targetText.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [pronLessons, selectedCategory, searchQuery]);

  return (
    <View style={s.root}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ── Search Bar đồng bộ Admin ──────────────────────────────────── */}
        <View style={s.searchWrap}>
          <Search color={ADMIN_THEME.textMuted} size={16} style={s.searchIcon} />
          <TextInput
            placeholder={
              activeTab === 'roleplay'
                ? 'Tìm kiếm tình huống, nhân vật AI...'
                : 'Tìm kiếm bài phát âm, từ vựng...'
            }
            placeholderTextColor={ADMIN_THEME.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={s.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={s.clearBtn} hitSlop={8} accessibilityLabel="Xoá tìm kiếm">
              <X color={ADMIN_THEME.textMuted} size={14} />
            </Pressable>
          )}
          {/* Bộ lọc chủ đề gọn trong thanh tìm kiếm (thay cho hàng nút lọc) */}
          <Pressable
            onPress={() => setShowFilter(true)}
            hitSlop={8}
            accessibilityLabel="Lọc theo chủ đề"
            style={{ padding: 6, marginLeft: 4, borderRadius: 10, backgroundColor: selectedCategory !== 'Tất cả' ? '#E0F2FE' : 'transparent' }}
          >
            <SlidersHorizontal color={selectedCategory !== 'Tất cả' ? AppColors.primary : ADMIN_THEME.textMuted} size={18} />
          </Pressable>
        </View>

        <CategoryFilterMenu
          visible={showFilter}
          categories={CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          onClose={() => setShowFilter(false)}
          top={insets.top + 64}
        />

        {/* ── Segmented Control / Tab Switcher (Gọn gàng, tinh tế) ── */}
        <View style={s.tabContainer}>
          <Pressable
            onPress={() => setActiveTab('roleplay')}
            style={[s.tabItem, activeTab === 'roleplay' && s.tabItemActive]}
          >
            <Bot
              color={activeTab === 'roleplay' ? ADMIN_THEME.primary : ADMIN_THEME.textMuted}
              size={16}
            />
            <Text style={[s.tabText, activeTab === 'roleplay' && s.tabTextActive]}>
              Hội thoại AI
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('pronunciation')}
            style={[s.tabItem, activeTab === 'pronunciation' && s.tabItemActive]}
          >
            <Mic
              color={activeTab === 'pronunciation' ? ADMIN_THEME.primary : ADMIN_THEME.textMuted}
              size={16}
            />
            <Text style={[s.tabText, activeTab === 'pronunciation' && s.tabTextActive]}>
              Luyện phát âm IPA
            </Text>
          </Pressable>
        </View>


        {/* ── Loading State ────────────────────────────────────────────── */}
        {loading ? (
          <TabLoadingState
            message="Đang tải bài luyện nói & kịch bản..."
          />
        ) : null}

        {/* ── TAB 1: DANH SÁCH ROLEPLAY CARD ITEMS (GIỐNG ADMIN 100%) ────── */}
        {!loading && activeTab === 'roleplay' && (
          <View style={s.cardsGrid}>
            {filteredScenarios.length === 0 ? (
              <View style={s.emptyState}>
                <Bot color={ADMIN_THEME.textMuted} size={36} />
                <Text style={s.emptyTitle}>Không tìm thấy kịch bản phù hợp</Text>
                <Text style={s.emptySub}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</Text>
              </View>
            ) : (
              filteredScenarios.map((sc, index) => {
                const cefr = CEFR_BADGES[sc.cefr_level] || CEFR_BADGES.A1;
                const isLocked = sc.is_premium && !isPremium;

                return (
                  <Animated.View
                    key={sc.id}
                    entering={FadeInDown.delay(index * 40).duration(240)}
                  >
                    <Pressable
                      onPress={() => {
                        if (isLocked) {
                          router.push('/(student)/profile/premium' as any);
                          return;
                        }
                        router.push(`/(student)/practice/speaking/roleplay/${sc.id}` as any);
                      }}
                      style={({ pressed }) => [
                        s.scenarioCard,
                        pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
                      ]}
                    >
                      {/* Top: Cover Image Aspect Ratio 16/10 với Level Badge */}
                      <View style={s.cardImageContainer}>
                        {sc.image_url ? (
                          <Image source={{ uri: sc.image_url }} style={s.cardCoverImage} resizeMode="cover" />
                        ) : (
                          <View style={[s.cardCoverImage, { backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' }]}>
                            <MessageCircle size={32} color={AppColors.primary} />
                          </View>
                        )}
                        {/* Level Tag góc trên bên trái */}
                        <View
                          style={[
                            s.cefrLevelTag,
                            {
                              backgroundColor: cefr.bg,
                              borderColor: cefr.border,
                            },
                          ]}
                        >
                          <Text style={[s.cefrLevelText, { color: cefr.text }]}>
                            {sc.cefr_level || 'A1'}
                          </Text>
                        </View>

                        {/* Tag Khóa / Premium nếu có */}
                        {sc.is_premium && (
                          <View style={s.premiumBadge}>
                            <Lock color="#FFFFFF" size={10} />
                            <Text style={s.premiumBadgeText}>Premium</Text>
                          </View>
                        )}
                      </View>

                      {/* Bottom: Tiêu đề & Mô tả ngắn gọn đúng chuẩn Admin */}
                      <View style={s.cardContent}>
                        {/* Category & Persona */}
                        <View style={s.cardMetaRow}>
                          <Text style={s.cardCategoryText}>
                            {sc.category || 'Giao tiếp'}
                          </Text>
                          <Text style={s.cardPersonaText} numberOfLines={1}>
                            Đối thoại: {sc.ai_persona}
                          </Text>
                        </View>

                        <Text style={s.cardTitle} numberOfLines={1}>
                          {sc.title_en || sc.title}
                        </Text>

                        {sc.title_en && sc.title !== sc.title_en ? (
                          <Text style={s.cardTitleVi} numberOfLines={1}>
                            {sc.title}
                          </Text>
                        ) : null}

                        <Text style={s.cardDescription} numberOfLines={2}>
                          "{sc.opening_line}"
                        </Text>

                        {/* Action Bar */}
                        <View style={s.cardFooter}>
                          <View style={s.footerKeywords}>
                            {sc.suggested_keywords && sc.suggested_keywords.length > 0 ? (
                              <Text style={s.footerKeywordPill} numberOfLines={1}>
                                Gợi ý: {sc.suggested_keywords[0]}
                              </Text>
                            ) : (
                              <Text style={s.footerKeywordPill}>Phản xạ 2 chiều</Text>
                            )}
                          </View>
                          <View style={s.startBtn}>
                            <Text style={s.startBtnText}>Luyện ngay</Text>
                            <ChevronRight color={ADMIN_THEME.primary} size={14} />
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </View>
        )}

        {/* ── TAB 2: DANH SÁCH BÀI PHÁT ÂM IPA (CARD ITEM CHUẨN GIAO DIỆN) ────────── */}
        {!loading && activeTab === 'pronunciation' && (
          <View style={s.cardsGrid}>
            {filteredLessons.length === 0 ? (
              <View style={s.emptyState}>
                <Mic color={ADMIN_THEME.textMuted} size={36} />
                <Text style={s.emptyTitle}>Chưa có bài phát âm phù hợp</Text>
                <Text style={s.emptySub}>Thử tìm kiếm âm khác hoặc tất cả chủ đề</Text>
              </View>
            ) : (
              filteredLessons.map((item, index) => {
                const cefr = CEFR_BADGES[item.cefrLevel] || CEFR_BADGES.A1;

                return (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.delay(index * 35).duration(240)}
                  >
                    <Pressable
                      onPress={() => {
                        router.push(
                          `/(student)/practice/speaking/single-practice?lessonId=${item.id}&target=${encodeURIComponent(
                            item.targetText
                          )}` as any
                        );
                      }}
                      style={({ pressed }) => [
                        s.pronCard,
                        pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
                      ]}
                    >
                      {/* Header: Icon + Category + CEFR Tag */}
                      <View style={s.pronCardHeader}>
                        <View style={s.pronIconBox}>
                          <Volume2 color="#4F46E5" size={18} strokeWidth={2.2} />
                        </View>

                        <View style={s.pronHeaderMeta}>
                          <View style={s.pronCardLevelRow}>
                            <View
                              style={[
                                s.cefrLevelTagMini,
                                {
                                  backgroundColor: cefr.bg,
                                  borderColor: cefr.border,
                                },
                              ]}
                            >
                              <Text style={[s.cefrLevelTextMini, { color: cefr.text }]}>
                                {item.cefrLevel || 'A1'}
                              </Text>
                            </View>
                            <Text style={s.pronCategoryText} numberOfLines={1}>
                              {item.category || 'Phát âm'}
                            </Text>
                          </View>

                          <Text style={s.pronTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                        </View>
                      </View>

                      {/* Thanh từ vựng & Phiên âm IPA co giãn chuẩn xác, không vỡ layout */}
                      <View style={s.pronTargetBar}>
                        <View style={s.pronTargetLeft}>
                          <Text style={s.pronTargetLabel}>Mẫu:</Text>
                          <Text style={s.pronTargetWord} numberOfLines={1}>
                            {item.targetText}
                          </Text>
                        </View>

                        <View style={s.ipaPill}>
                          <Text style={s.ipaPillText} numberOfLines={1}>
                            {item.ipaTranscription || `/${item.targetText?.toLowerCase()}/`}
                          </Text>
                        </View>
                      </View>

                      {/* Khẩu hình hoặc mô tả */}
                      {item.meaningVi ? (
                        <Text style={s.pronDesc} numberOfLines={2}>
                          {item.meaningVi}
                        </Text>
                      ) : null}

                      {/* Footer bài phát âm */}
                      <View style={s.pronFooter}>
                        <View style={s.pronFooterAiBadge}>
                          <Sparkles color="#6366F1" size={13} strokeWidth={2} />
                          <Text style={s.pronFooterAiText}>Chấm khẩu hình AI</Text>
                        </View>
                        <View style={s.startBtn}>
                          <Text style={s.startBtnText}>Luyện ngay</Text>
                          <ChevronRight color={ADMIN_THEME.primary} size={14} strokeWidth={2.5} />
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ADMIN_THEME.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // App Bar
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: ADMIN_THEME.border,
  },
  appBarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  appBarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ADMIN_THEME.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  appBarBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ADMIN_THEME.primary,
    letterSpacing: 0.2,
  },
  appBarHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: ADMIN_THEME.textMain,
  },
  quotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  quotaPillTextPremium: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
  },
  quotaPillTextFree: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ADMIN_THEME.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 6,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: ADMIN_THEME.textMain,
    paddingVertical: 0,
  },
  clearBtn: {
    paddingHorizontal: 6,
  },
  clearBtnText: {
    fontSize: 18,
    color: ADMIN_THEME.textMuted,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: ADMIN_THEME.textMuted,
  },
  tabTextActive: {
    color: ADMIN_THEME.textMain,
    fontWeight: '700',
  },

  // Category Chips
  categoryList: {
    gap: 8,
    paddingBottom: 14,
    paddingTop: 2,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  catChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },

  // Cards Grid
  cardsGrid: {
    gap: 14,
  },

  // Scenario Card (Chuẩn SpeakingScenarioCard.jsx ở Admin)
  scenarioCard: {
    backgroundColor: ADMIN_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  cardCoverImage: {
    width: '100%',
    height: '100%',
  },
  cefrLevelTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  cefrLevelText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  premiumBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardContent: {
    padding: 14,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: ADMIN_THEME.primary,
    textTransform: 'uppercase',
  },
  cardPersonaText: {
    fontSize: 11,
    color: ADMIN_THEME.textMuted,
    maxWidth: '60%',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: ADMIN_THEME.textMain,
    marginBottom: 2,
  },
  cardTitleVi: {
    fontSize: 12,
    fontWeight: '500',
    color: ADMIN_THEME.textSub,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12,
    color: ADMIN_THEME.textSub,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  footerKeywords: {
    flex: 1,
    marginRight: 8,
  },
  footerKeywordPill: {
    fontSize: 11,
    color: ADMIN_THEME.textMuted,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  startBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: ADMIN_THEME.primary,
  },

  // Pronunciation Card Item
  pronCard: {
    backgroundColor: ADMIN_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  pronCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pronIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pronHeaderMeta: {
    flex: 1,
    marginLeft: 12,
  },
  pronCardLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  cefrLevelTagMini: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  cefrLevelTextMini: {
    fontSize: 10,
    fontWeight: '800',
  },
  pronCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  pronTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: ADMIN_THEME.textMain,
  },
  pronTargetBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  pronTargetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  pronTargetLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  pronTargetWord: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    flexShrink: 1,
  },
  ipaPill: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '52%',
  },
  ipaPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    fontStyle: 'italic',
  },
  pronDesc: {
    fontSize: 12,
    color: ADMIN_THEME.textSub,
    lineHeight: 18,
    marginBottom: 10,
  },
  pronFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  pronFooterAiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pronFooterAiText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },

  // Empty & Loading
  centerBox: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: ADMIN_THEME.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADMIN_THEME.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ADMIN_THEME.textSub,
  },
  emptySub: {
    fontSize: 12,
    color: ADMIN_THEME.textMuted,
  },
});
