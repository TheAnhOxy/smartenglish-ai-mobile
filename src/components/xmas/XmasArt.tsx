// components/xmas/XmasArt.tsx — Hình trang trí Giáng sinh vẽ bằng SVG, có chuyển động nhẹ:
// cây thông (đèn nhấp nháy, đung đưa), người tuyết (nhún nhảy), hộp quà (nảy), dây đèn nháy.
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
import Svg, { Circle, Ellipse, Path, Polygon, Rect } from 'react-native-svg';
import { isDarkTheme } from '@/src/theme/themeMode';

const BULB_COLORS = ['#F43F5E', '#FBBF24', '#22D3EE', '#A3E635', '#F472B6'];

/** Đèn nhỏ nhấp nháy (đặt absolute theo toạ độ trong hình). */
const Twinkle: React.FC<{ x: number; y: number; size: number; color: string; delay: number }> = ({ x, y, size, color, delay }) => {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(0.25, { duration: 520 }), withTiming(1, { duration: 520 })), -1, false),
    );
    return () => cancelAnimation(o);
  }, [delay, o]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  const halo = useAnimatedStyle(() => ({ opacity: o.value * 0.45, transform: [{ scale: 0.8 + o.value * 0.4 }] }));
  const dark = isDarkTheme();
  return (
    <>
    {/* Quầng sáng quanh bóng (bóng đổ màu không hiện trên Android) */}
    {dark ? (
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', left: x - size * 1.3, top: y - size * 1.3, width: size * 2.6, height: size * 2.6, borderRadius: size * 1.3, backgroundColor: color }, halo]}
      />
    ) : null}
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: dark ? 1 : 0.6,
          shadowRadius: dark ? 6 : 3,
          shadowOffset: { width: 0, height: 0 },
        },
        st,
      ]}
    />
    </>
  );
};

/** Đung đưa / nhún theo nhịp vô hạn. */
const useSway = (deg: number, ms: number, delay = 0) => {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: ms, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1, { duration: ms, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(v);
  }, [ms, delay, v]);
  return useAnimatedStyle(() => ({ transform: [{ rotate: `${v.value * deg}deg` }] }));
};

