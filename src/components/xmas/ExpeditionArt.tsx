// components/xmas/ExpeditionArt.tsx — Minh hoạ "Hành trình Bắc Cực" cho tab Tiến độ:
// lửa trại (chuỗi ngày học), và hình riêng cho từng chỉ số thống kê.
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Polygon, Rect } from 'react-native-svg';

const SNOW = '#F8FAFC';

const Spark: React.FC<{ x: number; delay: number; size: number }> = ({ x, delay, size }) => {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false));
    return () => cancelAnimation(p);
  }, [delay, p]);
  const st = useAnimatedStyle(() => ({ opacity: 1 - p.value, transform: [{ translateY: -p.value * size * 0.9 }, { translateX: Math.sin(p.value * 5) * 4 }] }));
  return <Animated.View style={[{ position: 'absolute', left: x, bottom: size * 0.45, width: 3, height: 3, borderRadius: 2, backgroundColor: '#FDE68A' }, st]} />;
};

/** Lửa trại: củi, ngọn lửa chập chờn, tia lửa bay lên, quầng sáng ấm trên tuyết. */
export const Campfire: React.FC<{ size?: number }> = ({ size = 64 }) => {
  const f = useSharedValue(0);
  useEffect(() => {
    f.value = withRepeat(withTiming(1, { duration: 420, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(f);
  }, [f]);
  const outer = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.88 + f.value * 0.2 }, { scaleX: 1 - f.value * 0.06 }] }));
  const inner = useAnimatedStyle(() => ({ transform: [{ scaleY: 1.05 - f.value * 0.2 }] }));
  const glow = useAnimatedStyle(() => ({ opacity: 0.35 + f.value * 0.25 }));
  return (
    <View pointerEvents="none" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Animated.View style={[{ position: 'absolute', bottom: -size * 0.1, width: size * 1.3, height: size * 0.6, borderRadius: size, backgroundColor: '#FB923C' }, glow]} />
      <Animated.View style={[{ position: 'absolute', bottom: size * 0.22, width: size * 0.5, height: size * 0.62, borderTopLeftRadius: size, borderTopRightRadius: size, borderBottomLeftRadius: size * 0.2, borderBottomRightRadius: size * 0.2, backgroundColor: '#F97316', transformOrigin: 'bottom' as never }, outer]} />
      <Animated.View style={[{ position: 'absolute', bottom: size * 0.22, width: size * 0.28, height: size * 0.38, borderTopLeftRadius: size, borderTopRightRadius: size, borderBottomLeftRadius: size * 0.2, borderBottomRightRadius: size * 0.2, backgroundColor: '#FDE68A', transformOrigin: 'bottom' as never }, inner]} />
      <Svg width={size} height={size * 0.32} viewBox="0 0 100 32">
        <Rect x={10} y={10} width={80} height={12} rx={6} fill="#78350F" transform="rotate(-12 50 16)" />
        <Rect x={10} y={10} width={80} height={12} rx={6} fill="#92400E" transform="rotate(12 50 16)" />
        <Ellipse cx={50} cy={28} rx={46} ry={4} fill={SNOW} opacity={0.6} />
      </Svg>
      <Spark x={size * 0.42} delay={0} size={size} />
      <Spark x={size * 0.55} delay={500} size={size} />
      <Spark x={size * 0.48} delay={950} size={size} />
    </View>
  );
};

export type MetricKind = 'mastered' | 'accuracy' | 'time' | 'speed';

/** Màu nhận diện từng chỉ số (viền, gradient nhẹ). */
export const METRIC_TONE: Record<MetricKind, { glow: string; tint: [string, string] }> = {
  mastered: { glow: '#67E8F9', tint: ['rgba(30,58,138,0.55)', 'rgba(11,23,48,0.92)'] },
  accuracy: { glow: '#FBBF24', tint: ['rgba(161,98,7,0.35)', 'rgba(11,23,48,0.92)'] },
  time: { glow: '#FB923C', tint: ['rgba(124,45,18,0.45)', 'rgba(28,18,8,0.92)'] },
  speed: { glow: '#34D399', tint: ['rgba(6,95,70,0.45)', 'rgba(11,23,48,0.92)'] },
};

/** Hình minh hoạ ở góc trên phải của thẻ chỉ số. */
export const MetricArt: React.FC<{ kind: MetricKind; size?: number }> = ({ kind, size = 50 }) => (
  <View pointerEvents="none" style={{ width: size, height: size }}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {kind === 'mastered' ? (
        <>
          <Rect x={12} y={64} width={60} height={14} rx={3} fill="#1E3A8A" />
          <Rect x={18} y={50} width={56} height={14} rx={3} fill="#0E7490" />
          <Rect x={10} y={36} width={58} height={14} rx={3} fill="#1D4ED8" />
          <Path d="M8 38 Q30 28 70 36 L70 32 Q30 24 8 34 Z" fill={SNOW} />
          <Polygon points="82,20 94,40 86,74 78,74 70,40" fill="#67E8F9" opacity={0.85} />
          <Polygon points="82,20 94,40 82,74" fill="#FFFFFF" opacity={0.3} />
          <Path d="M20 22 h6 M34 14 v6 M50 20 l4 4" stroke="#BAE6FD" strokeWidth={3} strokeLinecap="round" />
        </>
      ) : kind === 'accuracy' ? (
        <>
          <Circle cx={46} cy={54} r={34} fill="#B91C1C" />
          <Circle cx={46} cy={54} r={24} fill={SNOW} />
          <Circle cx={46} cy={54} r={14} fill="#B91C1C" />
          <Circle cx={46} cy={54} r={5} fill="#FBBF24" />
          <Path d="M14 30 Q46 12 78 30 L78 24 Q46 6 14 24 Z" fill={SNOW} />
          <Path d="M48 52 L92 14" stroke="#FBBF24" strokeWidth={4} strokeLinecap="round" />
          <Polygon points="92,14 80,16 90,26" fill="#FBBF24" />
        </>
      ) : kind === 'time' ? (
        <>
          <Rect x={22} y={8} width={56} height={8} rx={3} fill="#92400E" />
          <Rect x={22} y={84} width={56} height={8} rx={3} fill="#92400E" />
          <Path d="M28 16 H72 Q72 40 52 50 Q72 60 72 84 H28 Q28 60 48 50 Q28 40 28 16 Z" fill="rgba(186,230,253,0.35)" stroke="#BAE6FD" strokeWidth={2} />
          <Path d="M34 22 H66 Q64 36 50 44 Q36 36 34 22 Z" fill="#FBBF24" />
          <Path d="M36 82 Q50 64 64 82 Z" fill="#FBBF24" />
          <Path d="M50 46 V 70" stroke="#FDE68A" strokeWidth={2} strokeDasharray="2,3" />
          <Ellipse cx={50} cy={93} rx={34} ry={4} fill={SNOW} />
        </>
      ) : (
        <>
          <Polygon points="58,6 22,56 46,56 36,94 78,40 54,40 66,6" fill="#34D399" opacity={0.9} />
          <Polygon points="58,6 46,56 36,94 54,40 66,6" fill="#FFFFFF" opacity={0.25} />
          <Path d="M8 30 h14 M4 46 h12 M10 62 h10" stroke="#6EE7B7" strokeWidth={3} strokeLinecap="round" />
        </>
      )}
    </Svg>
  </View>
);
