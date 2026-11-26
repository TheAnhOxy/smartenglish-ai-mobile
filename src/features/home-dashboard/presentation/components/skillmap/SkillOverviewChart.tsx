import React, { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, Polygon, RadialGradient, Stop } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { Pressable } from '@/src/core/components/PressableCompat';
import { dk } from '@/src/theme/themeMode';
import { dsFont } from '@/src/theme/ds';
import { haptic } from '@/src/components/ds/feedback';
import type { SkillKey, SkillPoint } from '../../../application/skillMap';
import { MAP, SKILL_THEME } from './skillColorMap';

// Vòng nền theo mức: Yếu (<40) · Trung bình (40–69) · Tốt (70–84) · Rất tốt (≥85)
const RINGS = [
  { r: 1, label: 'Rất tốt' },
  { r: 0.85, label: 'Tốt' },
  { r: 0.7, label: 'Trung bình' },
  { r: 0.4, label: 'Yếu' },
];

const angleOf = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
const hex = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => `${(cx + r * Math.cos(angleOf(i))).toFixed(1)},${(cy + r * Math.sin(angleOf(i))).toFixed(1)}`).join(' ');

interface Props {
  points: SkillPoint[];
  overall: number | null;
  selected: SkillKey | null;
  onSelect: (key: SkillKey) => void;
}

/**
 * Bản đồ kỹ năng lục giác: 6 trục, vùng tô = điểm từng kỹ năng, nền chia mức, tâm là điểm AI tổng.
 * Nhãn kỹ năng ở ngoài là node chạm được (highlight trục + mở chi tiết).
 */
export const SkillOverviewChart = memo(({ points, overall, selected, onSelect }: Props) => {
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const size = Math.min(w, 360);
  const cx = size / 2;
  // Chừa chỗ cho nhãn node trên/dưới
  const cy = size / 2 + 6;
  const R = size * 0.29;
  const H = size + 22;

  const grow = useSharedValue(0);
  useEffect(() => {
    if (!size) return;
    grow.value = 0;
    grow.value = reduced ? 1 : withDelay(150, withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.1)) }));
  }, [size, points, reduced, grow]);
  const growStyle = useAnimatedStyle(() => ({ transform: [{ scale: grow.value }], opacity: Math.min(1, grow.value * 1.5) }));

  const ratio = (p: SkillPoint) => (p.score == null ? 0.06 : Math.max(0.06, p.score / 100));
  const dataPts = points.map((p, i) => [cx + R * ratio(p) * Math.cos(angleOf(i)), cy + R * ratio(p) * Math.sin(angleOf(i))] as const);
  const dataStr = dataPts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  return (
    <View onLayout={onLayout} style={{ width: '100%', alignItems: 'center' }}>
      {size > 0 ? (
        <View style={{ width: size, height: H }}>
          {/* Nền: vùng mức + trục */}
          <Svg width={size} height={H} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="sm-bg" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={dk('#EEF2FF', 'bg')} stopOpacity="1" />
                <Stop offset="1" stopColor={dk('#F8FAFC', 'bg')} stopOpacity="1" />
              </RadialGradient>
            </Defs>
            {RINGS.map((ring, i) => (
              <Polygon
                key={ring.label}
                points={hex(cx, cy, R * ring.r)}
                fill={i === 0 ? 'url(#sm-bg)' : 'none'}
                stroke={dk(i === 0 ? '#C7D2FE' : '#E2E8F0', 'border')}
                strokeWidth={i === 0 ? 1.5 : 1}
                strokeDasharray={i === 0 ? undefined : '3 4'}
              />
            ))}
            {points.map((p, i) => {
              const on = selected === p.key;
              return (
                <Line
                  key={p.key}
                  x1={cx}
                  y1={cy}
                  x2={cx + R * Math.cos(angleOf(i))}
                  y2={cy + R * Math.sin(angleOf(i))}
                  stroke={on ? SKILL_THEME[p.key].main : dk('#E2E8F0', 'border')}
                  strokeWidth={on ? 2 : 1}
                />
              );
            })}
          </Svg>

          {/* Vùng điểm: mọc ra từ tâm khi tải */}
          <Animated.View style={[StyleSheet.absoluteFill, growStyle]} pointerEvents="none">
            <Svg width={size} height={H}>
              <Defs>
                <RadialGradient id="sm-data" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#8B5CF6" stopOpacity="0.15" />
                  <Stop offset="1" stopColor="#6366F1" stopOpacity="0.38" />
                </RadialGradient>
              </Defs>
              <Polygon points={dataStr} fill="url(#sm-data)" stroke={MAP.primary} strokeWidth={2.2} strokeLinejoin="round" />
              {points.map((p, i) => {
                const on = selected === p.key;
                const [x, y] = dataPts[i];
                return p.score == null ? (
                  <Circle key={p.key} cx={x} cy={y} r={4} fill={dk('#FFFFFF', 'bg')} stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="2 2" />
                ) : (
                  <React.Fragment key={p.key}>
                    {on ? <Circle cx={x} cy={y} r={11} fill={SKILL_THEME[p.key].main} opacity={0.22} /> : null}
                    <Circle cx={x} cy={y} r={on ? 6.5 : 5} fill={SKILL_THEME[p.key].main} stroke={dk('#FFFFFF', 'bg')} strokeWidth={2} />
                  </React.Fragment>
                );
              })}
            </Svg>
          </Animated.View>

          {/* Tâm: điểm AI tổng hợp */}
          <View pointerEvents="none" style={[styles.center, { left: cx - 38, top: cy - 38, backgroundColor: dk('#FFFFFF', 'bg'), shadowColor: MAP.primary }]}>
            <Sparkles size={12} color={MAP.primary} />
            <Text style={[styles.centerValue, { color: dk(MAP.text) }]}>{overall ?? '—'}</Text>
            <Text style={[styles.centerLabel, { color: dk(MAP.textSoft) }]}>AI Score</Text>
          </View>

          {/* Node kỹ năng (nhãn ngoài trục) */}
          {points.map((p, i) => (
            <SkillNode
              key={p.key}
              point={p}
              x={cx + (R + size * 0.12) * Math.cos(angleOf(i))}
              y={cy + (R + size * 0.12) * Math.sin(angleOf(i))}
              selected={selected === p.key}
              onPress={onSelect}
            />
          ))}
        </View>
      ) : (
        <View style={{ height: 280 }} />
      )}
      <View style={styles.legend}>
        {['Yếu <40', 'Trung bình 40–69', 'Tốt 70–84', 'Rất tốt ≥85'].map((t) => (
          <Text key={t} style={[styles.legendText, { color: dk('#94A3B8') }]}>
            {t}
          </Text>
        ))}
      </View>
    </View>
  );
});
SkillOverviewChart.displayName = 'SkillOverviewChart';