interface ArtProps {
  size?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/** Cây thông: 3 tầng lá, ngôi sao, đèn màu nhấp nháy, đung đưa nhẹ. */
export const XmasTree: React.FC<ArtProps> = ({ size = 56, delay = 0, style }) => {
  const sway = useSway(2.5, 1800, delay);
  const w = size;
  const h = size * 1.25;
  const lights = [
    { x: 0.42, y: 0.38 },
    { x: 0.6, y: 0.5 },
    { x: 0.36, y: 0.62 },
    { x: 0.66, y: 0.72 },
    { x: 0.5, y: 0.8 },
  ];
  return (
    <Animated.View pointerEvents="none" style={[{ width: w, height: h }, sway, style]}>
      <Svg width={w} height={h} viewBox="0 0 100 125">
        <Rect x={44} y={100} width={12} height={18} rx={2} fill="#92400E" />
        <Polygon points="50,62 92,104 8,104" fill="#15803D" />
        <Polygon points="50,38 82,78 18,78" fill="#16A34A" />
        <Polygon points="50,14 72,52 28,52" fill="#22C55E" />
        <Path d="M22 92 Q50 84 80 96" stroke="#FDE68A" strokeWidth={2} fill="none" />
        <Path d="M30 68 Q50 60 72 70" stroke="#FDE68A" strokeWidth={2} fill="none" />
        <Polygon points="50,2 54,11 63,11 56,17 59,26 50,20 41,26 44,17 37,11 46,11" fill="#FACC15" />
      </Svg>
      {lights.map((l, i) => (
        <Twinkle key={i} x={l.x * w} y={l.y * h} size={Math.max(4, size * 0.09)} color={BULB_COLORS[i % BULB_COLORS.length]} delay={delay + i * 260} />
      ))}
    </Animated.View>
  );
};

/** Người tuyết: mũ, khăn đỏ, mũi cà rốt, nhún nhảy nhẹ. */
export const Snowman: React.FC<ArtProps> = ({ size = 52, delay = 0, style }) => {
  const sway = useSway(4, 1400, delay);
  const w = size;
  const h = size * 1.35;
  return (
    <Animated.View pointerEvents="none" style={[{ width: w, height: h }, sway, style]}>
      <Svg width={w} height={h} viewBox="0 0 100 135">
        <Ellipse cx={50} cy={128} rx={36} ry={5} fill="rgba(15,42,68,0.15)" />
        <Circle cx={50} cy={98} r={30} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={2} />
        <Circle cx={50} cy={52} r={22} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={2} />
        <Circle cx={50} cy={88} r={3} fill="#334155" />
        <Circle cx={50} cy={102} r={3} fill="#334155" />
        <Path d="M30 68 Q50 78 70 68 L68 74 Q50 84 32 74 Z" fill="#DC2626" />
        <Rect x={60} y={68} width={8} height={16} rx={2} fill="#DC2626" />
        <Circle cx={43} cy={48} r={2.6} fill="#1E293B" />
        <Circle cx={57} cy={48} r={2.6} fill="#1E293B" />
        <Polygon points="50,53 66,57 50,59" fill="#F97316" />
        <Rect x={32} y={28} width={36} height={5} rx={2} fill="#1E293B" />
        <Rect x={38} y={8} width={24} height={22} rx={3} fill="#1E293B" />
        <Rect x={38} y={22} width={24} height={4} fill="#DC2626" />
        <Path d="M22 92 L4 78" stroke="#92400E" strokeWidth={3} strokeLinecap="round" />
        <Path d="M78 92 L96 76" stroke="#92400E" strokeWidth={3} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
};

/** Hộp quà: thỉnh thoảng nảy lên. */
export const GiftBox: React.FC<ArtProps & { color?: string }> = ({ size = 40, delay = 0, style, color = '#E11D48' }) => {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withDelay(2200, withTiming(-8, { duration: 200, easing: Easing.out(Easing.quad) })),
          withTiming(0, { duration: 260, easing: Easing.bounce }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(y);
  }, [delay, y]);
  const hop = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ width: size, height: size }, hop, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Rect x={10} y={40} width={80} height={56} rx={6} fill={color} />
        <Rect x={4} y={28} width={92} height={18} rx={5} fill={color} />
        <Rect x={44} y={28} width={12} height={68} fill="#FACC15" />
        <Path d="M50 28 C30 6 18 20 34 28 Z M50 28 C70 6 82 20 66 28 Z" fill="#FACC15" />
      </Svg>
    </Animated.View>
  );
};

/** Dây đèn Giáng sinh võng theo chiều ngang, bóng đèn nhấp nháy xen kẽ. */
export const Garland: React.FC<{ width: number; style?: StyleProp<ViewStyle> }> = ({ width, style }) => {
  const sag = 10;
  const spacing = 30;
  const count = Math.max(3, Math.floor(width / spacing));
  const step = width / count;
  let d = `M 0 2`;
  for (let i = 0; i < count; i++) {
    const x0 = i * step;
    d += ` Q ${x0 + step / 2} ${2 + sag * 2} ${x0 + step} 2`;
  }
  return (
    <View pointerEvents="none" style={[{ width, height: 28 }, style]}>
      <Svg width={width} height={28}>
        <Path d={d} stroke={isDarkTheme() ? '#64748B' : '#166534'} strokeWidth={1.6} fill="none" />
      </Svg>
      {Array.from({ length: count }, (_, i) => (
        <Twinkle key={i} x={i * step + step / 2} y={2 + sag + 5} size={8} color={BULB_COLORS[i % BULB_COLORS.length]} delay={(i % 3) * 330} />
      ))}
    </View>
  );
};
