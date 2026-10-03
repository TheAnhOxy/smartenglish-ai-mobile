import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  User,
  Zap,
  RotateCcw,
  Check,
  X,
  Minus,
  Info,
  Clock,
} from 'lucide-react-native';
import { colors } from '../../../../theme/colors';

export interface InlineQuestionReviewItem {
  id: number;
  questionNumber: number;
  prompt: string;
  status: 'correct' | 'incorrect' | 'skipped';
  userAnswer?: string;
  correctAnswer: string;
  explanation?: string;
}

export const QuizResultScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    score?: string;
    total?: string;
    time?: string;
    title?: string;
    level?: string;
    xp?: string;
    incorrect?: string;
    answered?: string;
    unanswered?: string;
  }>();

  const totalQuestions = parseInt(params.total || '10', 10);
  const correctCount = parseInt(params.score || '0', 10);
  const incorrectCount = params.incorrect !== undefined ? parseInt(params.incorrect, 10) : Math.max(0, parseInt(params.answered || '0', 10) - correctCount);
  const skippedCount = params.unanswered !== undefined ? parseInt(params.unanswered, 10) : Math.max(0, totalQuestions - correctCount - incorrectCount);
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const durationText = params.time || '05:00';
  const quizTitle = params.title || 'Bài Kiểm Tra Thực Hành';
  const levelText = params.level || `${totalQuestions} câu`;
  const xpEarned = params.xp || `+${correctCount * 10} XP`;

  // Sample inline review questions matching screenshot
  const inlineQuestions: InlineQuestionReviewItem[] = [
    {
      id: 1,
      questionNumber: 1,
      prompt: 'She usually _____ to work by bus.',
      status: 'correct',
      userAnswer: 'goes',
      correctAnswer: 'goes',
    },
    {
      id: 2,
      questionNumber: 2,
      prompt: 'The manager asked the team to _____ the project report before Friday.',
      status: 'incorrect',
      userAnswer: 'generate',
      correctAnswer: 'finalize',
      explanation:
        "Động từ 'finalize' (hoàn thiện/chốt) là kết hợp từ chính xác nhất với 'project report' trong ngữ cảnh công việc trước thời hạn Friday. 'Generate' thường dùng với data, leads, electricity.",
    },
    {
      id: 3,
      questionNumber: 3,
      prompt: 'If they had arrived earlier, they _____ the keynote speech.',
      status: 'skipped',
      correctAnswer: 'would have heard',
    },
  ];

  const handleRetake = () => {
    router.replace('/(student)/practice/quiz/play' as any);
  };

  const handleBackToList = () => {
    router.replace('/(student)/learn' as any);
  };

  const handleGoToDetailedReview = (questionNum?: number) => {
    router.push({
      pathname: '/(student)/practice/quiz/review' as any,
      params: { questionNumber: questionNum ? String(questionNum) : '1' },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>

        <Text style={styles.headerTitle}>Quiz Results</Text>

        <View style={styles.avatarWrap}>
          <User size={18} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Level and XP Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{levelText}</Text>
          </View>
          <View style={styles.xpBadge}>
            <Zap size={14} color="#0284C7" fill="#0284C7" />
            <Text style={styles.xpBadgeText}>⚡ {xpEarned}</Text>
          </View>
        </View>

        {/* Big Quiz Title */}
        <Text style={styles.quizTitle}>{quizTitle}</Text>

        {/* Score Ring Display */}
        <View style={styles.scoreContainer}>
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Text style={styles.scorePercentText}>{scorePercent}%</Text>
              <Text style={styles.scoreLabelText}>Điểm số</Text>
            </View>
          </View>

          <View style={styles.passBadge}>
            <Text style={styles.passBadgeText}>
              {scorePercent >= 80 ? 'Đạt tiêu chuẩn' : scorePercent >= 50 ? 'Cần cố gắng' : 'Chưa đạt'}
            </Text>
          </View>
        </View>

        {/* 4-column Stats Box */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Đúng</Text>
            <Text style={[styles.statValue, styles.statValueCorrect]}>{correctCount}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Sai</Text>
            <Text style={[styles.statValue, styles.statValueWrong]}>{incorrectCount}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Bỏ qua</Text>
            <Text style={[styles.statValue, styles.statValueSkip]}>{skippedCount}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <View style={styles.timeLabelRow}>
              <Clock size={12} color="#64748B" />
              <Text style={styles.statLabel}>Thời gian</Text>
            </View>
            <Text style={[styles.statValue, styles.statValueDark]}>{durationText}</Text>
          </View>
        </View>

        {/* Skills Assessment Section */}
        <View style={styles.skillSectionCard}>
          <Text style={styles.skillSectionTitle}>Kết quả theo kỹ năng</Text>
          <Text style={styles.skillSectionSub}>(Hiển thị khi có dữ liệu đánh giá)</Text>

          <View style={styles.skillItem}>
            <View style={styles.skillLabelRow}>
              <Text style={styles.skillName}>Ngữ pháp</Text>
              <Text style={styles.skillPercent}>85 %</Text>
            </View>
            <View style={styles.skillProgressTrack}>
              <View style={[styles.skillProgressFill, { width: '85%' }]} />
            </View>
          </View>

          <View style={styles.skillItem}>
            <View style={styles.skillLabelRow}>
              <Text style={styles.skillName}>Từ vựng</Text>
              <Text style={styles.skillPercent}>70 %</Text>
            </View>
            <View style={styles.skillProgressTrack}>
              <View style={[styles.skillProgressFill, { width: '70%' }]} />
            </View>
          </View>
        </View>

        {/* Review Answers List */}
        <View style={styles.reviewHeaderRow}>
          <Text style={styles.reviewSectionTitle}>
            Xem lại câu trả lời ({totalQuestions} câu)
          </Text>
        </View>

        <View style={styles.reviewList}>
          {inlineQuestions.map((q) => {
            const isCorrect = q.status === 'correct';
            const isWrong = q.status === 'incorrect';
            const isSkipped = q.status === 'skipped';

            return (
              <Pressable
                key={q.id}
                onPress={() => handleGoToDetailedReview(q.questionNumber)}
                style={({ pressed }) => [styles.questionReviewCard, pressed && styles.pressed]}
              >
                {/* Badge Status */}
                <View style={styles.cardBadgeRow}>
                  {isCorrect && (
                    <View style={styles.badgeCorrect}>
                      <Check size={13} color="#0284C7" />
                      <Text style={styles.badgeCorrectText}>Câu {q.questionNumber} · Đúng</Text>
                    </View>
                  )}
                  {isWrong && (
                    <View style={styles.badgeWrong}>
                      <X size={13} color="#DC2626" />
                      <Text style={styles.badgeWrongText}>Câu {q.questionNumber} · Sai</Text>
                    </View>
                  )}
                  {isSkipped && (
                    <View style={styles.badgeSkipped}>
                      <Minus size={13} color="#64748B" />
                      <Text style={styles.badgeSkippedText}>Câu {q.questionNumber} · Chưa trả lời</Text>
                    </View>
                  )}
                </View>

                {/* Prompt */}
                <Text style={styles.questionReviewPrompt}>{q.prompt}</Text>

                {/* Answers Badges */}
                <View style={styles.pillsWrap}>
                  {isCorrect && (
                    <View style={styles.pillAnswerCorrect}>
                      <Check size={14} color="#0F172A" />
                      <Text style={styles.pillAnswerCorrectText}>{q.userAnswer}</Text>
                    </View>
                  )}

                  {isWrong && (
                    <>
                      <View style={styles.pillAnswerWrong}>
                        <X size={14} color="#DC2626" />
                        <Text style={styles.pillAnswerWrongText}>{q.userAnswer}</Text>
                      </View>
                      <View style={styles.pillAnswerCorrectAlt}>
                        <Check size={14} color="#0F172A" />
                        <Text style={styles.pillAnswerCorrectAltText}>{q.correctAnswer}</Text>
                      </View>
                    </>
                  )}

                  {isSkipped && (
                    <View style={styles.pillAnswerSkipped}>
                      <Text style={styles.pillAnswerSkippedArrow}>→</Text>
                      <Text style={styles.pillAnswerSkippedText}>{q.correctAnswer}</Text>
                    </View>
                  )}
                </View>

                {/* Explanation Box */}
                {q.explanation && (
                  <View style={styles.explanationBox}>
                    <View style={styles.explanationTitleRow}>
                      <Info size={13} color="#1E40AF" />
                      <Text style={styles.explanationTitle}>Giải thích</Text>
                    </View>
                    <Text style={styles.explanationContent}>{q.explanation}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsFooter}>
          <Pressable
            onPress={handleRetake}
            style={({ pressed }) => [styles.btnRetake, pressed && styles.pressed]}
          >
            <RotateCcw size={18} color="#FFFFFF" />
            <Text style={styles.btnRetakeText}>Làm lại</Text>
          </Pressable>

          <Pressable
            onPress={handleBackToList}
            style={({ pressed }) => [styles.btnBackList, pressed && styles.pressed]}
          >
            <Text style={styles.btnBackListText}>Về danh sách Quiz</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F2C59',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  quizTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F2C59',
    marginBottom: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ringOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    borderColor: '#0F2C59',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  ringInner: {
    alignItems: 'center',
  },
  scorePercentText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F2C59',
  },
  scoreLabelText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  passBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  passBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  timeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statValueCorrect: {
    color: '#0284C7',
  },
  statValueWrong: {
    color: '#DC2626',
  },
  statValueSkip: {
    color: '#64748B',
  },
  statValueDark: {
    fontSize: 15,
    color: '#0F172A',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#F1F5F9',
  },
  skillSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  skillSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  skillSectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 14,
    marginTop: 2,
  },
  skillItem: {
    marginBottom: 12,
  },
  skillLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  skillName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  skillPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2C59',
  },
  skillProgressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  skillProgressFill: {
    height: '100%',
    backgroundColor: '#0F2C59',
    borderRadius: 4,
  },
  reviewHeaderRow: {
    marginBottom: 12,
  },
  reviewSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewList: {
    gap: 12,
    marginBottom: 24,
  },
  questionReviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardBadgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badgeCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeCorrectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  badgeWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeWrongText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  badgeSkipped: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeSkippedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  questionReviewPrompt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 10,
  },
  pillsWrap: {
    gap: 8,
  },
  pillAnswerCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  pillAnswerCorrectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  pillAnswerWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  pillAnswerWrongText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  pillAnswerCorrectAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  pillAnswerCorrectAltText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  pillAnswerSkipped: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  pillAnswerSkippedArrow: {
    fontSize: 15,
    color: '#64748B',
  },
  pillAnswerSkippedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  explanationBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  explanationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  explanationContent: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  actionsFooter: {
    gap: 10,
  },
  btnRetake: {
    height: 52,
    borderRadius: 16,
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
  btnRetakeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnBackList: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnBackListText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F2C59',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
