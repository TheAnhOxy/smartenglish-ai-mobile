// winter/WinterArt.tsx — Hình vẽ vector (SVG) cho bản đồ mùa đông + chuyển động nhẹ.
// Mỗi hình có lệch pha (delay) để các chuyển động không chạy cùng lúc.
import React, { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import { GiftBox, Snowman, XmasTree } from '@/src/components/xmas/XmasArt';
import type { WinterDecor } from './winterWorlds';

interface ArtProps {
  size?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/** Lặp: chờ `wait` ms rồi chạy chuỗi ngắn — chuyển động "thỉnh thoảng". */
const useOccasional = (delay: number, wait: number, steps: [number, number][]) => {
  const v = useSharedValue(0);
  useEffect(() => {
    const seq = steps.map(([to, ms], i) =>
      i === 0 ? withDelay(wait, withTiming(to, { duration: ms, easing: Easing.inOut(Easing.quad) })) : withTiming(to, { duration: ms, easing: Easing.inOut(Easing.quad) }),
    );
    v.value = withDelay(delay, withRepeat(withSequence(...(seq as [number, ...number[]])), -1, false));
    return () => cancelAnimation(v);
  }, [delay, wait, v]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
};

/** Tuần lộc: thỉnh thoảng gật / ngẩng đầu. */
export const Reindeer: React.FC<ArtProps> = ({ size = 50, delay = 0, style }) => {
  const nod = useOccasional(delay, 2600, [
    [1, 260],
    [-0.4, 260],
    [0, 300],
  ]);
  const head = useAnimatedStyle(() => ({ transform: [{ rotate: `${nod.value * 10}deg` }] }));
  const w = size;
  const h = size;
  return (
    <View pointerEvents="none" style={[{ width: w, height: h }, style]}>
      <Svg width={w} height={h} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
        <Ellipse cx={50} cy={95} rx={30} ry={4} fill="rgba(0,0,0,0.25)" />
        <Rect x={30} y={70} width={6} height={24} rx={3} fill="#78350F" />
        <Rect x={42} y={72} width={6} height={22} rx={3} fill="#92400E" />
        <Rect x={60} y={72} width={6} height={22} rx={3} fill="#92400E" />
        <Rect x={70} y={70} width={6} height={24} rx={3} fill="#78350F" />
        <Ellipse cx={54} cy={66} rx={30} ry={15} fill="#A16207" />
        <Ellipse cx={54} cy={72} rx={18} ry={6} fill="#FDE68A" opacity={0.6} />
        <Path d="M80 60 Q90 56 86 64 Z" fill="#A16207" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, head]}>
        <Svg width={w} height={h} viewBox="0 0 100 100">
          <Path d="M22 22 L16 6 M16 14 L8 10 M22 22 L30 6 M28 12 L36 8" stroke="#D6B27C" strokeWidth={3} strokeLinecap="round" />
          <Rect x={24} y={40} width={12} height={22} rx={5} fill="#A16207" />
          <Ellipse cx={26} cy={32} rx={13} ry={11} fill="#B45309" />
          <Circle cx={22} cy={30} r={2} fill="#1E293B" />
          <Circle cx={15} cy={36} r={4.5} fill="#EF4444" />
          <Path d="M24 50 Q30 56 36 50" stroke="#DC2626" strokeWidth={4} fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
};

/** Khói bay lên từ ống khói. */
const Smoke: React.FC<{ x: number; y: number; delay: number }> = ({ x, y, delay }) => {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }), -1, false));
    return () => cancelAnimation(p);
  }, [delay, p]);
  const st = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - p.value),
    transform: [{ translateY: -p.value * 26 }, { translateX: p.value * 6 }, { scale: 0.6 + p.value * 1.1 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x - 5, top: y - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#CBD5E1' }, st]}
    />
  );
};

/** Nhà gỗ phủ tuyết, cửa sổ vàng ấm, khói bay. */
export const Cabin: React.FC<ArtProps> = ({ size = 56, delay = 0, style }) => {
  const w = size;
  const h = size;
  const glow = useOccasional(delay, 0, [
    [1, 1400],
    [0.4, 1400],
  ]);
  const win = useAnimatedStyle(() => ({ opacity: 0.6 + glow.value * 0.4 }));
  return (
    <View pointerEvents="none" style={[{ width: w, height: h }, style]}>
      <Svg width={w} height={h} viewBox="0 0 100 100">
        <Rect x={64} y={18} width={10} height={22} fill="#57534E" />
        <Rect x={18} y={48} width={64} height={46} rx={3} fill="#7C2D12" />
        <Path d="M18 58 H82 M18 70 H82 M18 82 H82" stroke="#5B1F0C" strokeWidth={2} />
        <Polygon points="8,52 50,18 92,52" fill="#9A3412" />
        <Path d="M6 54 Q20 40 50 16 Q80 40 94 54 Q80 50 50 26 Q20 50 6 54 Z" fill="#F1F5F9" />
        <Rect x={42} y={66} width={16} height={28} rx={2} fill="#451A03" />
        <Rect x={24} y={62} width={14} height={12} rx={2} fill="#FBBF24" />
        <Rect x={62} y={62} width={14} height={12} rx={2} fill="#FBBF24" />
        <Path d="M14 94 H86" stroke="#F1F5F9" strokeWidth={5} strokeLinecap="round" />
      </Svg>
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: w * 0.2, top: h * 0.58, width: w * 0.6, height: h * 0.18, borderRadius: 6, backgroundColor: 'rgba(251,191,36,0.25)', shadowColor: '#FBBF24', shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
          win,
        ]}
      />
      <Smoke x={w * 0.69} y={h * 0.16} delay={delay} />
      <Smoke x={w * 0.69} y={h * 0.16} delay={delay + 1300} />
    </View>
  );
};