const NODE_W = 92;

const SkillNode = memo(({ point, x, y, selected, onPress }: { point: SkillPoint; x: number; y: number; selected: boolean; onPress: (k: SkillKey) => void }) => {
  const theme = SKILL_THEME[point.key];
  const Icon = theme.icon;
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withSpring(selected ? 1.08 : 1, { damping: 12 });
  }, [selected, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const has = point.score != null;
  return (
    <Pressable
      onPress={() => {
        haptic('select');
        onPress(point.key);
      }}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={`${point.label}: ${has ? `${point.score} điểm` : 'chưa luyện'}. Xem chi tiết`}
      style={{ position: 'absolute', left: x - NODE_W / 2, top: y - 24, width: NODE_W, alignItems: 'center' }}
    >
      <Animated.View
        style={[
          styles.node,
          {
            backgroundColor: selected ? dk(theme.soft, 'bg') : dk('#FFFFFF', 'bg'),
            borderColor: selected ? theme.main : dk('#E2E8F0', 'border'),
            shadowColor: theme.main,
          },
          style,
        ]}
      >
        <View style={[styles.nodeIcon, { backgroundColor: has ? theme.main : dk('#E2E8F0', 'border') }]}>
          <Icon size={12} color="#FFFFFF" strokeWidth={2.4} />
        </View>
        <Text style={[styles.nodeScore, { color: has ? dk(theme.main) : dk('#94A3B8') }]}>{has ? point.score : '—'}</Text>
      </Animated.View>
      <Text style={[styles.nodeLabel, { color: dk(MAP.textAccent) }]} numberOfLines={1}>
        {point.label}
      </Text>
    </Pressable>
  );
});
SkillNode.displayName = 'SkillNode';

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  centerValue: { fontFamily: dsFont.displayHeavy, fontSize: 24, lineHeight: 28 },
  centerLabel: { fontFamily: dsFont.semibold, fontSize: 10, letterSpacing: 0.4 },
  node: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 4,
    paddingRight: 9,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  nodeIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  nodeScore: { fontFamily: dsFont.displayHeavy, fontSize: 14 },
  nodeLabel: { fontFamily: dsFont.semibold, fontSize: 11, marginTop: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 12, rowGap: 2, marginTop: 4 },
  legendText: { fontFamily: dsFont.medium, fontSize: 11 },
});
