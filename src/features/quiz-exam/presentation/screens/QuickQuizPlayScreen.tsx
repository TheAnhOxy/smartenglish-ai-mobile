import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, RotateCcw, X, XCircle } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { exploreWordsApi } from '@/src/features/flashcard-srs/data/vocabularyApi';
import { generateQuickQuiz, QuickQuestionType, QuickQuizQuestion } from '../../application/quickQuizGenerator';

/** Làm Quiz nhanh: tải từ vựng thật → sinh câu hỏi → chấm ngay từng câu → tổng kết. */
export const QuickQuizPlayScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ topicId?: string; level?: string; count?: string; types?: string }>();
  const count = Math.min(Math.max(Number(params.count) || 10, 1), 30);
  const types = (params.types || 'meaning,word').split(',').filter(Boolean) as QuickQuestionType[];

  const [round, setRound] = useState(0);
  const wordsQuery = useQuery({
    queryKey: ['quick-quiz-words', params.topicId || '', params.level || ''],
    queryFn: () =>
      exploreWordsApi({
        topicId: params.topicId ? Number(params.topicId) : undefined,
        cefrLevel: params.level || undefined,
        size: 100,
      }),
  });

  const questions: QuickQuizQuestion[] = useMemo(
    () => (wordsQuery.data ? generateQuickQuiz(wordsQuery.data.items, types, count) : []),
    // round đổi → sinh bộ câu mới khi làm lại
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wordsQuery.data, round],
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ q: QuickQuizQuestion; chosen: string }[]>([]);

  const restart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setSelected(null);
    setAnswers([]);
  };

  const header = (
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Thoát" style={s.iconBtn}>
        <X size={20} color={colors.text} />
      </Pressable>
      <Text style={s.title}>Quiz nhanh</Text>
      <Text style={s.progressText}>{questions.length ? `${Math.min(index + 1, questions.length)}/${questions.length}` : ''}</Text>
    </View>
  );

  if (wordsQuery.isLoading) {
    return (
      <View style={s.root}>
        {header}
        <View style={s.center}><ActivityIndicator size="small" color={colors.primary} /></View>
      </View>
    );
  }

  if (wordsQuery.isError || questions.length === 0) {
    return (
      <View style={s.root}>
        {header}
        <View style={s.center}>
          <AlertCircle size={26} color={colors.danger} />
          <Text style={s.stateText}>
            {wordsQuery.isError ? 'Không tải được từ vựng' : 'Chưa đủ từ vựng để tạo câu hỏi với lựa chọn này. Hãy chọn chủ đề hoặc trình độ khác.'}
          </Text>
          <Pressable onPress={() => router.back()} style={s.primaryBtn}>
            <Text style={s.primaryText}>Chọn lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Tổng kết
  if (answers.length === questions.length) {
    const correct = answers.filter((a) => a.chosen === a.q.answer).length;
    const wrong = answers.filter((a) => a.chosen !== a.q.answer);
    return (
      <View style={s.root}>
        {header}
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 16 }}>
          <View style={s.scoreCard}>
            <Text style={s.scoreValue}>{correct}/{questions.length}</Text>
            <Text style={s.scoreLabel}>câu trả lời đúng</Text>
          </View>
          {wrong.length > 0 ? (
            <View style={{ gap: 10 }}>
              <Text style={s.sectionTitle}>Câu cần xem lại</Text>
              {wrong.map(({ q, chosen }) => (
                <View key={q.id} style={s.reviewCard}>
                  <Text style={s.reviewPrompt}>{q.sentence ?? q.prompt}</Text>
                  <Text style={s.reviewWrong}>Bạn chọn: {chosen}</Text>
                  <Text style={s.reviewRight}>Đáp án: {q.answer}</Text>
                  <Text style={s.reviewExplain}>{q.explanation}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Pressable onPress={restart} style={s.primaryBtn}>
            <RotateCcw size={16} color="#FFFFFF" />
            <Text style={s.primaryText}>Làm bộ câu mới</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={s.secondaryBtn}>
            <Text style={s.secondaryText}>Đổi thiết lập</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const q = questions[index];
  const answered = selected !== null;

  const next = () => {
    if (selected === null) return;
    setAnswers((prev) => [...prev, { q, chosen: selected }]);
    setSelected(null);
    setIndex((i) => i + 1);
  };

  return (
    <View style={s.root}>
      {header}
      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: `${(index / questions.length) * 100}%` }]} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100, gap: 14 }}>
        <Text style={s.prompt}>{q.prompt}</Text>
        {q.sentence ? <Text style={s.sentence}>{q.sentence}</Text> : null}

        {q.options.map((opt) => {
          const isAnswer = opt === q.answer;
          const isChosen = opt === selected;
          const style = !answered ? s.option : isAnswer ? [s.option, s.optionRight] : isChosen ? [s.option, s.optionWrong] : [s.option, s.optionDim];
          return (
            <Pressable key={opt} disabled={answered} onPress={() => setSelected(opt)} style={style}>
              <Text style={s.optionText}>{opt}</Text>
              {answered && isAnswer ? <CheckCircle2 size={18} color={colors.success} /> : null}
              {answered && isChosen && !isAnswer ? <XCircle size={18} color={colors.danger} /> : null}
            </Pressable>
          );
        })}

        {answered ? <Text style={s.explain}>{q.explanation}</Text> : null}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={next} disabled={!answered} style={[s.primaryBtn, !answered && { opacity: 0.5 }]}>
          <Text style={s.primaryText}>{index + 1 === questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  progressText: { width: 40, textAlign: 'right', fontSize: 13, fontWeight: '700', color: colors.textSoft },
  progressBg: { height: 4, backgroundColor: colors.surfaceMuted, marginHorizontal: 20, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  stateText: { fontSize: 13, color: colors.textSoft, textAlign: 'center', lineHeight: 19 },
  prompt: { fontSize: 18, fontWeight: '700', color: colors.text, lineHeight: 26 },
  sentence: { fontSize: 16, color: colors.text, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, lineHeight: 24 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
  },
  optionRight: { borderColor: colors.success, backgroundColor: colors.successSoft },
  optionWrong: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  optionDim: { opacity: 0.5 },
  optionText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600' },
  explain: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.bg },
  primaryBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  secondaryText: { fontSize: 14, fontWeight: '600', color: colors.text },
  scoreCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingVertical: 24 },
  scoreValue: { fontSize: 34, fontWeight: '800', color: colors.primary },
  scoreLabel: { fontSize: 13, color: colors.textSoft, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  reviewCard: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4 },
  reviewPrompt: { fontSize: 14, fontWeight: '600', color: colors.text },
  reviewWrong: { fontSize: 13, color: colors.danger },
  reviewRight: { fontSize: 13, color: colors.success, fontWeight: '600' },
  reviewExplain: { fontSize: 12, color: colors.textSoft, marginTop: 4 },
});