/** Đèn lồng: ánh sáng vàng "thở". */
export const Lantern: React.FC<ArtProps> = ({ size = 44, delay = 0, style }) => {
  const g = useOccasional(delay, 0, [
    [1, 1100],
    [0.3, 1300],
  ]);
  const halo = useAnimatedStyle(() => ({ opacity: 0.25 + g.value * 0.45, transform: [{ scale: 0.85 + g.value * 0.3 }] }));
  const w = size * 0.6;
  const h = size * 1.2;
  return (
    <View pointerEvents="none" style={[{ width: w, height: h, alignItems: 'center' }, style]}>
      <Animated.View
        style={[{ position: 'absolute', top: h * 0.08, width: w * 1.6, height: w * 1.6, borderRadius: w, backgroundColor: 'rgba(251,191,36,0.35)' }, halo]}
      />
      <Svg width={w} height={h} viewBox="0 0 60 120">
        <Rect x={27} y={40} width={6} height={78} fill="#334155" />
        <Rect x={18} y={112} width={24} height={6} rx={2} fill="#1E293B" />
        <Path d="M16 16 H44 L40 44 H20 Z" fill="#FBBF24" stroke="#1E293B" strokeWidth={3} />
        <Path d="M12 16 L30 4 L48 16 Z" fill="#1E293B" />
        <Path d="M10 16 Q30 8 50 16" stroke="#F1F5F9" strokeWidth={4} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

/** Kẹo gậy Giáng sinh. */
export const CandyCane: React.FC<ArtProps> = ({ size = 40, style }) => (
  <View pointerEvents="none" style={[{ width: size * 0.6, height: size }, style]}>
    <Svg width={size * 0.6} height={size} viewBox="0 0 60 100">
      <Path d="M40 96 V30 A14 14 0 0 0 12 30" stroke="#F8FAFC" strokeWidth={12} fill="none" strokeLinecap="round" />
      <Path d="M40 96 V30 A14 14 0 0 0 12 30" stroke="#DC2626" strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray="8,8" />
    </Svg>
  </View>
);

/** Người bánh gừng: đung đưa. */
export const Gingerbread: React.FC<ArtProps> = ({ size = 40, delay = 0, style }) => {
  const s = useOccasional(delay, 0, [
    [1, 900],
    [-1, 900],
  ]);
  const sway = useAnimatedStyle(() => ({ transform: [{ rotate: `${s.value * 6}deg` }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ width: size, height: size }, sway, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx={50} cy={24} r={16} fill="#B45309" />
        <Path d="M30 44 H70 L84 58 Q88 64 80 66 L68 58 L70 80 L80 94 Q82 100 74 98 L58 84 H42 L26 98 Q18 100 20 94 L30 80 L32 58 L20 66 Q12 64 16 58 Z" fill="#B45309" />
        <Circle cx={44} cy={22} r={2.5} fill="#F8FAFC" />
        <Circle cx={56} cy={22} r={2.5} fill="#F8FAFC" />
        <Path d="M43 30 Q50 35 57 30" stroke="#F8FAFC" strokeWidth={2} fill="none" />
        <Circle cx={50} cy={54} r={3} fill="#DC2626" />
        <Circle cx={50} cy={66} r={3} fill="#22C55E" />
        <Path d="M22 60 Q26 56 30 60 M70 60 Q74 56 78 60" stroke="#F8FAFC" strokeWidth={2} fill="none" />
      </Svg>
    </Animated.View>
  );
};

/** Biển chỉ đường bằng gỗ phủ tuyết. */
export const Signpost: React.FC<ArtProps> = ({ size = 46, style }) => (
  <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x={46} y={20} width={8} height={78} fill="#78350F" />
      <Path d="M18 26 H78 L88 36 L78 46 H18 Z" fill="#A16207" />
      <Path d="M82 54 H26 L16 64 L26 74 H82 Z" fill="#92400E" />
      <Path d="M18 26 H78 L86 32 H20 Z" fill="#F1F5F9" />
      <Path d="M82 54 H26 L20 59 H82 Z" fill="#F1F5F9" />
      <Ellipse cx={50} cy={96} rx={24} ry={4} fill="#F1F5F9" />
    </Svg>
  </View>
);

/** Bụi cây và tảng đá phủ tuyết. */
export const SnowBush: React.FC<ArtProps> = ({ size = 46, style }) => (
  <View pointerEvents="none" style={[{ width: size, height: size * 0.7 }, style]}>
    <Svg width={size} height={size * 0.7} viewBox="0 0 100 70">
      <Ellipse cx={70} cy={56} rx={22} ry={12} fill="#475569" />
      <Path d="M50 58 Q70 38 90 56" stroke="#F1F5F9" strokeWidth={6} fill="none" strokeLinecap="round" />
      <Circle cx={30} cy={44} r={20} fill="#166534" />
      <Circle cx={48} cy={46} r={16} fill="#15803D" />
      <Path d="M12 40 Q28 20 46 34 Q56 28 62 40" stroke="#F1F5F9" strokeWidth={7} fill="none" strokeLinecap="round" />
      <Circle cx={26} cy={50} r={2.5} fill="#DC2626" />
      <Circle cx={44} cy={54} r={2.5} fill="#DC2626" />
    </Svg>
  </View>
);

/** Mũ Noel nhỏ (đặt trên nút bài học hiện tại). */
export const SantaHat: React.FC<ArtProps> = ({ size = 34, style }) => (
  <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M18 78 Q30 20 70 18 Q86 22 84 44 L74 40 Q66 30 56 40 Q46 60 44 78 Z" fill="#DC2626" />
      <Rect x={10} y={72} width={60} height={16} rx={8} fill="#F8FAFC" />
      <Circle cx={84} cy={46} r={10} fill="#F8FAFC" />
    </Svg>
  </View>
);

/** Xe trượt ông già Noel + tuần lộc (bóng đen trên nền trăng/trời). */
export const SantaSleigh: React.FC<{ width?: number }> = ({ width = 150 }) => (
  <Svg width={width} height={width * 0.33} viewBox="0 0 150 50">
    <G fill="#0B1730" opacity={0.95}>
      <Path d="M4 30 Q10 20 22 24 L30 22 L32 30 L26 34 L12 34 Z" />
      <Path d="M20 22 L18 12 M22 22 L26 12" stroke="#0B1730" strokeWidth={2} />
      <Path d="M40 30 Q46 20 58 24 L66 22 L68 30 L62 34 L48 34 Z" />
      <Path d="M56 22 L54 12 M58 22 L62 12" stroke="#0B1730" strokeWidth={2} />
      <Path d="M30 28 H44 M66 28 H82" stroke="#0B1730" strokeWidth={1.5} />
      <Path d="M82 22 H120 Q132 22 130 34 L126 40 H86 Q80 34 82 22 Z" />
      <Path d="M84 44 H134 Q142 44 142 36" stroke="#0B1730" strokeWidth={2.5} fill="none" />
      <Circle cx={108} cy={12} r={7} />
      <Path d="M100 22 Q100 14 108 16 Q116 14 116 22 Z" />
      <Path d="M118 26 L136 14 L138 20 L122 30 Z" />
    </G>
    <Circle cx={4} cy={26} r={2.2} fill="#EF4444" />
  </Svg>
);

/** Vẽ một trang trí theo loại (dùng cho dải trang trí dọc đường đi). */
export const WinterDecorItem: React.FC<{ kind: WinterDecor; delay?: number }> = ({ kind, delay = 0 }) => {
  switch (kind) {
    case 'tree':
      return <XmasTree size={44} delay={delay} />;
    case 'snowman':
      return <Snowman size={40} delay={delay} />;
    case 'gift':
      return (
        <View style={{ paddingTop: 18 }}>
          <GiftBox size={32} delay={delay} />
        </View>
      );
    case 'reindeer':
      return <Reindeer size={50} delay={delay} />;
    case 'cabin':
      return <Cabin size={54} delay={delay} />;
    case 'lantern':
      return <Lantern size={46} delay={delay} />;
    case 'candy':
      return (
        <View style={{ paddingTop: 12 }}>
          <CandyCane size={40} />
        </View>
      );
    case 'gingerbread':
      return (
        <View style={{ paddingTop: 10 }}>
          <Gingerbread size={40} delay={delay} />
        </View>
      );
    case 'signpost':
      return <Signpost size={46} />;
    case 'bush':
      return (
        <View style={{ paddingTop: 18 }}>
          <SnowBush size={48} />
        </View>
      );
    default:
      return null;
  }
};
