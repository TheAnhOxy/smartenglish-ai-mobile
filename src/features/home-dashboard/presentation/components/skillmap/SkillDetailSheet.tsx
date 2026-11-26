import React, { memo, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { AlertTriangle, ArrowRight, CheckCircle2, Compass, Lightbulb, RotateCcw, Sparkles, X } from 'lucide-react-native';
import Animated, { Easing, FadeIn, SlideInDown, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Pressable } from '@/src/core/components/PressableCompat';
import { dk } from '@/src/theme/themeMode';
import { ds, dsFont } from '@/src/theme/ds';
import { haptic } from '@/src/components/ds/feedback';
import type { FeedbackItem } from '@/src/features/practice-feedback/data/practiceFeedbackApi';
import {
  CONFIDENCE_LABEL,
  SKILL_BAND_LABEL,
  TIME_RANGES,
  dimensionAverages,
  filterByRange,
  historyStats,
  skillBand,
  skillHistory,
  skillInsight,
  trendOf,
  type HistoryPoint,
  type SkillKey,
  type SkillPoint,
  type TimeRange,
} from '../../../application/skillMap';
import { BAND_COLOR, MAP, SKILL_THEME } from './skillColorMap';
import { TrendBadge } from './SkillMapSection';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PRACTICE: Record<SkillKey, { route: string; label: string }> = {
  listening: { route: '/(student)/practice/listening', label: 'Làm bài luyện nghe' },
  pronunciation: { route: '/(student)/practice/speaking', label: 'Luyện phát âm' },
  reading: { route: '/(student)/practice/reading', label: 'Làm bài luyện đọc' },
  writing: { route: '/(student)/practice/writing', label: 'Viết bài mới' },
  grammar: { route: '/(student)/learn?tab=quiz', label: 'Làm đề ngữ pháp' },
  vocabulary: { route: '/(student)/practice/quiz', label: 'Làm quiz từ vựng' },
};

const fmtDate = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getDate()}/${d.getMonth() + 1}`;
};

// ---------------------------------------------------------------------------
// Biểu đồ tiến bộ: area + line, chạm để xem từng buổi
// ---------------------------------------------------------------------------

const SkillProgressChart = memo(({ points, color }: { points: HistoryPoint[]; color: string }) => {
  const [w, setW] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const h = 180;
  const pad = { l: 28, r: 14, t: 22, b: 26 };
  const innerW = Math.max(1, w - pad.l - pad.r);
  const innerH = h - pad.t - pad.b;
  const xs = points.map((_, i) => pad.l + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW));
  const ys = points.map((p) => pad.t + (1 - p.score / 100) * innerH);
  const line = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const area = points.length > 1 ? `${line} L${xs[xs.length - 1]},${pad.t + innerH} L${xs[0]},${pad.t + innerH} Z` : '';
  const every = Math.max(1, Math.ceil(points.length / 5));
  const sel = active ?? points.length - 1;

  const onTouch = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    let best = 0;
    xs.forEach((px, i) => {
      if (Math.abs(px - x) < Math.abs(xs[best] - x)) best = i;
    });
    if (best !== active) haptic('select');
    setActive(best);
  };

  const p = points[sel];
  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      {p ? (
        <View style={[styles.tooltip, { borderColor: color }]}>
          <Text style={[styles.tooltipScore, { color: dk(color) }]}>{p.score}</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.tooltipTitle} numberOfLines={1}>
              {p.title || 'Buổi luyện'}
            </Text>
            <Text style={styles.tooltipDate}>{fmtDate(p.date)}</Text>
          </View>
        </View>
      ) : null}
      <Pressable onPress={onTouch} accessibilityLabel="Biểu đồ điểm qua từng buổi. Chạm để xem từng buổi">
        <View style={{ height: h }}>
          {w > 0 ? (
            <Svg width={w} height={h}>
              <Defs>
                <SvgGradient id="prog-area" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={color} stopOpacity="0.3" />
                  <Stop offset="1" stopColor={color} stopOpacity="0" />
                </SvgGradient>
              </Defs>
              {[100, 85, 70, 40, 0].map((g) => {
                const y = pad.t + (1 - g / 100) * innerH;
                return (
                  <React.Fragment key={g}>
                    <Line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke={dk('#E2E8F0', 'border')} strokeDasharray={g ? '3 4' : undefined} />
                    <SvgText x={pad.l - 6} y={y + 3.5} fontSize={10} fill={dk('#94A3B8')} textAnchor="end">
                      {g}
                    </SvgText>
                  </React.Fragment>
                );
              })}
              {area ? <Path d={area} fill="url(#prog-area)" /> : null}
              {points.length > 1 ? <Path d={line} stroke={color} strokeWidth={2.6} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
              <Line x1={xs[sel]} x2={xs[sel]} y1={pad.t} y2={pad.t + innerH} stroke={color} strokeOpacity={0.35} strokeWidth={1.5} />
              {points.map((pt, i) => (
                <React.Fragment key={pt.id}>
                  <Circle cx={xs[i]} cy={ys[i]} r={i === sel ? 6.5 : 3.8} fill={i === sel ? color : dk('#FFFFFF', 'bg')} stroke={color} strokeWidth={2.2} />
                  {i % every === 0 || i === points.length - 1 ? (
                    <SvgText x={xs[i]} y={h - 8} fontSize={10} fill={dk('#94A3B8')} textAnchor="middle">
                      {fmtDate(pt.date)}
                    </SvgText>
                  ) : null}
                </React.Fragment>
              ))}
            </Svg>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
});
SkillProgressChart.displayName = 'SkillProgressChart';

// ---------------------------------------------------------------------------
// Biểu đồ thành phần: vòng radial cho từng thành phần AI chấm
// ---------------------------------------------------------------------------

const RadialStat = ({ label, score, color, delay }: { label: string; score: number; color: string; delay: number }) => {
  const size = 66;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = useSharedValue(0);
  React.useEffect(() => {
    const id = setTimeout(() => {
      v.value = withTiming(score / 100, { duration: 800, easing: Easing.out(Easing.cubic) });
    }, delay);
    return () => clearTimeout(id);
  }, [score, delay, v]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - v.value) }));
  return (
    <View style={styles.radial}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={dk('#EEF2F7', 'border')} strokeWidth={stroke} fill="none" />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            animatedProps={props}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <Text style={[styles.radialValue, { color: dk(color) }]}>{score}</Text>
      </View>
      <Text style={styles.radialLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------

interface Props {
  point: SkillPoint;
  items: FeedbackItem[] | undefined;
  loading: boolean;
  vocab?: { totalWordsLearned: number; masteredWords: number };
  onClose: () => void;
}

/** Chi tiết một kỹ năng (bottom sheet gần toàn màn hình). */
export const SkillDetailSheet = ({ point, items, loading, vocab, onClose }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<TimeRange>('all');
  const theme = SKILL_THEME[point.key];
  const Icon = theme.icon;
  const band = skillBand(point.score);

  const all = useMemo(() => skillHistory(items ?? [], point.key, 60), [items, point.key]);
  const shown = useMemo(() => filterByRange(all, range), [all, range]);
  const stats = historyStats(shown);
  const dims = useMemo(() => dimensionAverages(items ?? [], point.key), [items, point.key]);
  const insight = useMemo(() => skillInsight(items ?? [], point.key), [items, point.key]);
  const conf = point.sessions >= 8 ? 'high' : point.sessions >= 3 ? 'medium' : 'low';

  const go = (route: string) => {
    onClose();
    router.push(route as never);
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(160)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.5)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng" />
      </Animated.View>
      <Animated.View entering={SlideInDown.springify().damping(18)} style={[styles.sheet, { top: insets.top + 24, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.grabber} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          {/* Header kỹ năng */}
          <LinearGradient colors={[dk(theme.soft, 'bg'), dk('#FFFFFF', 'bg')]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.hero}>
            <View style={styles.heroTop}>
              <LinearGradient colors={[theme.light, theme.main]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroIcon}>
                <Icon size={24} color="#FFFFFF" strokeWidth={2.2} />
              </LinearGradient>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.heroTitle}>{point.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                  <View style={[styles.bandChip, { backgroundColor: dk(BAND_COLOR[band] + '1F', 'bg') }]}>
                    <Text style={[styles.bandText, { color: dk(BAND_COLOR[band]) }]}>{SKILL_BAND_LABEL[band]}</Text>
                  </View>
                  <TrendBadge trend={trendOf(historyStats(all).trend)} />
                </View>
              </View>
              <Text style={[styles.heroScore, { color: point.score != null ? dk(theme.main) : dk('#94A3B8') }]}>{point.score ?? '—'}</Text>
              <Pressable onPress={onClose} hitSlop={8} style={styles.close} accessibilityRole="button" accessibilityLabel="Đóng">
                <X size={18} color={dk(MAP.textAccent)} />
              </Pressable>
            </View>
            {insight.summary ? (
              <View style={styles.aiQuote}>
                <Sparkles size={14} color={MAP.primary} />
                <Text style={styles.aiQuoteText}>{insight.summary}</Text>
              </View>
            ) : null}
            <Text style={styles.confText}>
              Độ tin cậy AI: {CONFIDENCE_LABEL[conf]} · {point.source}
            </Text>
          </LinearGradient>

          {/* Tiến bộ theo thời gian */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiến bộ theo thời gian</Text>
            <View style={styles.ranges}>
              {TIME_RANGES.map((r) => {
                const on = r.key === range;
                return (
                  <Pressable
                    key={r.key}
                    onPress={() => {
                      haptic('select');
                      setRange(r.key);
                    }}
                    style={[styles.rangeChip, on && { backgroundColor: theme.main, borderColor: theme.main }]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.rangeText, on && { color: '#FFFFFF' }]}>{r.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {loading ? (
              <View style={styles.empty}>
                <ActivityIndicator color={MAP.primary} />
              </View>
            ) : shown.length > 0 ? (
              <>
                <SkillProgressChart key={range} points={shown} color={theme.main} />
                <View style={styles.statRow}>
                  {[
                    ['Số bài', String(shown.length)],
                    ['Cao nhất', String(stats.best ?? '—')],
                    ['Gần nhất', String(stats.latest ?? '—')],
                    ['Thay đổi', stats.trend == null ? '—' : `${stats.trend > 0 ? '+' : ''}${stats.trend}`],
                  ].map(([l, v]) => (
                    <View key={l} style={styles.stat}>
                      <Text style={styles.statValue}>{v}</Text>
                      <Text style={styles.statLabel}>{l}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : point.key === 'vocabulary' && vocab && vocab.totalWordsLearned > 0 ? (
              <VocabSplit mastered={vocab.masteredWords} total={vocab.totalWordsLearned} color={theme.main} soft={theme.light} />
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {all.length > 0 ? 'Không có buổi luyện trong khoảng thời gian này.' : 'Chưa có buổi luyện nào được AI chấm cho kỹ năng này.'}
                </Text>
              </View>
            )}
          </View>

          {/* Từ vựng: kết quả ôn thẻ SRS (cập nhật ngay sau mỗi lượt ôn) */}
          {point.key === 'vocabulary' && shown.length > 0 && vocab && vocab.totalWordsLearned > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ôn thẻ từ vựng (SRS)</Text>
              <VocabSplit mastered={vocab.masteredWords} total={vocab.totalWordsLearned} color={theme.main} soft={theme.light} hideHint />
            </View>
          ) : null}

          {/* Thành phần kỹ năng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thành phần kỹ năng</Text>
            <Text style={styles.sectionHint}>Trung bình điểm thành phần AI chấm trong các buổi luyện</Text>
            {dims.length > 0 ? (
              <View style={styles.radials}>
                {dims.map((d, i) => (
                  <RadialStat key={d.label} label={d.label} score={d.score} color={theme.main} delay={i * 90} />
                ))}
              </View>
            ) : (
              <View style={[styles.empty, { height: 76 }]}>
                <Text style={styles.emptyText}>AI sẽ chấm điểm thành phần sau các buổi luyện tiếp theo.</Text>
              </View>
            )}
          </View>

          {/* AI Insight */}
          {insight.strengths.length || insight.mistakes.length || insight.advice.length ? (
            <View style={styles.section}>
              <View style={styles.insightHead}>
                <Sparkles size={16} color={MAP.primary} />
                <Text style={styles.sectionTitle}>AI Insight</Text>
              </View>
              {insight.strengths.length ? (
                <InsightBlock icon={<CheckCircle2 size={15} color="#16A34A" />} title="Điểm mạnh" tint="#DCFCE7" items={insight.strengths} />
              ) : null}
              {insight.mistakes.length ? (
                <InsightBlock
                  icon={<AlertTriangle size={15} color="#EA580C" />}
                  title="Lỗi thường gặp"
                  tint="#FFEDD5"
                  items={insight.mistakes.map((m) => (m.count > 1 ? `${m.text} (×${m.count})` : m.text))}
                />
              ) : null}
              {insight.advice.length ? (
                <InsightBlock icon={<Lightbulb size={15} color={MAP.primary} />} title="AI gợi ý" tint="#EEF2FF" items={insight.advice} />
              ) : null}
            </View>
          ) : null}

          {/* Đề xuất luyện tập */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đề xuất luyện tập</Text>
            <Pressable onPress={() => go(PRACTICE[point.key].route)} accessibilityRole="button" style={{ marginTop: 6 }}>
              <LinearGradient colors={[theme.light, theme.main]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                <Text style={[styles.ctaText, { color: '#FFFFFF' }]}>{PRACTICE[point.key].label}</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Pressable onPress={() => go('/(student)/review')} style={styles.ghost} accessibilityRole="button">
                <RotateCcw size={16} color={dk(MAP.textAccent)} />
                <Text style={styles.ghostText}>Ôn ngay</Text>
              </Pressable>
              <Pressable onPress={() => go('/(student)/learn?tab=path')} style={styles.ghost} accessibilityRole="button">
                <Compass size={16} color={dk(MAP.textAccent)} />
                <Text style={styles.ghostText}>Lộ trình cải thiện</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const InsightBlock = ({ icon, title, tint, items }: { icon: React.ReactNode; title: string; tint: string; items: string[] }) => (
  <View style={[styles.insight, { backgroundColor: dk(tint, 'bg') }]}>
    <View style={styles.insightTitleRow}>
      {icon}
      <Text style={styles.insightTitle}>{title}</Text>
    </View>
    {items.map((t) => (
      <Text key={t} style={styles.insightItem}>
        • {t}
      </Text>
    ))}
  </View>
);

const VocabSplit = ({ mastered, total, color, soft, hideHint }: { mastered: number; total: number; color: string; soft: string; hideHint?: boolean }) => {
  const pct = Math.round((mastered / Math.max(1, total)) * 100);
  return (
    <View style={{ gap: 8, marginTop: 4 }}>
      <View style={[styles.split, { backgroundColor: soft + '66' }]}>
        <View style={{ width: `${pct}%`, height: '100%', borderRadius: 7, backgroundColor: color }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.statLabel}>Đã thuộc: {mastered} từ</Text>
        <Text style={styles.statLabel}>Đang học: {total - mastered} từ</Text>
      </View>
      {hideHint ? null : <Text style={styles.sectionHint}>Làm quiz từ vựng để có biểu đồ điểm theo từng buổi.</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: ds.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 16, paddingTop: 8 },
  grabber: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: ds.line, marginBottom: 10 },
  hero: { borderRadius: 20, padding: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: dsFont.displayHeavy, fontSize: 21, color: MAP.text },
  heroScore: { fontFamily: dsFont.displayHeavy, fontSize: 34 },
  bandChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  bandText: { fontFamily: dsFont.bold, fontSize: 11.5 },
  close: { width: 34, height: 34, borderRadius: 11, backgroundColor: MAP.card, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  aiQuote: { flexDirection: 'row', gap: 8, marginTop: 12, padding: 11, borderRadius: 14, backgroundColor: MAP.card },
  aiQuoteText: { flex: 1, fontFamily: dsFont.medium, fontSize: 13, lineHeight: 19, color: MAP.textAccent },
  confText: { fontFamily: dsFont.medium, fontSize: 11, color: MAP.textSoft, marginTop: 8 },
  section: { marginTop: 20 },
  sectionTitle: { fontFamily: dsFont.bold, fontSize: 15, color: MAP.text },
  sectionHint: { fontFamily: dsFont.body, fontSize: 12, color: MAP.textSoft, marginTop: 2 },
  ranges: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 10 },
  rangeChip: { flex: 1, height: 34, borderRadius: 11, borderWidth: 1, borderColor: MAP.border, alignItems: 'center', justifyContent: 'center', backgroundColor: MAP.card },
  rangeText: { fontFamily: dsFont.semibold, fontSize: 12, color: MAP.textAccent },
  tooltip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, backgroundColor: MAP.bg, marginBottom: 6 },
  tooltipScore: { fontFamily: dsFont.displayHeavy, fontSize: 22 },
  tooltipTitle: { fontFamily: dsFont.semibold, fontSize: 13, color: MAP.text },
  tooltipDate: { fontFamily: dsFont.body, fontSize: 11, color: MAP.textSoft },
  statRow: { flexDirection: 'row', backgroundColor: MAP.bg, borderRadius: 14, paddingVertical: 10, marginTop: 6 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: dsFont.displayHeavy, fontSize: 17, color: MAP.text },
  statLabel: { fontFamily: dsFont.body, fontSize: 11, color: MAP.textSoft, marginTop: 1 },
  empty: { height: 110, borderRadius: 14, backgroundColor: MAP.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  emptyText: { fontFamily: dsFont.body, fontSize: 13, color: MAP.textSoft, textAlign: 'center', lineHeight: 18 },
  radials: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: 12, marginTop: 12 },
  radial: { width: 78, alignItems: 'center' },
  radialValue: { fontFamily: dsFont.displayHeavy, fontSize: 16 },
  radialLabel: { fontFamily: dsFont.semibold, fontSize: 11.5, color: MAP.textAccent, marginTop: 5, textAlign: 'center' },
  insightHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insight: { borderRadius: 14, padding: 11, marginTop: 8, gap: 3 },
  insightTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  insightTitle: { fontFamily: dsFont.bold, fontSize: 13, color: MAP.text },
  insightItem: { fontFamily: dsFont.body, fontSize: 12.5, color: MAP.textAccent, lineHeight: 18 },
  cta: { height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontFamily: dsFont.bold, fontSize: 15 },
  ghost: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: MAP.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: MAP.card },
  ghostText: { fontFamily: dsFont.semibold, fontSize: 13, color: MAP.textAccent },
  split: { height: 14, borderRadius: 7, overflow: 'hidden' },
});
