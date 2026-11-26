import React, { memo, useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline } from 'react-native-svg';
import { ChevronRight, Gauge, Minus, Scale, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Pressable } from '@/src/core/components/PressableCompat';
import { dk } from '@/src/theme/themeMode';
import { ds, dsFont, dsRadius, dsShadow } from '@/src/theme/ds';
import { haptic } from '@/src/components/ds/feedback';
import {
  CONFIDENCE_LABEL,
  SKILL_BAND_LABEL,
  aiConfidence,
  overallScore,
  skillBand,
  strongestAndWeakest,
  type SkillKey,
  type SkillPoint,
  type Trend,
} from '../../../application/skillMap';
import { BAND_COLOR, MAP, SKILL_THEME } from './skillColorMap';
import { SkillOverviewChart } from './SkillOverviewChart';

const fmtUpdated = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()}/${d.getMonth() + 1} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const TrendBadge = ({ trend, size = 13 }: { trend: Trend; size?: number }) => {
  if (!trend) return null;
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const color = trend === 'up' ? '#16A34A' : trend === 'down' ? '#DC2626' : '#64748B';
  const label = trend === 'up' ? 'Tăng' : trend === 'down' ? 'Giảm' : 'Ổn định';
  return (
    <View style={[styles.trend, { backgroundColor: dk(trend === 'up' ? '#DCFCE7' : trend === 'down' ? '#FEE2E2' : '#F1F5F9', 'bg') }]}>
      <Icon size={size} color={color} />
      <Text style={[styles.trendText, { color }]}>{label}</Text>
    </View>
  );
};

