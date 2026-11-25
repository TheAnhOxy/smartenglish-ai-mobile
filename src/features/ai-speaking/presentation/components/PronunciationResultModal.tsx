import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RotateCcw, Send, X } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import type { PronunciationAssessmentData } from '../../data/speakingApi';

/** Kết quả chấm một câu nói: câu mẫu (nếu học viên chọn câu gợi ý), câu AI nghe được và điểm AI. */
export interface SpokenAttempt {
  target: string | null;
  heard: string;
  data: PronunciationAssessmentData;
}

interface Props {
  attempt: SpokenAttempt | null;
  /** Xem lại kết quả của câu đã gửi: chỉ có nút đóng. */
  readOnly?: boolean;
  onRetry: () => void;
  onSend: () => void;
  onClose: () => void;
}

export const scoreColor = (v: number) => (v >= 80 ? '#15803D' : v >= 60 ? '#B45309' : '#B91C1C');
export const scoreLabel = (v: number) => (v >= 80 ? 'Phát âm tốt' : v >= 60 ? 'Khá, cần chỉnh vài chỗ' : 'Cần luyện thêm');

const keyOf = (word: string) => word.toLowerCase().replace(/’/g, "'").replace(/[^a-z0-9']/g, '');

/** Đánh dấu từng từ của câu mẫu là nói đúng hay bị thiếu/sai, theo dãy con chung dài nhất với câu AI nghe được. */
export const markTargetWords = (target: string, heard: string): { word: string; ok: boolean }[] => {
  const words = target.split(/\s+/).filter(Boolean);
  const a = words.map(keyOf);
  const b = heard.split(/\s+/).map(keyOf).filter(Boolean);
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] && a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ok = new Array<boolean>(a.length).fill(false);
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] && a[i] === b[j]) {
      ok[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  // Dấu câu đứng riêng không tính là sai
  return words.map((word, k) => ({ word, ok: ok[k] || !a[k] }));
};

/** Lỗi âm do AI trả về: [{ phoneme, issue, correction }]. */
const phonemeIssues = (raw: unknown): { phoneme: string; issue: string; correction: string }[] =>
  Array.isArray(raw)
    ? raw
        .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null && typeof (x as Record<string, unknown>).phoneme === 'string')
        .map((x) => ({ phoneme: String(x.phoneme).replace(/^\/+|\/+$/g, ''), issue: String(x.issue ?? ''), correction: String(x.correction ?? '') }))
    : [];

