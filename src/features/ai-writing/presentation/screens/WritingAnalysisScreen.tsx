import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, CheckCircle2, FileText } from 'lucide-react-native';
import { colors } from '@/src/theme';
import type { WritingError } from '@/src/core/types/schema';
import { applyCorrections, useWritingSession } from '../../application/useAiWriting';
import type { WritingResult } from '../../data/writingApi';
import { BackButton } from '@/src/core/components/BackButton';

const TYPE_LABEL: Record<WritingError['type'], string> = {
  spelling: 'Chính tả',
  grammar: 'Ngữ pháp',
  word_choice: 'Dùng từ',
};
const SCORE_LABEL: [keyof WritingResult['scoring_detail'], string][] = [
  ['task_achievement', 'Nội dung'],
  ['coherence_cohesion', 'Mạch lạc'],
  ['lexical_resource', 'Từ vựng'],
  ['grammatical_range', 'Ngữ pháp'],
];

/** UC-08 xem lỗi trong bài + UC-09 chấp nhận sửa: các lỗi được chấp nhận áp thẳng vào bài viết. */
export const WritingAnalysisScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { text, result, setText } = useWritingSession();
  const [accepted, setAccepted] = useState<string[]>([]);

  const errors = result?.errors ?? [];
  const corrected = useMemo(() => applyCorrections(text, errors, accepted), [text, errors, accepted]);

  if (!result) {
    return (
      <View style={[s.root, s.center]}>
        <Text style={s.muted}>Chưa có kết quả chấm bài.</Text>
        <Pressable onPress={() => router.replace('/(student)/practice/writing' as never)} style={s.primaryBtn}>
          <Text style={s.primaryText}>Viết bài mới</Text>
        </Pressable>
      </View>
    );
  }

  const toggle = (id: string) => setAccepted((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const acceptAll = () => setAccepted(errors.map((e) => e.error_id));

  // Bài gốc với các đoạn lỗi được tô màu
  const segments: { text: string; error?: WritingError }[] = [];
  let cursor = 0;
  for (const e of errors) {
    if (e.position_start < cursor) continue;
    if (e.position_start > cursor) segments.push({ text: text.slice(cursor, e.position_start) });
    segments.push({ text: text.slice(e.position_start, e.position_end), error: e });
    cursor = e.position_end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  const continueEditing = () => {
    setText(corrected);
    router.back();
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <View style={s.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.title}>Kết quả chấm bài</Text>
        <View style={s.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120, gap: 16 }}>
        <View style={s.scoreCard}>
          <View style={s.overall}>
            <Text style={s.overallValue}>{result.overall_band.toFixed(1)}</Text>
            <Text style={s.muted}>Band ước lượng</Text>
          </View>
          <View style={s.scoreGrid}>
            {SCORE_LABEL.map(([key, label]) => (
              <View key={key} style={s.scoreItem}>
                <Text style={s.scoreValue}>{result.scoring_detail[key].toFixed(1)}</Text>
                <Text style={s.scoreLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {result.summary_vi ? <Text style={s.summary}>{result.summary_vi}</Text> : null}

        <View style={s.card}>
          <Text style={s.sectionTitle}>Bài của bạn</Text>
          <Text style={s.essay}>
            {segments.map((seg, i) =>
              seg.error ? (
                <Text key={i} style={accepted.includes(seg.error.error_id) ? s.markFixed : s.markError}>
                  {accepted.includes(seg.error.error_id) ? seg.error.suggestion : seg.text}
                </Text>
              ) : (
                <Text key={i}>{seg.text}</Text>
              ),
            )}
          </Text>
        </View>

        <View style={s.rowBetween}>
          <Text style={s.sectionTitle}>{errors.length ? `${errors.length} lỗi cần xem` : 'Không phát hiện lỗi'}</Text>
          {errors.length > 1 ? (
            <Pressable onPress={acceptAll} hitSlop={8}>
              <Text style={s.link}>Chấp nhận tất cả</Text>
            </Pressable>
          ) : null}
        </View>

        {errors.map((e) => {
          const on = accepted.includes(e.error_id);
          return (
            <View key={e.error_id} style={[s.card, on && s.cardOn]}>
              <View style={s.rowBetween}>
                <Text style={s.errType}>{TYPE_LABEL[e.type]}{e.severity === 'major' ? ' · quan trọng' : ''}</Text>
                <Pressable onPress={() => toggle(e.error_id)} style={[s.acceptBtn, on && s.acceptBtnOn]}>
                  {on ? <Check size={14} color="#FFFFFF" /> : null}
                  <Text style={[s.acceptText, on && { color: '#FFFFFF' }]}>{on ? 'Đã sửa' : 'Chấp nhận sửa'}</Text>
                </Pressable>
              </View>
              <Text style={s.fixLine}>
                <Text style={s.strike}>{e.original}</Text>
                <Text>{'  →  '}</Text>
                <Text style={s.suggest}>{e.suggestion}</Text>
              </Text>
              {e.explanation_vi ? <Text style={s.muted}>{e.explanation_vi}</Text> : null}
            </View>
          );
        })}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={continueEditing} style={s.secondaryBtn}>
          <CheckCircle2 size={16} color={colors.primary} />
          <Text style={s.secondaryText}>{accepted.length ? 'Lưu bản đã sửa' : 'Sửa tiếp'}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(student)/practice/writing/compare' as never)} style={s.primaryBtn}>
          <FileText size={16} color="#FFFFFF" />
          <Text style={s.primaryText}>Bản AI viết lại</Text>
        </Pressable>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  scoreCard: { flexDirection: 'row', gap: 16, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16 },
  overall: { alignItems: 'center', justifyContent: 'center', paddingRight: 16, borderRightWidth: 1, borderRightColor: colors.border },
  overallValue: { fontSize: 32, fontWeight: '800', color: colors.primary },
  scoreGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  scoreItem: { width: '50%' },
  scoreValue: { fontSize: 16, fontWeight: '800', color: colors.text },
  scoreLabel: { fontSize: 12, color: colors.textSoft },
  summary: { fontSize: 14, color: colors.text, lineHeight: 21 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 },
  cardOn: { borderColor: colors.success },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  essay: { fontSize: 15, lineHeight: 24, color: colors.text },
  markError: { backgroundColor: colors.dangerSoft, color: colors.danger, textDecorationLine: 'underline' },
  markFixed: { backgroundColor: colors.successSoft, color: colors.success, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  link: { fontSize: 13, fontWeight: '700', color: colors.primary },
  errType: { fontSize: 12, fontWeight: '700', color: colors.textSoft, textTransform: 'uppercase' },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 5 },
  acceptBtnOn: { backgroundColor: colors.success, borderColor: colors.success },
  acceptText: { fontSize: 12, fontWeight: '700', color: colors.text },
  fixLine: { fontSize: 15, color: colors.text },
  strike: { textDecorationLine: 'line-through', color: colors.danger },
  suggest: { fontWeight: '700', color: colors.success },
  muted: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.bg },
  primaryBtn: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  secondaryBtn: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.primary, paddingVertical: 14 },
  secondaryText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
