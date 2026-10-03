import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Trophy,
  ArrowLeft,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Sparkles,
  Headphones,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  Award,
} from 'lucide-react-native';
import { useExamResultQuery } from '../../application/useExamAttempt';

import { colors } from '@/src/theme/colors';
import { font } from '@/src/theme/typography';

export function ExamResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ attemptId?: string; answers?: string; timeSpent?: string }>();
  const parsedAttemptId = Number(params.attemptId);
  const attemptId = Number.isInteger(parsedAttemptId) && parsedAttemptId > 0 ? parsedAttemptId : null;
  const resultQuery = useExamResultQuery(attemptId);

  const result = resultQuery.data ?? null;
  const questions = result?.questions ?? [];
  const isToeicResult = result?.scoringType === 'TOEIC_ESTIMATED';
  const userAnswers = useMemo(() => Object.fromEntries(
    questions.filter((q) => q.selectedAnswer).map((q) => [q.id, q.selectedAnswer])
  ), [questions]);

  const [expandedQId, setExpandedQId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'CORRECT' | 'WRONG'>('ALL');

  // Compute stats
  const stats = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    let listeningCorrect = 0;
    let listeningTotal = 0;
    let readingCorrect = 0;
    let readingTotal = 0;

    const partStats: { [key: string]: { correct: number; total: number; name: string } } = {};

    questions.forEach((q) => {
      const isListening = isToeicResult && ['PART_1', 'PART_2', 'PART_3', 'PART_4'].includes(q.part);
      if (isToeicResult) {
        if (isListening) listeningTotal++;
        else readingTotal++;
      }

      if (!partStats[q.part]) partStats[q.part] = { correct: 0, total: 0, name: q.partSubTitle || q.partLabel };
      partStats[q.part].total++;

      const ans = userAnswers[q.id];
      if (!ans) {
        unanswered++;
      } else if (ans === q.correctAnswer) {
        correct++;
        if (isToeicResult) {
          if (isListening) listeningCorrect++;
          else readingCorrect++;
        }
        partStats[q.part].correct++;
      } else {
        wrong++;
      }
    });

    const listeningScore = Math.min(495, Math.round((listeningCorrect / Math.max(1, listeningTotal)) * 495));
    const readingScore = Math.min(495, Math.round((readingCorrect / Math.max(1, readingTotal)) * 495));
    const totalScore = listeningScore + readingScore;

    return {
      correct,
      wrong,
      unanswered,
      listeningScore,
      readingScore,
      totalScore,
      listeningCorrect,
      listeningTotal,
      readingCorrect,
      readingTotal,
      partStats,
    };
  }, [questions, userAnswers, isToeicResult]);

  const formatDuration = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  // Filtered questions for review
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const userAns = userAnswers[q.id];
      const isCorrect = userAns === q.correctAnswer;
      if (filterMode === 'CORRECT') return isCorrect;
      if (filterMode === 'WRONG') return userAns && !isCorrect;
      return true;
    });
  }, [questions, userAnswers, filterMode]);

  if (resultQuery.isLoading) {
    return <View style={styles.loadingState}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.loadingText}>Đang tải kết quả...</Text></View>;
  }

  if (!result) {
    return <View style={styles.loadingState}><XCircle color={colors.primary} size={34} /><Text style={styles.loadingTitle}>Không tải được kết quả</Text><Text style={styles.loadingText}>{(resultQuery.error as any)?.response?.data?.message || 'Kết quả không tồn tại hoặc bài chưa được nộp.'}</Text><Pressable style={styles.loadingButton} onPress={() => router.replace('/(student)/learn')}><Text style={styles.loadingButtonText}>Về danh sách bài thi</Text></Pressable></View>;
  }

  const handleBackToCatalog = () => {
    router.replace({
      pathname: '/(student)/learn',
      params: {
        tab: 'quiz',
        ...(result?.xpEarned ? { xpAwarded: String(result.xpEarned) } : {}),
      },
    });
  };

  return (
    <View style={styles.root}>
      {/* ─── HEADER ─── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 6 }]}>
        <Pressable
          onPress={handleBackToCatalog}
          hitSlop={10}
          style={styles.headerBtn}
        >
          <ArrowLeft color={colors.text} size={22} strokeWidth={2.2} />
        </Pressable>

        <Text style={styles.headerTitle}>Kết quả bài kiểm tra</Text>

        <Pressable hitSlop={10} style={styles.headerBtn}>
          <Share2 color={colors.textSoft} size={20} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* ─── 1. HERO SCORE CARD ─── */}
        <View style={styles.heroCard}>
          <View style={styles.trophyIconWrap}>
            <Trophy color="#F59E0B" size={36} />
          </View>

          <Text style={styles.heroSubText}>
            {isToeicResult ? 'ĐIỂM TOEIC ƯỚC TÍNH' : 'KẾT QUẢ BÀI KIỂM TRA'}
          </Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreNumber}>{result.displayScore}</Text>
            <Text style={styles.scoreMax}>
              / {result.maximumScore}
              {!isToeicResult ? ' điểm' : ''}
            </Text>
          </View>

          <View style={styles.heroBadgeRow}>
            <View style={styles.cefrBadge}>
              <Award color={colors.primary} size={13} />
              <Text style={styles.cefrBadgeText}>
                {result.cefrLevel ? `${result.cefrLevel} · ` : ''}{result.passed ? 'Đạt mục tiêu' : 'Chưa đạt mục tiêu'}
              </Text>
            </View>
            {result.xpEarned > 0 ? <View style={styles.diffBadge}>
              <Sparkles color="#16A34A" size={13} />
              <Text style={styles.diffBadgeText}>+{result.xpEarned} XP</Text>
            </View> : null}
          </View>
        </View>

        {/* ─── 2. SECTION BREAKDOWN (Listening vs Reading - chỉ cho TOEIC) ─── */}
        {isToeicResult && (stats.listeningTotal > 0 || stats.readingTotal > 0) ? <View style={styles.sectionRow}>
          {/* Listening */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#E0F2FE' }]}>
                <Headphones color="#0284C7" size={18} />
              </View>
              <Text style={styles.sectionTitle}>Listening</Text>
            </View>
            <Text style={styles.sectionScore}>
              {stats.listeningCorrect}
              <Text style={styles.sectionScoreMax}> / {stats.listeningTotal} câu</Text>
            </Text>
            <Text style={styles.sectionSub}>Part 1, 2, 3, 4</Text>
            <View style={styles.miniBarTrack}>
              <View
                style={[
                  styles.miniBarFill,
                  { width: `${Math.round((stats.listeningCorrect / Math.max(1, stats.listeningTotal)) * 100)}%`, backgroundColor: '#0284C7' },
                ]}
              />
            </View>
          </View>

          {/* Reading */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#EDE9FE' }]}>
                <BookOpen color="#7C3AED" size={18} />
              </View>
              <Text style={styles.sectionTitle}>Reading</Text>
            </View>
            <Text style={styles.sectionScore}>
              {stats.readingCorrect}
              <Text style={styles.sectionScoreMax}> / {stats.readingTotal} câu</Text>
            </Text>
            <Text style={styles.sectionSub}>Part 5, 6, 7</Text>
            <View style={styles.miniBarTrack}>
              <View
                style={[
                  styles.miniBarFill,
                  { width: `${Math.round((stats.readingCorrect / Math.max(1, stats.readingTotal)) * 100)}%`, backgroundColor: '#7C3AED' },
                ]}
              />
            </View>
          </View>
        </View> : null}

        {/* ─── 3. OVERVIEW METRICS ─── */}
        {(() => {
          const answeredCount = (result.correctAnswers ?? 0) + (result.wrongAnswers ?? 0);
          const accuracyPct = answeredCount > 0
            ? Math.round(((result.correctAnswers ?? 0) / answeredCount) * 100)
            : Math.round(result.scorePercentage ?? 0);

          return (
            <View style={styles.metricsBox}>
              <View style={styles.metricItem}>
                <CheckCircle2 color="#16A34A" size={18} />
                <Text style={styles.metricVal}>{result.correctAnswers}</Text>
                <Text style={styles.metricLbl}>Đúng</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <XCircle color="#EF4444" size={18} />
                <Text style={styles.metricVal}>{result.wrongAnswers}</Text>
                <Text style={styles.metricLbl}>Sai</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Clock color={colors.textSoft} size={18} />
                <Text style={styles.metricVal}>{formatDuration(result.timeSpentSeconds)}</Text>
                <Text style={styles.metricLbl}>Thời gian</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Target color="#2563EB" size={18} />
                <Text style={styles.metricVal}>
                  {accuracyPct}%
                </Text>
                <Text style={styles.metricLbl}>Độ chính xác</Text>
              </View>
            </View>
          );
        })()}

        {/* ─── 4. FULL 7 PARTS PROGRESS BREAKDOWN ─── */}
        {Object.keys(stats.partStats).length > 0 ? (
          <View style={styles.cardWrapper}>
            <Text style={styles.blockTitle}>
              {isToeicResult ? 'Chi tiết theo từng phần thi' : 'Chi tiết các phần'}
            </Text>
            <View style={styles.partsList}>
              {Object.entries(stats.partStats).map(([key, partData]) => {
                const pct = partData.total > 0 ? Math.round((partData.correct / partData.total) * 100) : 0;
                const isHigh = pct >= 80;

                return (
                  <View key={key} style={styles.partRow}>
                    <View style={styles.partRowLeft}>
                      <Text style={styles.partRowName}>{partData.name}</Text>
                      <Text style={styles.partRowRatio}>
                        {partData.correct}/{partData.total} câu ({pct}%)
                      </Text>
                    </View>
                    <View style={styles.partRowRight}>
                      <View style={styles.partBarTrack}>
                        <View
                          style={[
                            styles.partBarFill,
                            {
                              width: `${pct}%`,
                              backgroundColor: isHigh ? '#16A34A' : pct >= 50 ? '#F59E0B' : '#EF4444',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* ─── 5. QUESTION REVIEW & EXPLANATIONS ─── */}
        <View style={styles.cardWrapper}>
          <View style={styles.reviewHeader}>
            <Text style={styles.blockTitle}>Xem lại đáp án & giải thích chi tiết</Text>
          </View>

          {/* Filter Chips */}
          {(() => {
            const answeredCount = (result.correctAnswers ?? 0) + (result.wrongAnswers ?? 0);
            const totalCount = questions.length > 0 ? questions.length : answeredCount;
            const correctCount = questions.length > 0 ? stats.correct : (result.correctAnswers ?? 0);
            const wrongCount = questions.length > 0 ? stats.wrong : (result.wrongAnswers ?? 0);

            return (
              <View style={styles.filterChipRow}>
                <Pressable
                  onPress={() => setFilterMode('ALL')}
                  style={[styles.filterChip, filterMode === 'ALL' && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, filterMode === 'ALL' && styles.filterChipTextActive]}>
                    Tất cả ({totalCount})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setFilterMode('CORRECT')}
                  style={[styles.filterChip, filterMode === 'CORRECT' && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, filterMode === 'CORRECT' && styles.filterChipTextActive]}>
                    Đúng ({correctCount})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setFilterMode('WRONG')}
                  style={[styles.filterChip, filterMode === 'WRONG' && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, filterMode === 'WRONG' && styles.filterChipTextActive]}>
                    Sai ({wrongCount})
                  </Text>
                </Pressable>
              </View>
            );
          })()}

          {/* Question Review List */}
          <View style={styles.questionList}>
            {filteredQuestions.length === 0 ? (
              <Text style={styles.emptyReviewText}>Không có câu hỏi trong bộ lọc này.</Text>
            ) : null}
            {filteredQuestions.map((q) => {
              const userAns = userAnswers[q.id];
              const isCorrect = userAns === q.correctAnswer;
              const isExpanded = expandedQId === q.id;

              return (
                <View key={q.id} style={styles.reviewItemCard}>
                  <Pressable
                    onPress={() => setExpandedQId(isExpanded ? null : q.id)}
                    style={styles.reviewItemHeader}
                  >
                    <View style={styles.reviewItemHeaderLeft}>
                      <View
                        style={[
                          styles.resultStatusBadge,
                          isCorrect ? styles.resultBadgeCorrect : styles.resultBadgeWrong,
                        ]}
                      >
                        {isCorrect ? (
                          <CheckCircle2 color="#16A34A" size={15} />
                        ) : (
                          <XCircle color="#EF4444" size={15} />
                        )}
                        <Text
                          style={[
                            styles.resultStatusText,
                            isCorrect ? styles.resultTextCorrect : styles.resultTextWrong,
                          ]}
                        >
                          Câu {q.questionNumber}
                        </Text>
                      </View>

                      <Text numberOfLines={1} style={styles.reviewQuestionShortText}>
                        {q.questionText}
                      </Text>
                    </View>

                    <View style={styles.reviewItemHeaderRight}>
                      <Text style={styles.userChoiceText}>
                        {userAns || 'Chưa chọn'} / {q.correctAnswer}
                      </Text>
                      {isExpanded ? (
                        <ChevronUp color={colors.textSoft} size={18} />
                      ) : (
                        <ChevronDown color={colors.textSoft} size={18} />
                      )}
                    </View>
                  </Pressable>

                  {/* Expanded Explanation */}
                  {isExpanded && (
                    <View style={styles.explanationBody}>
                      <Text style={styles.expSectionTitle}>Các lựa chọn:</Text>
                      <View style={styles.expOptionsList}>
                        {q.options.map((opt) => {
                          const isUserPicked = userAns === opt.key;
                          const isRight = q.correctAnswer === opt.key;

                          return (
                            <View
                              key={opt.key}
                              style={[
                                styles.expOptionRow,
                                isRight && styles.expOptionRowCorrect,
                                isUserPicked && !isRight && styles.expOptionRowWrong,
                              ]}
                            >
                              <View
                                style={[
                                  styles.expOptionKeyBadge,
                                  isRight && { backgroundColor: '#16A34A' },
                                  isUserPicked && !isRight && { backgroundColor: '#EF4444' },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.expOptionKeyText,
                                    (isRight || (isUserPicked && !isRight)) && { color: '#FFFFFF' },
                                  ]}
                                >
                                  {opt.key}
                                </Text>
                              </View>
                              <View style={styles.expOptionContent}>
                                <Text
                                  style={[
                                    styles.expOptionLabel,
                                    isRight && styles.expOptionLabelCorrect,
                                  ]}
                                >
                                  {opt.label}
                                </Text>
                                {opt.subLabel ? (
                                  <Text style={styles.expOptionSubLabel}>{opt.subLabel}</Text>
                                ) : null}
                              </View>
                              {isRight && <Check color="#16A34A" size={16} />}
                            </View>
                          );
                        })}
                      </View>

                      {/* Detailed Vietnamese explanation */}
                      <View style={styles.explanationBox}>
                        <View style={styles.explanationHeaderLine}>
                          <Sparkles color={colors.primary} size={15} />
                          <Text style={styles.explanationHeading}>Giải thích đáp án:</Text>
                        </View>
                        <Text style={styles.explanationViText}>{q.explanationVi}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ─── BOTTOM CTA ACTIONS ─── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
        <Pressable
          onPress={() => router.replace({ pathname: '/(student)/practice/exam/[examId]', params: { examId: String(result.examId) } } as any)}
          style={styles.retryBtn}
        >
          <RotateCcw color={colors.primary} size={17} />
          <Text style={styles.retryBtnText}>Làm lại</Text>
        </Pressable>

        <Pressable
          onPress={handleBackToCatalog}
          style={styles.catalogBtn}
        >
          <Text style={styles.catalogBtnText}>Danh sách đề</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12, backgroundColor: '#F8FAFC' },
  loadingTitle: { color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  loadingText: { color: colors.textSoft, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  loadingButton: { marginTop: 8, borderRadius: 12, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 12 },
  loadingButtonText: { color: '#FFFFFF', fontWeight: '800' },
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    fontFamily: font.family,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  // Hero Score Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trophyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 6,
    fontFamily: font.family,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: font.family,
  },
  scoreMax: {
    fontSize: 20,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 6,
    fontFamily: font.family,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cefrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  cefrBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    fontFamily: font.family,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  diffBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
    fontFamily: font.family,
  },

  // Sections
  sectionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    fontFamily: font.family,
  },
  sectionScore: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: font.family,
  },
  sectionScoreMax: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    fontFamily: font.family,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
    fontFamily: font.family,
  },
  miniBarTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Overview metrics
  metricsBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    gap: 4,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: font.family,
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
    fontFamily: font.family,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  // Card Wrapper
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    fontFamily: font.family,
  },

  // Parts List
  partsList: {
    gap: 12,
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partRowLeft: {
    flex: 1,
  },
  partRowName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: font.family,
  },
  partRowRatio: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
    fontFamily: font.family,
  },
  partRowRight: {
    width: 100,
  },
  partBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  partBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Review & Explanations
  reviewHeader: {
    marginBottom: 10,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    fontFamily: font.family,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  questionList: {
    gap: 10,
  },
  emptyReviewText: { fontSize: 13, color: '#64748B', textAlign: 'center', paddingVertical: 12 },
  reviewItemCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    overflow: 'hidden',
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  reviewItemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  resultStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resultBadgeCorrect: {
    backgroundColor: '#DCFCE7',
  },
  resultBadgeWrong: {
    backgroundColor: '#FEE2E2',
  },
  resultStatusText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: font.family,
  },
  resultTextCorrect: {
    color: '#16A34A',
  },
  resultTextWrong: {
    color: '#EF4444',
  },
  reviewQuestionShortText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
    flex: 1,
    fontFamily: font.family,
  },
  reviewItemHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userChoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: font.family,
  },

  // Explanation body
  explanationBody: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 14,
    gap: 10,
  },
  expSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: font.family,
  },
  expOptionsList: {
    gap: 6,
  },
  expOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expOptionRowCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  expOptionRowWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  expOptionKeyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expOptionKeyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: font.family,
  },
  expOptionContent: {
    flex: 1,
  },
  expOptionLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#1E293B',
    fontFamily: font.family,
  },
  expOptionLabelCorrect: {
    fontWeight: '600',
    color: '#16A34A',
  },
  expOptionSubLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
    fontFamily: font.family,
  },
  explanationBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginTop: 4,
  },
  explanationHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  explanationHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: font.family,
  },
  explanationViText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#1E293B',
    lineHeight: 19,
    fontFamily: font.family,
  },

  // Bottom CTA Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 12,
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    fontFamily: font.family,
  },
  catalogBtn: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  catalogBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: font.family,
  },
});
