import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Search,
  Mic,
  Flame,
  Clock,
  ListChecks,
  Target,
  Users,
  TrendingUp,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Layers,
  Sparkles,
  SlidersHorizontal,
  CheckCircle,
  CheckCircle2,
  RotateCcw,
  PlayCircle,
  ChevronDown,
  History,
  Zap,
} from 'lucide-react-native';
import { usePublishedExamsInfiniteQuery } from '../../application/useExamCatalog';
import { useUserExamHistoryQuery } from '../../application/useExamAttempt';
import { ExamCategory, CefrLevel, PublicExamSummary } from '../../data/examCatalogApi';
import { TabLoadingState } from '@/src/components/ui/TabLoadingState';
import {
  getAllSavedPracticeSessions,
  SavedPracticeSession,
} from '../../data/practiceSessionStorage';
import { colors } from '@/src/theme/colors';

export const EXAM_CATEGORY_LABELS: Record<string, string> = {
  TOEIC_FULL: 'TOEIC',
  TOEIC_MINI: 'TOEIC Mini',
  PLACEMENT: 'Đầu vào',
  GRAMMAR: 'Ngữ pháp',
  VOCABULARY: 'Từ vựng',
  READING: 'Đọc hiểu',
  LISTENING: 'Nghe hiểu',
  GENERAL: 'Tổng hợp',
};

const CATEGORY_TABS: { key: string; label: string; cat?: ExamCategory }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'TOEIC_FULL', label: 'TOEIC', cat: 'TOEIC_FULL' },
  { key: 'TOEIC_MINI', label: 'Mini Test', cat: 'TOEIC_MINI' },
  { key: 'PLACEMENT', label: 'Đầu vào', cat: 'PLACEMENT' },
  { key: 'GRAMMAR', label: 'Ngữ pháp', cat: 'GRAMMAR' },
  { key: 'VOCABULARY', label: 'Từ vựng', cat: 'VOCABULARY' },
  { key: 'READING', label: 'Đọc hiểu', cat: 'READING' },
  { key: 'LISTENING', label: 'Nghe hiểu', cat: 'LISTENING' },
  { key: 'GENERAL', label: 'Tổng hợp', cat: 'GENERAL' },
];

