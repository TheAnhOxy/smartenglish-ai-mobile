// components/xmas/Snowfall.tsx — Tuyết rơi phủ lên màn hình (không chặn chạm), chạy trên UI thread.
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { usePathname, useSegments } from 'expo-router';
import { isQuietRoute } from '@/src/core/services/backgroundMusic';
import { useXmasActive } from '@/src/core/services/xmas';
import { isDarkTheme } from '@/src/theme/themeMode';

interface FlakeSpec {
  x: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
}

const Flake: React.FC<FlakeSpec & { height: number; color: string }> = ({ x, size, duration, delay, drift, opacity, height, color }) => {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(p);
  }, [delay, duration, p]);
  const st = useAnimatedStyle(() => {
    const t = p.value;
    const fade = t < 0.08 ? t / 0.08 : t > 0.9 ? (1 - t) / 0.1 : 1;
    return {
      opacity: opacity * fade,
      transform: [{ translateY: -12 + t * (height + 24) }, { translateX: Math.sin(t * Math.PI * 3) * drift }],
    };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', top: 0, left: x, width: size, height: size, borderRadius: size / 2, backgroundColor: color }, st]}
    />
  );
};

/**
 * Tuyết rơi nhẹ toàn app khi bật trang trí Giáng sinh; tắt ở màn học/luyện tập để không rối mắt.
 * Đặt một lần ở layout gốc.
 */
export const Snowfall: React.FC<{ count?: number }> = ({ count = 22 }) => {
  const enabled = useXmasActive();
  const pathname = usePathname();
  // Màn đăng nhập/đăng ký giữ nguyên thiết kế gốc: không có tuyết
  const inAuth = (useSegments()[0] as string) === '(auth)';
  const { width, height } = useWindowDimensions();

  const flakes = useMemo<FlakeSpec[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = (n: number) => {
          const v = Math.sin((i + 1) * 9301 + n * 49297) * 233280;
          return v - Math.floor(v);
        };
        return {
          x: r(1) * width,
          size: 3 + r(2) * 4,
          duration: 7000 + r(3) * 6000,
          delay: r(4) * 7000,
          drift: 8 + r(5) * 18,
          opacity: 0.55 + r(6) * 0.4,
        };
      }),
    [count, width],
  );

  if (!enabled || inAuth || isQuietRoute(pathname)) return null;
  // Sáng: bông tuyết xanh nhạt để thấy trên nền trắng; tối: trắng
  const color = isDarkTheme() ? '#FFFFFF' : '#BAE6FD';
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {flakes.map((f, i) => (
        <Flake key={i} {...f} height={height} color={color} />
      ))}
    </View>
  );
};
