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
import { useAuthStore } from '@/src/core/flows/authStore';
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
  const [searchQuery, setSearchQuery] = useState('');

  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [pronLessons, setPronLessons] = useState<PronunciationLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchRoleplayScenariosApi(), fetchPronunciationLessonsApi()])
      .then(([roleplayData, lessonsData]) => {
        setScenarios(roleplayData);
        setPronLessons(lessonsData);
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
      {/* ── Top App Bar (Tối giản, chuyên nghiệp) ────────────────────────── */}
      <View style={s.appBar}>
        <View>
          <View style={s.appBarTitleRow}>
            <View style={s.appBarBadge}>
              <Bot color={ADMIN_THEME.primary} size={15} />
              <Text style={s.appBarBadgeText}>AI Practice Lab</Text>
            </View>
          </View>
          <Text style={s.appBarHeading}>Luyện Nói Tiếng Anh</Text>
        </View>

        {/* Quota Indicator thanh lịch ở góc phải */}
        <View style={s.quotaPill}>
          {isPremium ? (
            <>
              <Sparkles color="#6366F1" size={13} />
              <Text style={s.quotaPillTextPremium}>VIP</Text>
            </>
          ) : (
            <>
              <Flame color="#EA580C" size={13} />
              <Text style={s.quotaPillTextFree}>
                {quota.remaining}/{FREE_SPEAKING_DAILY_LIMIT} lượt
              </Text>
            </>
          )}
        </View>
      </View>

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
            <Pressable onPress={() => setSearchQuery('')} style={s.clearBtn}>
              <Text style={s.clearBtnText}>×</Text>
            </Pressable>
          )}
        </View>

        {/* ── Segmented Control / Tab Switcher (Khớp Admin 2 tab) ────────── */}
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
              Hội thoại AI Roleplay ({scenarios.length})
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
              Luyện phát âm IPA ({pronLessons.length})
            </Text>
          </Pressable>
        </View>

        {/* ── Category Chips Filter ─────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.categoryList}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[s.catChip, isSelected && s.catChipActive]}
              >
                <Text style={[s.catChipText, isSelected && s.catChipTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Loading State ────────────────────────────────────────────── */}
        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator color={ADMIN_THEME.primary} size="large" />
            <Text style={s.loadingText}>Đang tải dữ liệu học liệu...</Text>
          </View>
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
                const fallbackImg =
                  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80';

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
                        <Image
                          source={{ uri: sc.image_url || fallbackImg }}
                          style={s.cardCoverImage}
                          resizeMode="cover"
                        />
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

        {/* ── TAB 2: DANH SÁCH BÀI PHÁT ÂM IPA (CARD ITEM CHUẨN) ────────── */}
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
                      <View style={s.pronCardHeader}>
                        {/* Khối ký hiệu IPA lớn nổi bật */}
                        <View style={s.ipaBadge}>
                          <Text style={s.ipaBadgeSymbol}>
                            {item.ipaTranscription || '/.../'}
                          </Text>
                        </View>

                        <View style={{ flex: 1, marginLeft: 12 }}>
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
                                {item.cefrLevel}
                              </Text>
                            </View>
                            <Text style={s.pronCategoryText}>{item.category}</Text>
                          </View>

                          <Text style={s.pronTitle} numberOfLines={1}>
                            {item.title}
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
                        <View style={s.pronSampleWordBox}>
                          <Volume2 color={ADMIN_THEME.primary} size={13} />
                          <Text style={s.pronSampleWordText}>
                            Mẫu: {item.targetText}
                          </Text>
                        </View>
                        <View style={s.startBtn}>
                          <Text style={s.startBtnText}>Thực hành</Text>
                          <ChevronRight color={ADMIN_THEME.primary} size={14} />
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
    gap: 6,
    paddingBottom: 14,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ADMIN_THEME.border,
  },
  catChipActive: {
    backgroundColor: ADMIN_THEME.textMain,
    borderColor: ADMIN_THEME.textMain,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: ADMIN_THEME.textSub,
  },
  catChipTextActive: {
    color: '#FFFFFF',
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
    borderWidth: 1,
    borderColor: ADMIN_THEME.border,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN_THEME.border,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pronCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ipaBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: ADMIN_THEME.primarySoft,
    borderWidth: 1,
    borderColor: ADMIN_THEME.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ipaBadgeSymbol: {
    fontSize: 15,
    fontWeight: '800',
    color: ADMIN_THEME.primary,
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
    borderRadius: 4,
    borderWidth: 1,
  },
  cefrLevelTextMini: {
    fontSize: 10,
    fontWeight: '800',
  },
  pronCategoryText: {
    fontSize: 11,
    color: ADMIN_THEME.textMuted,
  },
  pronTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: ADMIN_THEME.textMain,
  },
  pronDesc: {
    fontSize: 12,
    color: ADMIN_THEME.textSub,
    lineHeight: 17,
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
  pronSampleWordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pronSampleWordText: {
    fontSize: 11,
    fontWeight: '600',
    color: ADMIN_THEME.textSub,
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