const CEFR_LEVELS = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function ExamCatalogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ xpAwarded?: string }>();
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchText, setSearchText] = useState<string>('');
  const [openFilter, setOpenFilter] = useState<'CATEGORY' | 'LEVEL' | null>(null);

  // XP Toast notification
  const [xpToast, setXpToast] = useState<number | null>(null);
  const xpToastOpacity = useRef(new Animated.Value(0)).current;
  const xpToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const xp = Number(params.xpAwarded ?? 0);
    if (xp > 0) {
      setXpToast(xp);
      Animated.sequence([
        Animated.timing(xpToastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(xpToastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => setXpToast(null));
    }
    return () => {
      if (xpToastTimer.current) clearTimeout(xpToastTimer.current);
    };
  }, [params.xpAwarded]);

  const activeCategory = CATEGORY_TABS.find((t) => t.key === selectedCategoryKey)?.cat;
  const selectedCategoryLabel = CATEGORY_TABS.find((t) => t.key === selectedCategoryKey)?.label || 'Tất cả';

  const query = usePublishedExamsInfiniteQuery({
    search: searchText.trim() || undefined,
    category: activeCategory,
    cefrLevel: selectedLevel !== 'ALL' ? (selectedLevel as any) : undefined,
    size: 20,
  });

  const historyQuery = useUserExamHistoryQuery();
  const [savedPracticeSessions, setSavedPracticeSessions] = useState<Record<number, SavedPracticeSession>>({});

  const refreshSavedSessions = useCallback(() => {
    const sessions = getAllSavedPracticeSessions();
    setSavedPracticeSessions(sessions);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshSavedSessions();
    }, [refreshSavedSessions])
  );

  useEffect(() => {
    refreshSavedSessions();
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('focus', refreshSavedSessions);
      return () => window.removeEventListener('focus', refreshSavedSessions);
    }
  }, [refreshSavedSessions]);

  const historyByExamId = useMemo(() => {
    const map: Record<number, any> = {};
    if (historyQuery.data && Array.isArray(historyQuery.data)) {
      for (const attempt of historyQuery.data) {
        if (!map[attempt.examId] || new Date(attempt.submittedAt || 0) > new Date(map[attempt.examId].submittedAt || 0)) {
          map[attempt.examId] = attempt;
        }
      }
    }
    return map;
  }, [historyQuery.data]);

  const backendExams = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  const displayExams = useMemo(() => {
    return backendExams.map((e) => {
      const catLabel = EXAM_CATEGORY_LABELS[e.category] || e.category;
      return {
        ...e,
        categoryDisplay: `${catLabel} • ${e.cefrLevel}`,
        targetScore: `${e.passingScore}+ Mục tiêu`,
      };
    });
  }, [backendExams]);

  const handleStartExam = (exam: any, mode: 'EXAM' | 'PRACTICE' = 'EXAM') => {
    router.push({
      pathname: '/(student)/practice/exam/[examId]' as any,
      params: { examId: String(exam.id), title: exam.title, mode },
    });
  };

  const handleRedoWrong = (exam: any, attempt: any) => {
    router.push({
      pathname: '/(student)/practice/exam/[examId]' as any,
      params: {
        examId: String(exam.id),
        title: exam.title,
        mode: 'PRACTICE',
        wrongOnly: 'true',
        sourceAttemptId: String(attempt.attemptId),
      },
    });
  };

  const handleReviewResult = (attempt: any) => {
    router.push({
      pathname: '/(student)/practice/exam/result' as any,
      params: { attemptId: String(attempt.attemptId) },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ─── XP EARNED TOAST ─── */}
      {xpToast !== null ? (
        <Animated.View style={[styles.xpToast, { opacity: xpToastOpacity }]} pointerEvents="none">
          <View style={styles.xpToastInner}>
            <Zap size={15} color="#FACC15" fill="#FACC15" />
            <Text style={styles.xpToastText}>+{xpToast} XP</Text>
          </View>
          <Text style={styles.xpToastSubText}>Kinh nghiệm nhận được!</Text>
        </Animated.View>
      ) : null}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar with Mic */}
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm đề thi, chủ đề TOEIC..."
            placeholderTextColor="#94A3B8"
            value={searchText}
            onChangeText={setSearchText}
          />
          <Pressable style={styles.micBtn}>
            <Mic size={18} color="#64748B" />
          </Pressable>
        </View>

                {/* Streak Badge Row */}
        <View style={styles.streakBanner}>
          <View style={styles.streakLeft}>
            <View style={styles.flameCircle}>
              <Flame size={16} color="#38BDF8" fill="#38BDF8" />
            </View>
            <Text style={styles.streakTitle}>Chuỗi học 5 ngày</Text>
          </View>
          <Text style={styles.streakXpText}>+200 XP</Text>
        </View>

        {/* Compact filters: two dropdowns share one right-aligned row. */}
        <View style={styles.compactFiltersRow}>
          <View style={styles.filterDropdownWrap}>
            <Pressable
              onPress={() => setOpenFilter((value) => value === 'CATEGORY' ? null : 'CATEGORY')}
              style={[styles.filterDropdownButton, selectedCategoryKey !== 'ALL' && styles.filterDropdownButtonActive]}
            >
              <Text numberOfLines={1} style={styles.filterDropdownButtonText}>{selectedCategoryLabel}</Text>
              <ChevronDown size={15} color="#475569" />
            </Pressable>
            {openFilter === 'CATEGORY' ? (
              <View style={[styles.filterDropdownMenu, styles.categoryDropdownMenu]}>
                {CATEGORY_TABS.map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => {
                      setSelectedCategoryKey(item.key);
                      setOpenFilter(null);
                    }}
                    style={styles.filterDropdownOption}
                  >
                    <Text style={[styles.filterDropdownOptionText, selectedCategoryKey === item.key && styles.filterDropdownOptionTextActive]}>
                      {item.label}
                    </Text>
                    {selectedCategoryKey === item.key ? <CheckCircle2 size={15} color="#0F2C59" /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.filterDropdownWrap}>
            <Pressable
              onPress={() => setOpenFilter((value) => value === 'LEVEL' ? null : 'LEVEL')}
              style={[styles.filterDropdownButton, selectedLevel !== 'ALL' && styles.filterDropdownButtonActive]}
            >
              <Text style={styles.filterDropdownButtonText}>{selectedLevel === 'ALL' ? 'Mọi cấp độ' : selectedLevel}</Text>
              <ChevronDown size={15} color="#475569" />
            </Pressable>
            {openFilter === 'LEVEL' ? (
              <View style={[styles.filterDropdownMenu, styles.levelDropdownMenu]}>
                {CEFR_LEVELS.map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => {
                      setSelectedLevel(level);
                      setOpenFilter(null);
                    }}
                    style={styles.filterDropdownOption}
                  >
                    <Text style={[styles.filterDropdownOptionText, selectedLevel === level && styles.filterDropdownOptionTextActive]}>
                      {level === 'ALL' ? 'Mọi cấp độ' : level}
                    </Text>
                    {selectedLevel === level ? <CheckCircle2 size={15} color="#0F2C59" /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {/* Loading Spinner when fetching */}
        {query.isLoading && (
          <TabLoadingState
            message="Đang tải danh sách bài thi..."
          />
        )}

        {/* Empty State */}
        {displayExams.length === 0 && !query.isLoading && (
          <View style={styles.emptyContainer}>
            <BookOpen size={42} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Chưa có bài thi nào</Text>
            <Text style={styles.emptySubtitle}>Không tìm thấy bài thi phù hợp với danh mục này.</Text>
          </View>
        )}

        {/* Exam Cards List */}
        <View style={styles.cardsList}>
          {displayExams.map((exam) => {
            const latestAttempt = historyByExamId[exam.id];
            const hasAttempt = Boolean(latestAttempt);
            const wrongCount = latestAttempt?.wrongAnswers ?? 0;
            const practiceSession = savedPracticeSessions[exam.id];
            const hasInProgressPractice = Boolean(
              practiceSession &&
              !practiceSession.isCompleted &&
              practiceSession.answers &&
              Object.keys(practiceSession.answers).length > 0
            );

            return (
              <View key={exam.id} style={styles.examCard}>
                {/* Badge Row */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.headerLeftGroup}>
                    <View style={styles.cardTagBadge}>
                      <GraduationCap size={13} color="#0284C7" />
                      <Text style={styles.cardTagBadgeText}>{exam.categoryDisplay}</Text>
                    </View>

                    {hasAttempt && wrongCount > 0 && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleRedoWrong(exam, latestAttempt)}
                        style={styles.redoWrongTopBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <RotateCcw size={15} color="#0284C7" strokeWidth={2.4} />
                        <View style={styles.redoWrongBadge}>
                          <Text style={styles.redoWrongBadgeText}>{wrongCount}</Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {hasAttempt && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleReviewResult(latestAttempt)}
                        style={styles.historyTopBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Lịch sử thi"
                      >
                        <History size={15} color="#059669" strokeWidth={2.4} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.cardXpBadge}>
                    <Sparkles size={13} color="#0284C7" />
                    <Text style={styles.cardXpBadgeText}>+{exam.xpReward} XP</Text>
                  </View>
                </View>

                {/* In-progress Practice Banner */}
                {hasInProgressPractice && (
                  <View style={styles.inProgressBadge}>
                    <Clock size={13} color="#D97706" />
                    <Text style={styles.inProgressBadgeText}>
                      Đang làm câu {practiceSession.questionNumber || (practiceSession.currentIndex + 1)}/{practiceSession.totalQuestions || exam.totalQuestions}
                    </Text>
                  </View>
                )}

                {/* Attempt Status Banner (Real from BE) */}
                {hasAttempt && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleReviewResult(latestAttempt)}
                    style={styles.historyBadge}
                  >
                    <CheckCircle2 size={14} color="#16A34A" />
                    <Text style={styles.historyBadgeText}>
                      Gần nhất: {latestAttempt.displayScore} điểm ({latestAttempt.correctAnswers}/{latestAttempt.totalQuestions || exam.totalQuestions} đúng)
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Title */}
                <Text style={styles.cardTitle}>{exam.title}</Text>

                {/* 3-Column Stats Box */}
                <View style={styles.statsCardBox}>
                  <View style={styles.statColItem}>
                    <View style={styles.statColValueRow}>
                      <Clock size={13} color="#64748B" />
                      <Text style={styles.statColValue}>{exam.durationMinutes}p</Text>
                    </View>
                    <Text style={styles.statColLabel}>Thời gian</Text>
                  </View>

                  <View style={styles.statColDivider} />

                  <View style={styles.statColItem}>
                    <View style={styles.statColValueRow}>
                      <ListChecks size={13} color="#64748B" />
                      <Text style={styles.statColValue}>{exam.totalQuestions} câu</Text>
                    </View>
                    <Text style={styles.statColLabel}>Số câu</Text>
                  </View>

                  <View style={styles.statColDivider} />

                  <View style={styles.statColItem}>
                    <View style={styles.statColValueRow}>
                      <Target size={13} color="#64748B" />
                      <Text style={styles.statColValue}>{exam.targetScore.split(' ')[0]}</Text>
                    </View>
                    <Text style={styles.statColLabel}>Mục tiêu</Text>
                  </View>
                </View>

                {/* Action Buttons Row: 1 hàng duy nhất chia đều không gian, màu nền solid và viền đậm rõ nét trên iPhone/Android */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleStartExam(exam, 'PRACTICE')}
                    style={[
                      styles.actionBtn,
                      styles.btnPracticeMode,
                      hasInProgressPractice && styles.btnPracticeModeActive,
                    ]}
                  >
                    {hasInProgressPractice ? (
                      <RotateCcw size={14} color="#FFFFFF" strokeWidth={2.2} />
                    ) : (
                      <PlayCircle size={14} color="#FFFFFF" strokeWidth={2.2} />
                    )}
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[
                        styles.actionBtnText,
                        styles.btnPracticeModeText,
                        hasInProgressPractice && styles.btnPracticeModeTextActive,
                      ]}
                    >
                      {hasInProgressPractice ? 'Tiếp tục' : 'Luyện tập'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleStartExam(exam, 'EXAM')}
                    style={[styles.actionBtn, styles.btnExamMode]}
                  >
                    <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.2} />
                    <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.actionBtnText, styles.btnExamModeText]}>
                      {hasAttempt ? 'Thi lại' : 'Thi thử'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // ─── XP TOAST ───
  xpToast: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 999,
    backgroundColor: '#0F2C59',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
    minWidth: 120,
  },
  xpToastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  xpToastText: {
    color: '#FACC15',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  xpToastSubText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  micBtn: {
    padding: 6,
  },
  compactFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 14,
    zIndex: 20,
  },
  filterDropdownWrap: { position: 'relative' },
  filterDropdownButton: {
    minWidth: 112,
    maxWidth: 180,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterDropdownButtonActive: { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' },
  filterDropdownButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    flexShrink: 1,
  },
  filterDropdownMenu: {
    position: 'absolute',
    top: 42,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
    zIndex: 30,
  },
  categoryDropdownMenu: { width: 220 },
  levelDropdownMenu: { width: 150 },
  filterDropdownOption: {
    minHeight: 38,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 9,
  },
  filterDropdownOptionText: { fontSize: 12.5, fontWeight: '600', color: '#475569' },
  filterDropdownOptionTextActive: { color: '#0F2C59', fontWeight: '800' },
  streakBanner: {
    backgroundColor: '#0F2C59',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#0F2C59',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  flameCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakTexts: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  streakSubtitle: {
    fontSize: 11,
    color: '#BAE6FD',
    marginTop: 2,
  },
  streakXpText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  cardsList: {
    gap: 14,
  },
  examCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redoWrongTopBtn: {
    position: 'relative',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redoWrongBadge: {
    position: 'absolute',
    top: -5,
    right: -7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 3,
  },
  redoWrongBadgeText: {
    color: '#EF4444',
    fontSize: 9.5,
    fontWeight: '900',
    lineHeight: 11,
  },
  historyTopBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardTagBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  cardXpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardXpBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 23,
    marginBottom: 4,
  },
  statsCardBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statColItem: {
    alignItems: 'center',
    flex: 1,
  },
  statColValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statColValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  statColLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  statColDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaTextCyan: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  btnStartExam: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0F2C59',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0F2C59',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  btnStartExamText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  historyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  btnRedoWrong: {
    backgroundColor: '#EA580C',
    borderColor: '#FB923C',
  },
  btnRedoWrongText: {
    color: '#FFFFFF',
  },
  btnPracticeMode: {
    backgroundColor: '#0F2C59',
    borderColor: '#38BDF8',
  },
  btnPracticeModeActive: {
    backgroundColor: '#0284C7',
    borderColor: '#7DD3FC',
  },
  btnPracticeModeText: {
    color: '#FFFFFF',
  },
  btnPracticeModeTextActive: {
    color: '#FFFFFF',
  },
  btnExamMode: {
    backgroundColor: '#2563EB',
    borderColor: '#93C5FD',
  },
  btnExamModeText: {
    color: '#FFFFFF',
  },
  btnHistoryMode: {
    backgroundColor: '#059669',
    borderColor: '#6EE7B7',
  },
  btnHistoryModeText: {
    color: '#FFFFFF',
  },
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  inProgressBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
