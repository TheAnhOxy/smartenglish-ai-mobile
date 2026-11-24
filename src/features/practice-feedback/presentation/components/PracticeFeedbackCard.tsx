import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, CheckCircle2, Lightbulb, Mic, MessageSquare, PenLine, Sparkles, TrendingUp } from 'lucide-react-native';
import { FoxRunLoader } from '@/src/core/components/FoxRunLoader';
import { ProgressBar } from '@/src/components/ds';
import { ds, dsFont, dsRadius, dsShadow, dsSize } from '@/src/theme/ds';
import { useSessionFeedback } from '../../application/usePracticeFeedback';
import type { FeedbackDimension, SessionFeedbackInput } from '../../data/practiceFeedbackApi';

interface PracticeFeedbackCardProps {
  /** null khi dữ liệu buổi luyện chưa sẵn sàng (thẻ sẽ chưa gọi AI). */
  input: SessionFeedbackInput | null;
  style?: StyleProp<ViewStyle>;
}

const DIMENSIONS: { key: 'vocabulary' | 'pronunciation' | 'speaking' | 'grammar'; label: string; icon: typeof BookOpen }[] = [
  { key: 'vocabulary', label: 'Từ vựng', icon: BookOpen },
  { key: 'pronunciation', label: 'Phát âm', icon: Mic },
  { key: 'speaking', label: 'Kỹ năng nói', icon: MessageSquare },
  { key: 'grammar', label: 'Ngữ pháp', icon: PenLine },
];

const scoreColor = (score: number | null | undefined) =>
  score == null ? ds.faint : score >= 80 ? ds.green : score >= 60 ? ds.amberDeep : ds.red;

const errorMessage = (err: unknown): { text: string; quota: boolean } => {
  const res = (err as { response?: { status?: number; data?: { detail?: string; message?: string } } })?.response;
  return {
    text: res?.data?.detail || res?.data?.message || 'AI chưa nhận xét được buổi luyện này.',
    quota: res?.status === 429,
  };
};

const Dimension: React.FC<{ label: string; icon: typeof BookOpen; dim: FeedbackDimension }> = ({ label, icon: Icon, dim }) => (
  <View style={s.dim}>
    <View style={s.dimHead}>
      <View style={s.dimIcon}>
        <Icon size={16} color={ds.btn} />
      </View>
      <Text style={s.dimLabel}>{label}</Text>
      {dim.score != null ? <Text style={[s.dimScore, { color: scoreColor(dim.score) }]}>{dim.score}</Text> : null}
    </View>
    {dim.score != null ? <ProgressBar value={dim.score / 100} color={scoreColor(dim.score)} height={6} /> : null}
    {dim.comment_vi ? <Text style={s.dimText}>{dim.comment_vi}</Text> : null}
    {dim.words_to_review && dim.words_to_review.length > 0 ? (
      <View style={s.chips}>
        {dim.words_to_review.map((w) => (
          <View key={w} style={s.chip}>
            <Text style={s.chipText}>{w}</Text>
          </View>
        ))}
      </View>
    ) : null}
  </View>
);

const BulletList: React.FC<{ title: string; items: string[]; icon: typeof BookOpen; tone: string }> = ({ title, items, icon: Icon, tone }) =>
  items.length === 0 ? null : (
    <View style={s.listBlock}>
      <Text style={s.listTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={s.listRow}>
          <Icon size={15} color={tone} style={{ marginTop: 2 }} />
          <Text style={s.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );

/** Thẻ "Nhận xét từ AI" sau mỗi buổi luyện tập: điểm, từng mặt kỹ năng, điểm mạnh, cần cải thiện, lời khuyên. */
export const PracticeFeedbackCard: React.FC<PracticeFeedbackCardProps> = ({ input, style }) => {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching, enabled } = useSessionFeedback(input);

  if (!enabled) return null;

  return (
    <View style={[s.card, style]}>
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Sparkles size={18} color={ds.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Nhận xét từ AI</Text>
          <Text style={s.sub}>Đánh giá buổi luyện và lời khuyên để cải thiện</Text>
        </View>
        {data?.overallScore != null ? (
          <View style={[s.scoreBadge, { borderColor: scoreColor(data.overallScore) }]}>
            <Text style={[s.scoreText, { color: scoreColor(data.overallScore) }]}>{data.overallScore}</Text>
          </View>
        ) : null}
      </View>

      {isLoading || isRefetching ? (
        <FoxRunLoader message="AI đang chấm buổi luyện của bạn..." size={56} />
      ) : isError ? (
        (() => {
          const e = errorMessage(error);
          return (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{e.text}</Text>
              <Pressable
                onPress={() =>
                  e.quota
                    ? router.push({ pathname: '/(student)/profile/premium', params: { from: 'feedback' } } as never)
                    : refetch()
                }
                style={s.retryBtn}
              >
                <Text style={s.retryText}>{e.quota ? 'Nâng cấp Premium' : 'Thử lại'}</Text>
              </Pressable>
            </View>
          );
        })()
      ) : data ? (
        <View style={{ gap: 14 }}>
          <Text style={s.summary}>{data.feedback.summary_vi}</Text>
          {DIMENSIONS.map(({ key, label, icon }) => {
            const dim = data.feedback[key];
            return dim ? <Dimension key={key} label={label} icon={icon} dim={dim} /> : null;
          })}
          <BulletList title="Điểm mạnh" items={data.feedback.strengths_vi} icon={CheckCircle2} tone={ds.green} />
          <BulletList title="Cần cải thiện" items={data.feedback.improvements_vi} icon={TrendingUp} tone={ds.amberDeep} />
          <View style={s.adviceBox}>
            <BulletList title="Lời khuyên" items={data.feedback.advice_vi} icon={Lightbulb} tone={ds.btn} />
          </View>
        </View>
      ) : null}
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: ds.card,
    borderRadius: dsRadius.xl,
    borderWidth: 1.5,
    borderColor: ds.line,
    borderBottomWidth: 4,
    padding: 16,
    gap: 14,
    ...dsShadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: ds.btn, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: dsFont.display, fontSize: dsSize.md, color: ds.ink },
  sub: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted },
  scoreBadge: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontFamily: dsFont.displayHeavy, fontSize: dsSize.md },
  summary: { fontFamily: dsFont.medium, fontSize: dsSize.sm, color: ds.inkSoft, lineHeight: 21 },
  dim: { gap: 6, padding: 12, borderRadius: dsRadius.md, backgroundColor: ds.bg },
  dimHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dimIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: ds.skySoft, alignItems: 'center', justifyContent: 'center' },
  dimLabel: { flex: 1, fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.ink },
  dimScore: { fontFamily: dsFont.display, fontSize: dsSize.base },
  dimText: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.inkSoft, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full, backgroundColor: ds.amberSoft },
  chipText: { fontFamily: dsFont.semibold, fontSize: dsSize.xs, color: ds.amberText },
  listBlock: { gap: 6 },
  listTitle: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.ink },
  listRow: { flexDirection: 'row', gap: 8 },
  listText: { flex: 1, fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.inkSoft, lineHeight: 18 },
  adviceBox: { padding: 12, borderRadius: dsRadius.md, backgroundColor: ds.skySoft },
  errorBox: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  errorText: { fontFamily: dsFont.medium, fontSize: dsSize.sm, color: ds.inkSoft, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: dsRadius.full, backgroundColor: ds.btn },
  retryText: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.white },
});
