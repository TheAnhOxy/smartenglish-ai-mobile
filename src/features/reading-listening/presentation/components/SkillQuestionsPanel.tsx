import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Button3D, Tap, dsText } from '@/src/components/ds';
import { ds, dsFont, dsRadius, dsSize } from '@/src/theme/ds';
import { markPracticeUpdated } from '@/src/core/flows/practiceActivity';
import { saveSkillPracticeResultApi, type SkillQuestion } from '../../data/readingListeningApi';
import { AssignmentSubmitBanner } from '@/src/features/class-membership/presentation/components/AssignmentSubmitBanner';

interface Props {
  kind: 'READING' | 'LISTENING';
  contentId: string;
  title?: string;
  questions: SkillQuestion[];
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Nhận xét ngắn theo tỉ lệ đúng để học viên biết nên làm gì tiếp. */
const verdict = (pct: number, kind: Props['kind']) => {
  if (pct >= 80) return 'Rất tốt. Bạn đã nắm được ý chính và chi tiết của bài.';
  if (pct >= 50)
    return kind === 'LISTENING'
      ? 'Khá. Hãy nghe lại đoạn có câu sai rồi làm lại.'
      : 'Khá. Hãy đọc lại đoạn chứa câu sai, chú ý từ khoá trong câu hỏi.';
  return kind === 'LISTENING'
    ? 'Cần luyện thêm. Nghe lại ở tốc độ 0.75x rồi làm lại.'
    : 'Cần luyện thêm. Đọc lướt tìm ý chính trước, sau đó tìm chi tiết cho từng câu.';
};

export const SkillQuestionsPanel: React.FC<Props> = ({ kind, contentId, title, questions }) => {
  const queryClient = useQueryClient();
  const startedAt = useRef(Date.now());
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const reset = useCallback(() => {
    setAnswers({});
    setSubmitted(false);
    setSaveFailed(false);
    startedAt.current = Date.now();
  }, []);

  // Màn chi tiết nằm trong tab nên không bị tháo: rời màn hoặc đổi bài thì xoá bài làm,
  // lần mở sau bắt đầu lại từ đầu và chỉ hiện "Làm lại" sau khi nộp.
  useEffect(() => reset(), [contentId, reset]);
  useFocusEffect(useCallback(() => reset, [reset]));

  if (questions.length === 0) return null;

  const answeredCount = Object.keys(answers).length;
  const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const pct = Math.round((correct / questions.length) * 100);

  const submit = async () => {
    setSubmitted(true);
    setSaving(true);
    setSaveFailed(false);
    try {
      await saveSkillPracticeResultApi({
        kind,
        contentId,
        title,
        correct,
        total: questions.length,
        durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      });
      // Nhiệm vụ hằng ngày và thống kê tính lại ngay
      markPracticeUpdated();
      queryClient.invalidateQueries({ queryKey: ['daily-quests'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const retry = reset;

  return (
    <View style={st.wrap}>
      <Text style={dsText.label}>Câu hỏi ({questions.length})</Text>

      {questions.map((q, qi) => {
        const chosen = answers[q.id];
        return (
          <View key={q.id} style={st.question}>
            <Text style={st.qText}>
              {qi + 1}. {q.question}
            </Text>
            {q.options.map((opt, oi) => {
              const isChosen = chosen === oi;
              const isRight = submitted && oi === q.correctIndex;
              const isWrong = submitted && isChosen && oi !== q.correctIndex;
              return (
                <Tap
                  key={oi}
                  disabled={submitted}
                  onPress={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                  style={[st.option, isChosen && st.optionChosen, isRight && st.optionRight, isWrong && st.optionWrong]}
                  accessibilityLabel={`Đáp án ${LETTERS[oi]}: ${opt}`}
                >
                  <Text style={[st.letter, (isChosen || isRight || isWrong) && st.letterActive]}>{LETTERS[oi]}</Text>
                  <Text style={st.optionText}>{opt}</Text>
                </Tap>
              );
            })}
            {submitted && q.explanation ? (
              <Text style={[st.explain, chosen === q.correctIndex ? st.explainRight : st.explainWrong]}>
                {chosen === q.correctIndex ? 'Đúng. ' : `Đáp án đúng: ${LETTERS[q.correctIndex]}. `}
                {q.explanation}
              </Text>
            ) : null}
          </View>
        );
      })}

      {submitted ? (
        <View style={st.result}>
          <Text style={st.score}>
            {correct}/{questions.length} câu đúng · {pct}%
          </Text>
          <Text style={dsText.bodyMuted}>{verdict(pct, kind)}</Text>
          {saving ? <Text style={dsText.caption}>Đang lưu kết quả...</Text> : null}
          {saveFailed ? (
            <Text style={[dsText.caption, { color: ds.red }]}>Chưa lưu được kết quả, nhiệm vụ hôm nay chưa được tính.</Text>
          ) : null}
          <Button3D label="Làm lại" variant="light" onPress={retry} height={46} />
          {/* Mở từ bài tập lớp: nộp kèm điểm (thang 10) để hệ thống chấm luôn, giáo viên không phải chấm tay */}
          <View style={{ marginHorizontal: -16 }}>
            <AssignmentSubmitBanner
              referenceId={contentId}
              score={Math.round((correct / questions.length) * 100) / 10}
            />
          </View>
        </View>
      ) : (
        <Button3D
          label={answeredCount < questions.length ? `Nộp bài (${answeredCount}/${questions.length})` : 'Nộp bài'}
          onPress={submit}
          disabled={answeredCount < questions.length}
          height={50}
        />
      )}
    </View>
  );
};

const st = StyleSheet.create({
  wrap: { gap: 12, marginTop: 8 },
  question: {
    backgroundColor: ds.card,
    borderRadius: dsRadius.md,
    borderWidth: 1,
    borderColor: ds.line,
    padding: 14,
    gap: 8,
  },
  qText: { fontFamily: dsFont.semibold, fontSize: dsSize.base, color: ds.ink, lineHeight: 22 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: dsRadius.sm,
    borderWidth: 1.5,
    borderColor: ds.line,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: ds.card,
  },
  optionChosen: { borderColor: ds.sky, backgroundColor: ds.skySoft },
  optionRight: { borderColor: ds.green, backgroundColor: ds.greenSoft },
  optionWrong: { borderColor: ds.red, backgroundColor: ds.redSoft },
  letter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: dsFont.bold,
    fontSize: dsSize.sm,
    color: ds.muted,
    backgroundColor: ds.bg,
    overflow: 'hidden',
  },
  letterActive: { color: ds.white, backgroundColor: ds.btn },
  optionText: { flex: 1, fontFamily: dsFont.body, fontSize: dsSize.base, color: ds.ink },
  explain: { fontFamily: dsFont.body, fontSize: dsSize.sm, lineHeight: 20, padding: 10, borderRadius: dsRadius.sm },
  explainRight: { backgroundColor: ds.greenSoft, color: ds.greenText },
  explainWrong: { backgroundColor: ds.redSoft, color: ds.redText },
  result: {
    gap: 10,
    backgroundColor: ds.card,
    borderRadius: dsRadius.md,
    borderWidth: 1,
    borderColor: ds.line,
    padding: 16,
  },
  score: { fontFamily: dsFont.display, fontSize: dsSize.lg, color: ds.ink },
});
