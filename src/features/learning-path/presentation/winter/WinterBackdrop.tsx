// winter/WinterBackdrop.tsx — Khung cảnh đêm mùa đông phía sau bản đồ học:
// trời navy→tím, trăng phát sáng, sao lấp lánh, cực quang trôi chậm, núi tuyết + rừng thông nhiều lớp
// (parallax theo cuộn), và xe trượt ông già Noel thỉnh thoảng bay ngang trời.
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { WINTER } from './winterWorlds';
import { SantaSleigh } from './WinterArt';

const Star: React.FC<{ x: number; y: number; size: number; delay: number }> = ({ x, y, size, delay }) => {
  const o = useSharedValue(0.3);
  useEffect(() => {
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 1300 }), withTiming(0.25, { duration: 1500 })), -1, false));
    return () => cancelAnimation(o);
  }, [delay, o]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: WINTER.snow }, st]}
    />
  );
};

/** Dải núi (SVG) — `peaks` quyết định hình dạng; `snow` vẽ mũ tuyết. */
export const Mountains: React.FC<{ width: number; height: number; color: string; peaks: number[]; snow?: boolean }> = ({ width, height, color, peaks, snow }) => {
  const step = width / (peaks.length - 1);
  const pts = peaks.map((p, i) => ({ x: i * step, y: height * (1 - p) }));
  // Sườn núi cong mềm: đỉnh là điểm điều khiển, nối qua trung điểm giữa hai đỉnh
  let d = `M 0 ${height} L ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y} L ${width} ${height} Z`;
  // Mũ tuyết bo tròn, bám theo đỉnh (đỉnh thật của đường cong thấp hơn điểm điều khiển một chút)
  const caps = snow
    ? pts
        .map((p, i) => {
          if (peaks[i] < 0.55 || i === 0 || i === pts.length - 1) return '';
          const y = p.y + (Math.min(pts[i - 1].y, pts[i + 1].y) - p.y) * 0.25;
          const w = step * 0.26;
          const h = height * 0.1;
          return `M ${p.x - w} ${y + h} Q ${p.x - w * 0.4} ${y + h * 0.2} ${p.x} ${y} Q ${p.x + w * 0.4} ${y + h * 0.2} ${p.x + w} ${y + h} Q ${p.x + w * 0.5} ${y + h * 0.7} ${p.x + w * 0.2} ${y + h * 0.95} Q ${p.x} ${y + h * 0.6} ${p.x - w * 0.3} ${y + h} Q ${p.x - w * 0.6} ${y + h * 0.75} ${p.x - w} ${y + h} Z`;
        })
        .join(' ')
    : '';
  return (
    <Svg width={width} height={height}>
      <Path d={d} fill={color} />
      {caps ? <Path d={caps} fill={WINTER.snow} opacity={0.8} /> : null}
    </Svg>
  );
};

/** Hàng thông (bóng tối) dọc đáy một lớp cảnh. */
export const PineRow: React.FC<{ width: number; height: number; color: string; seed: number }> = ({ width, height, color, seed }) => {
  const trees = Math.ceil(width / 26);
  let d = '';
  for (let i = 0; i < trees; i++) {
    const h = height * (0.55 + (((i * 37 + seed) % 10) / 10) * 0.45);
    const x = i * 26 + ((i * 13 + seed) % 8);
    d += `M ${x} ${height} L ${x + 11} ${height - h} L ${x + 22} ${height} Z `;
  }
  return (
    <Svg width={width} height={height}>
      <Path d={d} fill={color} />
    </Svg>
  );
};