export const PronunciationResultModal = ({ attempt, readOnly, onRetry, onSend, onClose }: Props) => {
  if (!attempt) return null;
  const { data, target, heard } = attempt;
  const metrics: [string, number][] = [
    [target ? 'Chính xác' : 'Độ rõ', data.accuracyScore],
    ['Trọng âm', data.stressScore],
    ['Ngữ điệu', data.intonationScore],
    ['Trôi chảy', data.fluencyScore],
  ];
  const marked = target ? markTargetWords(target, heard) : [];
  const missed = marked.filter((w) => !w.ok).length;
  const issues = phonemeIssues(data.phonemeErrors);
  const notes = [...data.errorFeedback, ...data.improvementTips].filter(Boolean).slice(0, 4);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.header}>
            <Text style={s.title}>Kết quả phát âm</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Đóng">
              <X color={AppColors.neutralGray} size={20} />
            </Pressable>
          </View>

          <ScrollView style={s.scroll} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
            <View style={s.overallRow}>
              <View style={[s.overallCircle, { borderColor: scoreColor(data.overallScore) }]}>
                <Text style={[s.overallValue, { color: scoreColor(data.overallScore) }]}>{data.overallScore}%</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.overallLabel, { color: scoreColor(data.overallScore) }]}>{scoreLabel(data.overallScore)}</Text>
                <Text style={s.muted}>
                  Điểm tổng = một nửa độ {target ? 'chính xác' : 'rõ'}, một nửa trung bình trọng âm, ngữ điệu, trôi chảy.
                </Text>
              </View>
            </View>

            <View style={s.metrics}>
              {metrics.map(([label, value]) => (
                <View key={label} style={s.metricRow}>
                  <Text style={s.metricLabel}>{label}</Text>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: scoreColor(value) }]} />
                  </View>
                  <Text style={[s.metricValue, { color: scoreColor(value) }]}>{value}%</Text>
                </View>
              ))}
              <Text style={s.muted}>
                Độ {target ? 'chính xác' : 'rõ'} tính bằng cách so từ AI nghe được với câu. Trọng âm, ngữ điệu, trôi chảy do AI
                ước lượng, mang tính tham khảo.
              </Text>
            </View>

            {target ? (
              <View style={s.section}>
                <Text style={s.sectionTitle}>
                  Câu mẫu {missed ? `· ${missed} từ chưa nghe đúng` : '· đọc đúng tất cả các từ'}
                </Text>
                <Text style={s.sentence}>
                  {marked.map((w, k) => (
                    <Text key={k} style={w.ok ? s.wordOk : s.wordBad}>
                      {w.word}
                      {k < marked.length - 1 ? ' ' : ''}
                    </Text>
                  ))}
                </Text>
              </View>
            ) : null}

            <View style={s.section}>
              <Text style={s.sectionTitle}>AI nghe được</Text>
              <Text style={s.heard}>{heard || '(không rõ)'}</Text>
              {!target ? (
                <Text style={s.muted}>Chạm một câu gợi ý trước khi nói để được so với câu mẫu từng từ.</Text>
              ) : null}
            </View>

            {issues.length ? (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Âm cần sửa</Text>
                {issues.map((p, k) => (
                  <View key={k} style={s.issueRow}>
                    <Text style={s.phoneme}>/{p.phoneme}/</Text>
                    <Text style={s.issueText}>
                      {p.issue}
                      {p.correction ? <Text style={s.correction}>{`\n${p.correction}`}</Text> : null}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {notes.length ? (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Nhận xét của AI</Text>
                {notes.map((n, k) => (
                  <Text key={k} style={s.note}>
                    {k + 1}. {n}
                  </Text>
                ))}
              </View>
            ) : null}
          </ScrollView>

          {readOnly ? (
            <View style={s.actions}>
              <Pressable onPress={onClose} style={[s.btn, s.btnPrimary]}>
                <Text style={s.btnPrimaryText}>Đóng</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.actions}>
              <Pressable onPress={onRetry} style={[s.btn, s.btnSecondary]} accessibilityLabel="Nói lại câu này">
                <RotateCcw color={AppColors.neutralInk} size={16} />
                <Text style={s.btnSecondaryText}>Nói lại</Text>
              </Pressable>
              <Pressable onPress={onSend} style={[s.btn, s.btnPrimary]} accessibilityLabel="Gửi câu này cho AI">
                <Send color="#FFFFFF" size={16} />
                <Text style={s.btnPrimaryText}>Gửi câu này</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: AppColors.cardWhite,
    borderRadius: 20,
    padding: 18,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', color: AppColors.neutralInk },
  scroll: { flexGrow: 0 },
  body: { gap: 14, paddingBottom: 4 },
  overallRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  overallCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overallValue: { fontSize: 22, fontWeight: '800' },
  overallLabel: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  muted: { fontSize: 12, lineHeight: 17, color: AppColors.neutralGray },
  metrics: { gap: 8 },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricLabel: { width: 72, fontSize: 13, color: AppColors.neutralInk },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  metricValue: { width: 44, textAlign: 'right', fontSize: 13, fontWeight: '700' },
  section: { gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: AppColors.neutralGray },
  sentence: { fontSize: 16, lineHeight: 24 },
  wordOk: { color: '#15803D', fontWeight: '600' },
  wordBad: { color: '#B91C1C', fontWeight: '700', textDecorationLine: 'underline' },
  heard: { fontSize: 15, lineHeight: 22, color: AppColors.neutralInk },
  issueRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  phoneme: { minWidth: 44, fontSize: 14, fontWeight: '700', color: '#B91C1C' },
  issueText: { flex: 1, fontSize: 13, lineHeight: 18, color: AppColors.neutralInk },
  correction: { color: '#15803D' },
  note: { fontSize: 13, lineHeight: 18, color: AppColors.neutralInk },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
  },
  btnSecondary: { backgroundColor: '#F1F5F9' },
  btnSecondaryText: { fontSize: 14, fontWeight: '700', color: AppColors.neutralInk },
  btnPrimary: { backgroundColor: '#4F46E5' },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
