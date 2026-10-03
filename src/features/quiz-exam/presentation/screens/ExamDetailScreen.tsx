import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  EyeOff,
  FileQuestion,
  Flag,
  Headphones,
  RotateCcw,
  Sparkles,
  TimerReset,
  Zap,
} from 'lucide-react-native';
import { usePublishedExamDetailQuery } from '../../application/useExamCatalog';
import { useStartExamAttempt } from '../../application/useExamAttempt';
import { ExamCategory, PublicExamSection } from '../../data/examCatalogApi';
import { EXAM_CATEGORY_LABELS } from './ExamCatalogScreen';
import { colors } from '@/src/theme/colors';
import { font } from '@/src/theme/typography';

function SectionIcon({ sectionName }: { sectionName?: string | null }) {
  const name = sectionName?.toUpperCase() ?? '';
  const props = { color: colors.primary, size: 22, strokeWidth: 1.9 };
  if (name.includes('LISTEN')) return <Headphones {...props} />;
  if (name.includes('READ')) return <BookOpen {...props} />;
  return <FileQuestion {...props} />;
}

function SectionCard({ section }: { section: PublicExamSection }) {
  const fallbackTitle = `Phần ${section.partNumber}`;
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionIcon}>
        <SectionIcon sectionName={section.sectionName} />
      </View>
      <View style={styles.sectionBody}>
        <Text numberOfLines={1} style={styles.sectionCardTitle}>{section.title || fallbackTitle}</Text>
        <Text numberOfLines={2} style={styles.sectionDescription}>
          {section.instructions || section.sectionName || 'Phần thi tổng hợp'}
          {section.questionCount > 0 ? ` • ${section.questionCount} câu` : ''}
        </Text>
      </View>
    </View>
  );
}

