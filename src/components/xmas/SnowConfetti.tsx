// components/xmas/SnowConfetti.tsx — Pháo giấy bông tuyết + sao vàng cho khoảnh khắc ăn mừng THẬT
// (nhận thưởng nhiệm vụ, hoàn thành phiên học). Chạy một lần khi `trigger` đổi, không lặp, không chặn chạm.
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Path, Polygon } from 'react-native-svg';

const Flake: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path d="M10 1 V19 M1 10 H19 M3.5 3.5 L16.5 16.5 M16.5 3.5 L3.5 16.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const StarShape: React.FC<{ size: number }> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Polygon points="10,1 12.5,7.5 19,7.5 14,11.5 16,18 10,14 4,18 6,11.5 1,7.5 7.5,7.5" fill="#FBBF24" />
  </Svg>
);

const Piece: React.FC<{ x: number; drift: number; delay: number; size: number; star: boolean; color: string; fall: number; spin: number }> = ({
  x,
  drift,
  delay,
  size,
  star,
  color,
  fall,
  spin,
}) => {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }));
  }, [delay, p]);
  const st = useAnimatedStyle(() => ({
    opacity: p.value < 0.85 ? 1 : (1 - p.value) / 0.15,
    transform: [
      // Bắn lên rồi rơi xuống
      { translateY: -fall * 0.35 * Math.sin(p.value * Math.PI) + p.value * fall * 0.6 },
      { translateX: p.value * drift },
      { rotate: `${p.value * spin}deg` },
    ],
  }));
  return <Animated.View style={[{ position: 'absolute', left: x, top: '45%' }, st]}>{star ? <StarShape size={size} /> : <Flake color={color} size={size} />}</Animated.View>;
};

/**
 * Đổi `trigger` (vd. số lần ăn mừng) để bắn một đợt. `trigger` = 0 thì không hiển thị gì.
 * Tự ẩn sau ~2.2 giây.
 */
export const SnowConfetti: React.FC<{ trigger: number }> = ({ trigger }) => {
  const { width, height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2300);
    return () => clearTimeout(t);
  }, [trigger]);

  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const r = (n: number) => {
          const v = Math.sin((i + 1) * 12.9898 + n * 78.233 + trigger) * 43758.5453;
          return v - Math.floor(v);
        };
        return {
          x: width * 0.15 + r(1) * width * 0.7,
          drift: (r(2) - 0.5) * 160,
          delay: r(3) * 250,
          size: 10 + r(4) * 10,
          star: i % 4 === 0,
          color: i % 3 === 0 ? '#BAE6FD' : '#F8FAFC',
          fall: height * (0.35 + r(5) * 0.3),
          spin: (r(6) - 0.5) * 540,
        };
      }),
    [trigger, width, height],
  );

  if (!visible) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
      {pieces.map((p, i) => (
        <Piece key={`${trigger}-${i}`} {...p} />
      ))}
    </View>
  );
};