export const WinterBackdrop: React.FC<{ scrollY: SharedValue<number>; showMoon?: boolean }> = ({ scrollY, showMoon = true }) => {
  const { width, height } = useWindowDimensions();

  const stars = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => {
        const r = (n: number) => {
          const v = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
          return v - Math.floor(v);
        };
        return { x: r(1) * width, y: r(2) * height * 0.55, size: 1.5 + r(3) * 2, delay: r(4) * 3000 };
      }),
    [width, height],
  );

  // Cực quang trôi ngang rất chậm
  const aurora = useSharedValue(0);
  // Xe trượt ông già Noel: bay ngang mỗi ~26 giây
  const sleigh = useSharedValue(0);
  useEffect(() => {
    aurora.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }), -1, true);
    sleigh.value = withRepeat(
      withSequence(withDelay(9000, withTiming(1, { duration: 9000, easing: Easing.linear })), withTiming(0, { duration: 0 })),
      -1,
      false,
    );
    return () => {
      cancelAnimation(aurora);
      cancelAnimation(sleigh);
    };
  }, [aurora, sleigh]);

  const auroraStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + aurora.value * 0.25,
    transform: [{ translateX: interpolate(aurora.value, [0, 1], [-width * 0.15, width * 0.15]) }, { skewY: '-8deg' }],
  }));
  const sleighStyle = useAnimatedStyle(() => ({
    opacity: sleigh.value > 0 && sleigh.value < 1 ? 1 : 0,
    transform: [
      { translateX: interpolate(sleigh.value, [0, 1], [width + 40, -200]) },
      { translateY: interpolate(sleigh.value, [0, 0.5, 1], [height * 0.2, height * 0.12, height * 0.17]) },
    ],
  }));
  // Parallax: lớp xa trôi chậm, lớp gần trôi nhanh hơn khi cuộn
  const farStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -Math.min(scrollY.value, 2400) * 0.05 }] }));
  const midStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -Math.min(scrollY.value, 2400) * 0.1 }] }));
  const nearStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -Math.min(scrollY.value, 2400) * 0.16 }] }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <LinearGradient colors={[WINTER.midnight, WINTER.night, '#1E1B4B', WINTER.sapphire]} locations={[0, 0.35, 0.7, 1]} style={StyleSheet.absoluteFill} />

      {stars.map((s, i) => (
        <Star key={i} {...s} />
      ))}

      {/* Trăng */}
      {/* Style inline (không qua StyleSheet): bộ đổi màu giao diện tối sẽ biến nền trắng của trăng thành nền tối */}
      {showMoon ? <><View style={{ position: 'absolute', right: 28, top: height * 0.08, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(241,245,249,0.08)' }} />
      <View
        style={{
          position: 'absolute',
          right: 50,
          top: height * 0.08 + 22,
          width: 76,
          height: 76,
          borderRadius: 38,
          backgroundColor: '#F8FAFC',
          shadowColor: '#E0F2FE',
          shadowOpacity: 0.9,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
      </> : null}

      {/* Cực quang */}
      <Animated.View style={[s.aurora, { top: height * 0.06, width: width * 1.4, left: -width * 0.2 }, auroraStyle]}>
        <LinearGradient
          colors={['rgba(34,197,94,0)', 'rgba(34,197,94,0.35)', 'rgba(103,232,249,0.3)', 'rgba(167,139,250,0.3)', 'rgba(167,139,250,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[s.sleigh, sleighStyle]}>
        <SantaSleigh width={140} />
      </Animated.View>

      {/* Núi + rừng nhiều lớp, neo ở đáy màn hình */}
      <Animated.View style={[s.layer, { top: height * 0.42 }, farStyle]}>
        <Mountains width={width} height={height * 0.3} color="#1E2A4A" peaks={[0.2, 0.7, 0.45, 0.85, 0.5, 0.75, 0.3]} snow />
      </Animated.View>
      <Animated.View style={[s.layer, { top: height * 0.58 }, midStyle]}>
        <Mountains width={width} height={height * 0.24} color="#152241" peaks={[0.35, 0.6, 0.8, 0.4, 0.65, 0.5]} snow />
      </Animated.View>
      <Animated.View style={[s.layer, { top: height * 0.72 }, nearStyle]}>
        <PineRow width={width} height={height * 0.14} color="#0E1A33" seed={3} />
        <View style={{ height: height * 0.4, backgroundColor: '#0E1A33' }} />
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  aurora: { position: 'absolute', height: 120, borderRadius: 120 },
  sleigh: { position: 'absolute', left: 0, top: 0 },
  layer: { position: 'absolute', left: 0, right: 0 },
});