export function ExamDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ examId?: string | string[] }>();
  const rawExamId = Array.isArray(params.examId) ? params.examId[0] : params.examId;
  const parsedExamId = Number(rawExamId);
  const examId = Number.isInteger(parsedExamId) && parsedExamId > 0 ? parsedExamId : null;
  const [accepted, setAccepted] = useState(false);
  const query = usePublishedExamDetailQuery(examId);
  const startAttempt = useStartExamAttempt();

  const hasListening = useMemo(
    () => query.data?.sections.some((section) => section.sectionName?.toUpperCase().includes('LISTEN')) ?? false,
    [query.data],
  );

  if (query.isLoading) {
    return (
      <View style={[styles.centerState, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.stateText}>Đang tải thông tin bài thi...</Text>
      </View>
    );
  }

  if (!examId || query.isError || !query.data) {
    return (
      <View style={[styles.centerState, { paddingTop: insets.top }]}>
        <View style={styles.stateIcon}>
          <RotateCcw color={colors.primary} size={28} />
        </View>
        <Text style={styles.stateTitle}>Không mở được bài kiểm tra</Text>
        <Text style={styles.stateText}>Bài có thể đã bị ẩn, bị xóa hoặc đường dẫn không hợp lệ.</Text>
        <View style={styles.errorActions}>
          <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Quay lại</Text>
          </Pressable>
          {examId ? (
            <Pressable onPress={() => query.refetch()} style={styles.retryButton}>
              <Text style={styles.retryText}>Thử lại</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  const exam = query.data;
  const categoryLabel = EXAM_CATEGORY_LABELS[exam.category as ExamCategory] ?? exam.category;
  const bottomBarHeight = 118 + Math.max(insets.bottom, 12);

  const handleStart = async () => {
    if (!examId || startAttempt.isPending) return;
    try {
      const session = await startAttempt.mutateAsync(examId);
      router.push({ pathname: '/(student)/practice/exam/[examId]', params: { examId: String(examId), attemptId: String(session.attemptId) } });
    } catch (error: any) {
      console.warn('Backend start attempt failed, entering practice session directly:', error?.message);
      router.push({ pathname: '/(student)/practice/exam/[examId]', params: { examId: String(examId), attemptId: '9999' } });
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backButton}>
          <ArrowLeft color={colors.text} size={25} strokeWidth={2} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>Chi tiết bài kiểm tra</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomBarHeight + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.summaryCard}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>CEFR {exam.cefrLevel}</Text>
            </View>
            {exam.passingScore > 0 ? (
              <View style={styles.targetBadge}>
                <Flag color={colors.primary} size={13} />
                <Text style={styles.targetBadgeText}>Mục tiêu: {exam.passingScore} điểm</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.examTitle}>{exam.title}</Text>

          <View style={styles.metricsBox}>
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}><Clock3 color={colors.primary} size={20} /></View>
              <Text style={styles.metricLabel}>Thời gian</Text>
              <Text style={styles.metricValue}>{exam.durationMinutes} phút</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}><FileQuestion color={colors.primary} size={20} /></View>
              <Text style={styles.metricLabel}>Số lượng</Text>
              <Text style={styles.metricValue}>{exam.totalQuestions} câu</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}><Zap color={colors.primary} size={20} /></View>
              <Text style={styles.metricLabel}>Thưởng</Text>
              <Text style={[styles.metricValue, styles.metricXp]}>+{exam.xpReward} XP</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeadingRow}>
          <Text style={styles.blockTitle}>Cấu trúc bài thi</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{exam.sections.length} phần thi</Text>
          </View>
        </View>

        {exam.sections.length > 0 ? (
          <View style={styles.sectionList}>
            {exam.sections.map((section, index) => (
              <SectionCard key={section.id ? String(section.id) : `${section.partNumber}-${index}`} section={section} />
            ))}
          </View>
        ) : (
          <View style={styles.noSectionCard}>
            <Sparkles color={colors.textFaint} size={24} />
            <Text style={styles.stateText}>Bài kiểm tra tổng hợp, không chia phần riêng.</Text>
          </View>
        )}

        <Text style={[styles.blockTitle, styles.noteTitle]}>Lưu ý trước khi làm bài</Text>
        <View style={styles.noteBox}>
          <View style={styles.noteRow}>
            <TimerReset color={colors.textSoft} size={19} />
            <Text style={styles.noteText}>Đồng hồ bắt đầu khi nhấn “Thi thử”.</Text>
          </View>
          <View style={styles.noteRow}>
            <EyeOff color={colors.textSoft} size={19} />
            <Text style={styles.noteText}>Đáp án và giải thích chỉ được hiển thị sau khi bạn nộp bài.</Text>
          </View>
          {hasListening ? (
            <View style={styles.noteRow}>
              <Headphones color={colors.textSoft} size={19} />
              <Text style={styles.noteText}>Nên sử dụng tai nghe và kiểm tra âm lượng trước khi bắt đầu phần nghe.</Text>
            </View>
          ) : null}
          <View style={styles.noteRow}>
            <CheckCircle2 color={colors.textSoft} size={19} />
            <Text style={styles.noteText}>Hệ thống sẽ tự động nộp bài khi hết thời gian làm bài.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable onPress={() => setAccepted((value) => !value)} style={styles.agreementRow}>
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted ? <Check color="#FFFFFF" size={16} strokeWidth={3} /> : null}
          </View>
          <Text style={styles.agreementText}>Tôi đã hiểu quy định</Text>
        </Pressable>
        <Pressable
          disabled={!accepted || startAttempt.isPending}
          onPress={handleStart}
          style={({ pressed }) => [
            styles.startButton,
            (!accepted || startAttempt.isPending) && styles.startButtonDisabled,
            pressed && accepted && styles.pressed,
          ]}
        >
          {startAttempt.isPending ? <ActivityIndicator color={colors.textFaint} size="small" /> : null}
          <Text style={[styles.startButtonText, (!accepted || startAttempt.isPending) && styles.startButtonTextDisabled]}>
            {startAttempt.isPending ? 'Đang mở...' : 'Thi thử'}
          </Text>
          {!startAttempt.isPending ? <ArrowRight color={accepted ? '#FFFFFF' : colors.textFaint} size={20} /> : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  headerTitle: { flex: 1, color: colors.text, fontFamily: font.family, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  headerSpacer: { width: 42 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 18 },
  summaryCard: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  categoryBadge: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 9, backgroundColor: colors.primarySoft },
  categoryBadgeText: { color: colors.primary, fontFamily: font.family, fontSize: 12, fontWeight: '800' },
  levelBadge: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 9, backgroundColor: colors.surfaceMuted },
  levelBadgeText: { color: colors.textSoft, fontFamily: font.family, fontSize: 12, fontWeight: '700' },
  targetBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 9, backgroundColor: colors.secondarySoft },
  targetBadgeText: { color: colors.primary, fontFamily: font.family, fontSize: 12, fontWeight: '700' },
  examTitle: { color: colors.text, fontFamily: font.family, fontSize: 25, lineHeight: 32, fontWeight: '800' },
  metricsBox: { flexDirection: 'row', alignItems: 'stretch', marginTop: 20, paddingVertical: 14, borderRadius: 17, backgroundColor: colors.surfaceMuted },
  metricItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  metricIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  metricLabel: { color: colors.textSoft, fontFamily: font.family, fontSize: 11, marginTop: 6 },
  metricValue: { color: colors.text, fontFamily: font.family, fontSize: 14, fontWeight: '800', marginTop: 2 },
  metricXp: { color: colors.primary },
  metricDivider: { width: 1, backgroundColor: colors.border, marginVertical: 8 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  blockTitle: { color: colors.text, fontFamily: font.family, fontSize: 21, fontWeight: '800' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.surfaceMuted },
  countBadgeText: { color: colors.textSoft, fontFamily: font.family, fontSize: 11, fontWeight: '700' },
  sectionList: { gap: 10 },
  sectionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sectionIcon: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primarySoft },
  sectionBody: { flex: 1, minWidth: 0 },
  sectionCardTitle: { color: colors.text, fontFamily: font.family, fontSize: 15, fontWeight: '800' },
  sectionDescription: { color: colors.textSoft, fontFamily: font.family, fontSize: 12, lineHeight: 18, marginTop: 3 },
  noSectionCard: { alignItems: 'center', gap: 8, padding: 24, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  noteTitle: { marginTop: 30, marginBottom: 12 },
  noteBox: { gap: 16, padding: 18, borderRadius: 18, backgroundColor: colors.surfaceMuted },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  noteText: { flex: 1, color: colors.textSoft, fontFamily: font.family, fontSize: 13, lineHeight: 20 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 13, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  agreementRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  checkbox: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  agreementText: { flex: 1, color: colors.text, fontFamily: font.family, fontSize: 12.5, lineHeight: 18, fontWeight: '700' },
  startButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 15, backgroundColor: colors.primary },
  startButtonDisabled: { backgroundColor: colors.surfaceMuted },
  startButtonText: { color: '#FFFFFF', fontFamily: font.family, fontSize: 15, fontWeight: '800' },
  startButtonTextDisabled: { color: colors.textFaint },
  pressed: { opacity: 0.72 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10, backgroundColor: colors.bg },
  stateIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  stateTitle: { color: colors.text, fontFamily: font.family, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  stateText: { color: colors.textSoft, fontFamily: font.family, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  errorActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  secondaryButton: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.text, fontFamily: font.family, fontSize: 13, fontWeight: '800' },
  retryButton: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.primary },
  retryText: { color: '#FFFFFF', fontFamily: font.family, fontSize: 13, fontWeight: '800' },
});
