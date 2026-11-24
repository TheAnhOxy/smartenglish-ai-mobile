import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronUp, Compass, Sparkles, Target } from 'lucide-react-native';
import { FoxRunLoader } from '@/src/core/components/FoxRunLoader';
import { AnimatedFoxMascot } from '@/src/core/components/AnimatedFoxMascot';
import { ProgressBar } from '@/src/components/ds';
import { ds, dsFont, dsRadius, dsShadow, dsSize } from '@/src/theme/ds';
import { useFeedbackOverview } from '../../application/usePracticeFeedback';
import type { FeedbackItem } from '../../data/practiceFeedbackApi';

const scoreColor = (score: number | null | undefined) =>
  score == null ? ds.faint : score >= 80 ? ds.green : score >= 60 ? ds.amberDeep : ds.red;

const formatDate = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

/** Một buổi luyện gần đây: bấm để xem lời khuyên AI đã đưa ra. */
const RecentSession: React.FC<{ item: FeedbackItem }> = ({ item }) => {
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen((v) => !v)} style={s.recent} accessibilityLabel={`${item.skillLabel}: ${item.title}`}>
      <View style={s.recentHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.recentSkill}>
            {item.skillLabel} · {formatDate(item.createdAt)}
          </Text>
          <Text style={s.recentTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        {item.overallScore != null ? (
          <Text style={[s.recentScore, { color: scoreColor(item.overallScore) }]}>{item.overallScore}</Text>
        ) : null}
        {open ? <ChevronUp size={18} color={ds.faint} /> : <ChevronDown size={18} color={ds.faint} />}
      </View>
      {open ? (
        <View style={{ gap: 6, marginTop: 8 }}>
          <Text style={s.body}>{item.feedback.summary_vi}</Text>
          {item.feedback.advice_vi.map((a) => (
            <Text key={a} style={s.bullet}>
              • {a}
            </Text>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
};

/**
 * Tổng quan đánh giá trên tab Đánh giá: điểm từng kỹ năng từ các buổi luyện (AI chấm),
 * nhận xét tổng quan + kế hoạch tuần của AI và các buổi luyện gần đây.
 */
export const PracticeFeedbackOverview: React.FC = () => {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useFeedbackOverview();

  if (isLoading) {
    return (
      <View style={s.card}>
        <FoxRunLoader message="Đang tổng hợp đánh giá..." size={56} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[s.card, { alignItems: 'center', gap: 10 }]}>
        <Text style={s.body}>Chưa tải được tổng quan đánh giá.</Text>
        <Pressable onPress={() => refetch()} style={s.btn}>
          <Text style={s.btnText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  if (data.totalSessions === 0) {
    return (
      <View style={[s.card, s.empty]}>
        <AnimatedFoxMascot size={90} entrance={false} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={s.title}>Chưa có đánh giá kỹ năng</Text>
          <Text style={s.body}>
            Sau mỗi bài luyện nghe, nói, đọc, viết hay hội thoại, AI sẽ nhận xét và tổng hợp ở đây.
          </Text>
          <Pressable onPress={() => router.push('/(student)/learn' as never)} style={[s.btn, { alignSelf: 'flex-start' }]}>
            <Text style={s.btnText}>Bắt đầu luyện tập</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {data.coach ? (
        <View style={s.coach}>
          <LinearGradient colors={[ds.hero, ds.btnEdge]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={s.coachHead}>
            <Sparkles size={18} color={ds.amber} />
            <Text style={s.coachKicker}>Tổng quan từ {data.totalSessions} buổi luyện</Text>
          </View>
          <Text style={s.coachSummary}>{data.coach.summary_vi}</Text>
          {data.coach.focus_vi.length > 0 ? (
            <View style={s.coachBlock}>
              <View style={s.coachRow}>
                <Target size={15} color={ds.amber} />
                <Text style={s.coachLabel}>Ưu tiên cải thiện</Text>
              </View>
              {data.coach.focus_vi.map((f) => (
                <Text key={f} style={s.coachItem}>
                  • {f}
                </Text>
              ))}
            </View>
          ) : null}
          {data.coach.plan_vi.length > 0 ? (
            <View style={s.coachBlock}>
              <View style={s.coachRow}>
                <Compass size={15} color={ds.amber} />
                <Text style={s.coachLabel}>Kế hoạch tuần tới</Text>
              </View>
              {data.coach.plan_vi.map((p, i) => (
                <Text key={p} style={s.coachItem}>
                  {i + 1}. {p}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={s.card}>
        <Text style={s.title}>Điểm theo kỹ năng</Text>
        <Text style={s.sub}>Trung bình điểm AI chấm qua các buổi luyện</Text>
        <View style={{ gap: 14, marginTop: 12 }}>
          {data.skills.map((sk) => (
            <View key={sk.skill} style={{ gap: 6 }}>
              <View style={s.skillRow}>
                <Text style={s.skillLabel}>{sk.label}</Text>
                <Text style={s.skillMeta}>{sk.sessions} buổi</Text>
                <Text style={[s.skillScore, { color: scoreColor(sk.average_score) }]}>{sk.average_score ?? '—'}</Text>
              </View>
              <ProgressBar value={(sk.average_score ?? 0) / 100} color={scoreColor(sk.average_score)} height={8} />
              {sk.latest_advice_vi[0] ? <Text style={s.skillAdvice}>{sk.latest_advice_vi[0]}</Text> : null}
            </View>
          ))}
        </View>
      </View>

      {data.recent.length > 0 ? (
        <View style={s.card}>
          <Text style={s.title}>Buổi luyện gần đây</Text>
          <View style={{ gap: 8, marginTop: 10 }}>
            {data.recent.map((item) => (
              <RecentSession key={item.id} item={item} />
            ))}
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
    ...dsShadow.card,
  },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: dsFont.display, fontSize: dsSize.md, color: ds.ink },
  sub: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted, marginTop: 2 },
  body: { fontFamily: dsFont.body, fontSize: dsSize.sm, color: ds.inkSoft, lineHeight: 20 },
  bullet: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.inkSoft, lineHeight: 18 },
  btn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: dsRadius.full, backgroundColor: ds.btn },
  btnText: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.white },
  coach: { borderRadius: dsRadius.xl, overflow: 'hidden', padding: 18, gap: 10 },
  coachHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coachKicker: { fontFamily: dsFont.bold, fontSize: dsSize.xs, color: ds.skyLight, textTransform: 'uppercase', letterSpacing: 0.8 },
  coachSummary: { fontFamily: dsFont.medium, fontSize: dsSize.sm, color: ds.white, lineHeight: 21 },
  coachBlock: { gap: 4, padding: 12, borderRadius: dsRadius.md, backgroundColor: ds.onInkFaint },
  coachRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coachLabel: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.white },
  coachItem: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.onInk, lineHeight: 18 },
  skillRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  skillLabel: { flex: 1, fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.ink },
  skillMeta: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted },
  skillScore: { fontFamily: dsFont.display, fontSize: dsSize.base, minWidth: 28, textAlign: 'right' },
  skillAdvice: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted, lineHeight: 17 },
  recent: { padding: 12, borderRadius: dsRadius.md, backgroundColor: ds.bg },
  recentHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recentSkill: { fontFamily: dsFont.semibold, fontSize: dsSize.xs, color: ds.btn },
  recentTitle: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.ink },
  recentScore: { fontFamily: dsFont.display, fontSize: dsSize.md },
});
