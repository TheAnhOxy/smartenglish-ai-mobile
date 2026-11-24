// components/xmas/WinterUI.tsx — Thành phần giao diện mùa đông dùng chung (chỉ dùng khi bật Giáng sinh ở giao diện tối).
// Màu viết inline (không qua StyleSheet.create) để bộ đổi màu giao diện tối không biến trắng tuyết thành nền tối.
import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';

/** Bảng màu Trang chủ mùa đông. */
export const XMAS = {
  midnight: '#060D1F',
  winterBlue: '#0B1730',
  glass: '#17243A',
  ice: '#93C5FD',
  cyan: '#67E8F9',
  gold: '#FBBF24',
  red: '#DC2626',
  pine: '#15803D',
  snow: '#F8FAFC',
  warm: '#FDE68A',
} as const;

/** Nền kính mờ tối cho thẻ. */
export const glassCard = (tint = 'rgba(147,197,253,0.22)'): ViewStyle => ({
  backgroundColor: 'rgba(23,36,58,0.9)',
  borderColor: tint,
});

/** Tuyết đọng dọc mép trên của thẻ (đặt làm con của thẻ có overflow hidden hoặc ngay sát mép). */
export const SnowEdge: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
  <Svg pointerEvents="none" width="100%" height={12} viewBox="0 0 400 12" preserveAspectRatio="none" style={[{ position: 'absolute', top: -1, left: 0, right: 0 }, style]}>
    <Path d="M0 0 H400 V3 Q372 11 344 4 Q306 12 268 4 Q226 11 186 3 Q146 11 106 4 Q66 12 34 4 Q16 9 0 5 Z" fill={XMAS.snow} />
  </Svg>
);

/** Ụ tuyết nhỏ ở góc trên trái thẻ. */
export const SnowCorner: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <Svg pointerEvents="none" width={size} height={size * 0.45} viewBox="0 0 80 36" style={{ position: 'absolute', top: -2, left: 6 }}>
    <Path d="M0 2 Q10 -2 22 4 Q34 -2 48 4 Q62 0 80 2 Q70 16 54 12 Q44 24 30 14 Q16 20 8 12 Q2 10 0 2 Z" fill={XMAS.snow} />
  </Svg>
);

/** Vệt sáng lướt chéo qua phần tử (nút, đồng xu) theo chu kỳ. Đặt trong khung có overflow hidden. */
export const ShimmerSweep: React.FC<{ width: number; every?: number; delay?: number; color?: string }> = ({ width, every = 3200, delay = 0, color = 'rgba(255,255,255,0.55)' }) => {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), withDelay(every, withTiming(0, { duration: 0 }))), -1, false));
    return () => cancelAnimation(p);
  }, [delay, every, p]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(p.value, [0, 1], [-60, width + 60]) }, { rotate: '20deg' }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -20, bottom: -20, width: 28 }, st]}>
      <LinearGradient colors={['rgba(255,255,255,0)', color, 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
};

/** Nhánh thông phủ tuyết có quả châu — trang trí góc. `flip` để đặt góc phải. */
export const PineBranch: React.FC<{ size?: number; flip?: boolean; style?: StyleProp<ViewStyle> }> = ({ size = 70, flip, style }) => (
  <View pointerEvents="none" style={[{ width: size, height: size * 0.6, transform: flip ? [{ scaleX: -1 }] : undefined }, style]}>
    <Svg width={size} height={size * 0.6} viewBox="0 0 120 72">
      <Path d="M0 10 Q50 18 116 8" stroke="#713F12" strokeWidth={4} fill="none" strokeLinecap="round" />
      {[10, 26, 42, 58, 74, 90, 104].map((x, i) => (
        <Path key={i} d={`M ${x} ${12 - i * 0.4} l 10 16 M ${x} ${12 - i * 0.4} l -6 16 M ${x} ${12 - i * 0.4} l 14 6`} stroke={i % 2 ? '#166534' : '#15803D'} strokeWidth={4} strokeLinecap="round" />
      ))}
      <Path d="M0 8 Q30 2 56 10 Q84 2 116 6" stroke={XMAS.snow} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M44 14 V34" stroke="#94A3B8" strokeWidth={1.2} />
      <Circle cx={44} cy={40} r={7} fill={XMAS.red} />
      <Circle cx={42} cy={38} r={2} fill="rgba(255,255,255,0.7)" />
      <Path d="M86 12 V44" stroke="#94A3B8" strokeWidth={1.2} />
      <Circle cx={86} cy={50} r={6} fill={XMAS.gold} />
      <Circle cx={84} cy={48} r={1.8} fill="rgba(255,255,255,0.7)" />
    </Svg>
  </View>
);

/** Hạt lấp lánh quanh một phần tử tròn (avatar, đồng xu). */
export const SparkleRing: React.FC<{ size: number; color?: string }> = ({ size, color = XMAS.gold }) => {
  const spots = [
    { x: 0.05, y: 0.15, d: 0 },
    { x: 0.92, y: 0.08, d: 700 },
    { x: 0.98, y: 0.78, d: 1400 },
    { x: 0.02, y: 0.86, d: 2100 },
  ];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: size, height: size }}>
      {spots.map((p, i) => (
        <Sparkle key={i} x={p.x * size} y={p.y * size} delay={p.d} color={color} />
      ))}
    </View>
  );
};

const Sparkle: React.FC<{ x: number; y: number; delay: number; color: string }> = ({ x, y, delay, color }) => {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 600 }), withDelay(1700, withTiming(0, { duration: 0 }))), -1, false));
    return () => cancelAnimation(v);
  }, [delay, v]);
  const st = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.4 + v.value * 0.8 }, { rotate: '45deg' }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x - 4, top: y - 4, width: 8, height: 8 }, st]}>
      <View style={{ position: 'absolute', left: 3.25, top: 0, width: 1.5, height: 8, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', top: 3.25, left: 0, height: 1.5, width: 8, backgroundColor: color, borderRadius: 1 }} />
    </Animated.View>
  );
};