/** Sparkline nhỏ: điểm các buổi gần nhất. */
const Sparkline = memo(({ values, color }: { values: number[]; color: string }) => {
  if (values.length < 2) return <View style={{ width: 54 }} />;
  const w = 54;
  const h = 22;
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * (w - 4) + 2).toFixed(1)},${(h - 2 - (v / 100) * (h - 4)).toFixed(1)}`)
    .join(' ');
  return (
    <Svg width={w} height={h}>
      <Polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});
Sparkline.displayName = 'Sparkline';

/** Thẻ tóm tắt: mạnh nhất · cần ưu tiên · độ cân bằng · độ tin cậy của AI. */
const AIInsightSummaryCard = memo(({ points, onSelect }: { points: SkillPoint[]; onSelect: (k: SkillKey) => void }) => {
  const { strongest, weakest } = strongestAndWeakest(points);
  const good = points.filter((p) => (p.score ?? -1) >= 70).length;
  const conf = aiConfidence(points);
  const sessions = points.reduce((a, p) => a + p.sessions, 0);
  const rows: Array<{ icon: React.ReactNode; label: string; value: string; color?: string; onPress?: () => void }> = [
    {
      icon: <TrendingUp size={15} color="#16A34A" />,
      label: 'Mạnh nhất',
      value: strongest ? `${strongest.label} · ${strongest.score}` : '—',
      color: strongest ? SKILL_THEME[strongest.key].main : undefined,
      onPress: strongest ? () => onSelect(strongest.key) : undefined,
    },
    {
      icon: <Gauge size={15} color="#F97316" />,
      label: 'Cần ưu tiên',
      value: weakest ? `${weakest.label} · ${weakest.score}` : '—',
      color: weakest ? SKILL_THEME[weakest.key].main : undefined,
      onPress: weakest ? () => onSelect(weakest.key) : undefined,
    },
    { icon: <Scale size={15} color={MAP.primary} />, label: 'Độ cân bằng', value: `${good}/6 đạt mức Tốt` },
    { icon: <ShieldCheck size={15} color="#0EA5E9" />, label: 'Độ tin cậy AI', value: `${CONFIDENCE_LABEL[conf]} · ${sessions} buổi` },
  ];
  return (
    <View style={styles.summary}>
      {rows.map((r) => (
        <Pressable key={r.label} onPress={r.onPress} disabled={!r.onPress} style={styles.summaryCell} accessibilityRole={r.onPress ? 'button' : undefined}>
          <View style={styles.summaryHead}>
            {r.icon}
            <Text style={styles.summaryLabel}>{r.label}</Text>
          </View>
          <Text style={[styles.summaryValue, r.color ? { color: dk(r.color) } : null]} numberOfLines={1}>
            {r.value}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});
AIInsightSummaryCard.displayName = 'AIInsightSummaryCard';

const SkillSummaryCard = memo(({ point, onPress, index }: { point: SkillPoint; onPress: (k: SkillKey) => void; index: number }) => {
  const theme = SKILL_THEME[point.key];
  const Icon = theme.icon;
  const band = skillBand(point.score);
  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 50).duration(280)}>
      <Pressable
        onPress={() => {
          haptic('select');
          onPress(point.key);
        }}
        style={({ pressed }) => [styles.row, pressed && { transform: [{ scale: 0.985 }], backgroundColor: dk(theme.soft, 'bg') }]}
        accessibilityRole="button"
        accessibilityLabel={`${point.label}, ${point.score ?? 'chưa có'} điểm, ${SKILL_BAND_LABEL[band]}. Xem chi tiết`}
      >
        <View style={[styles.rowIcon, { backgroundColor: dk(theme.soft, 'bg') }]}>
          <Icon size={19} color={theme.main} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.rowTitleLine}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {point.label}
            </Text>
            <TrendBadge trend={point.trend} size={11} />
          </View>
          <Text style={[styles.rowBand, { color: dk(BAND_COLOR[band]) }]} numberOfLines={1}>
            {SKILL_BAND_LABEL[band]} <Text style={styles.rowSource}>· {point.source}</Text>
          </Text>
          <View style={[styles.rowTrack, { backgroundColor: dk('#EEF2F7', 'bg') }]}>
            <View style={[styles.rowFill, { width: `${point.score ?? 0}%`, backgroundColor: theme.main }]} />
          </View>
        </View>
        <Sparkline values={point.spark} color={theme.main} />
        <Text style={[styles.rowScore, { color: point.score != null ? dk(theme.main) : dk('#94A3B8') }]}>{point.score ?? '—'}</Text>
        <ChevronRight size={16} color={dk('#94A3B8')} />
      </Pressable>
    </Animated.View>
  );
});
SkillSummaryCard.displayName = 'SkillSummaryCard';

interface SectionProps {
  points: SkillPoint[];
  updatedAt: string | null;
  /** Đang tải lại số liệu mới (vừa quay lại tab / AI vừa chấm xong). */
  refreshing?: boolean;
  onOpen: (key: SkillKey) => void;
}

/** AI Skill Map: header · tóm tắt · biểu đồ lục giác · danh sách 6 kỹ năng. */
export const SkillMapSection = ({ points, updatedAt, refreshing, onOpen }: SectionProps) => {
  const [selected, setSelected] = useState<SkillKey | null>(null);
  const overall = overallScore(points);
  const updated = fmtUpdated(updatedAt);

  // Chạm node: highlight trục trước rồi mở chi tiết
  const select = useCallback(
    (key: SkillKey) => {
      setSelected(key);
      setTimeout(() => {
        onOpen(key);
        setSelected(null);
      }, 220);
    },
    [onOpen],
  );

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[dk('#EEF2FF', 'bg'), dk('#FFFFFF', 'bg')]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: dsRadius.xl, height: 220 }]}
      />
      <View style={styles.header}>
        <LinearGradient colors={['#818CF8', '#6366F1']} style={styles.headerIcon}>
          <Sparkles size={18} color="#FFFFFF" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>AI Skill Map</Text>
          <Text style={styles.subtitle}>AI tổng hợp từ quá trình học để đánh giá 6 kỹ năng của bạn</Text>
          <View style={styles.updatedRow}>
            {refreshing ? <ActivityIndicator size="small" color={MAP.primary} style={{ transform: [{ scale: 0.7 }] }} /> : null}
            <Text style={styles.updated}>{refreshing ? 'Đang cập nhật số liệu mới...' : updated ? `Cập nhật ${updated}` : ''}</Text>
          </View>
        </View>
      </View>

      <AIInsightSummaryCard points={points} onSelect={onOpen} />

      <View style={{ marginTop: 14 }}>
        <SkillOverviewChart points={points} overall={overall} selected={selected} onSelect={select} />
      </View>

      <View style={{ gap: 8, marginTop: 16 }}>
        {points.map((p, i) => (
          <SkillSummaryCard key={p.key} point={p} index={i} onPress={onOpen} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ds.card,
    borderRadius: dsRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: ds.line,
    overflow: 'hidden',
    ...dsShadow.card,
  },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  headerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: dsFont.displayHeavy, fontSize: 19, color: MAP.text },
  subtitle: { fontFamily: dsFont.body, fontSize: 12.5, color: MAP.textSoft, marginTop: 2, lineHeight: 17 },
  updatedRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3, minHeight: 16 },
  updated: { fontFamily: dsFont.medium, fontSize: 11, color: '#94A3B8' },

  summary: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginTop: 14 },
  summaryCell: {
    width: '49%',
    backgroundColor: MAP.card,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: MAP.border,
  },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  summaryLabel: { fontFamily: dsFont.medium, fontSize: 11, color: MAP.textSoft },
  summaryValue: { fontFamily: dsFont.bold, fontSize: 13, color: MAP.text, marginTop: 3 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: MAP.bg,
  },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { fontFamily: dsFont.bold, fontSize: 14, color: MAP.text, flexShrink: 1 },
  rowBand: { fontFamily: dsFont.semibold, fontSize: 11.5, marginTop: 1 },
  rowSource: { fontFamily: dsFont.body, color: '#94A3B8' },
  rowTrack: { height: 5, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  rowFill: { height: '100%', borderRadius: 3 },
  rowScore: { fontFamily: dsFont.displayHeavy, fontSize: 18, minWidth: 30, textAlign: 'right' },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  trendText: { fontFamily: dsFont.semibold, fontSize: 10.5 },
});
