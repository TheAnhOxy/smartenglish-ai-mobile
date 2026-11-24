// components/neon/Neon.tsx — Hiệu ứng neon cho CHẾ ĐỘ TỐI: viền phát sáng, chữ phát sáng, quầng sáng.
// Ở chế độ sáng mọi component trả về null / style gốc → giao diện sáng giữ nguyên như ban đầu.
import React, { useEffect } from 'react';
import { StyleSheet, Text, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
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
import { isDarkTheme } from '@/src/theme/themeMode';

/** Bảng màu neon (chỉ dùng ở chế độ tối). */
export const NEON = {
  cyan: '#22D3EE',
  blue: '#60A5FA',
  violet: '#A78BFA',
  pink: '#F472B6',
  lime: '#A3E635',
  green: '#34D399',
  amber: '#FBBF24',
  orange: '#FB923C',
} as const;

/** Có đang bật hiệu ứng neon không (= chế độ tối). Theme đổi thì cây giao diện được vẽ lại nên đọc trực tiếp là đủ. */
export const useNeon = () => isDarkTheme();

/** Style chữ phát sáng tĩnh (dùng trong style={[...]}); chế độ sáng trả undefined. */
export const neonTextStyle = (color: string, radius = 10): TextStyle | undefined =>
  isDarkTheme() ? { textShadowColor: color, textShadowRadius: radius, textShadowOffset: { width: 0, height: 0 } } : undefined;

interface NeonBorderProps {
  color: string;
  /** Bo góc của thẻ chứa nó. */
  radius: number;
  /** Độ dày viền sáng. */
  width?: number;
  /** Nhịp sáng (ms); 0 = đứng yên. */
  pulseMs?: number;
  /** Lệch pha để nhiều thẻ không nhấp nháy cùng lúc. */
  delay?: number;
}

/**
 * Viền neon phát sáng phủ lên thẻ (đặt làm phần tử con CUỐI của thẻ, thẻ không cần đổi layout).
 * Hai lớp: viền sắc + viền mờ dày phía trong, cùng "thở" theo nhịp như bóng đèn neon.
 */
export const NeonBorder: React.FC<NeonBorderProps> = ({ color, radius, width = 1.5, pulseMs = 2600, delay = 0 }) => {
  const on = useNeon();
  const glow = useSharedValue(0.6);

  useEffect(() => {
    if (!on || pulseMs <= 0) return;
    glow.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: pulseMs / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.45, { duration: pulseMs / 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(glow);
  }, [on, pulseMs, delay, glow]);

  const sharp = useAnimatedStyle(() => ({ opacity: 0.55 + glow.value * 0.45 }));
  const soft = useAnimatedStyle(() => ({ opacity: glow.value * 0.45 }));

  if (!on) return null;
  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: width + 4, borderColor: color }, soft]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radius, borderWidth: width, borderColor: color, shadowColor: color, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
          sharp,
        ]}
      />
    </>
  );
};

interface NeonTextProps extends TextProps {
  color: string;
  /** Thỉnh thoảng chập chờn như bóng neon thật. */
  flicker?: boolean;
  style?: StyleProp<TextStyle>;
}

/** Chữ/nhãn neon: phát sáng + chập chờn nhẹ ở chế độ tối; chế độ sáng là Text bình thường. */
export const NeonText: React.FC<NeonTextProps> = ({ color, flicker = true, style, children, ...rest }) => {
  const on = useNeon();
  const o = useSharedValue(1);

  useEffect(() => {
    if (!on || !flicker) return;
    // Sáng đều ~4s rồi chập chờn 2 nhịp ngắn
    o.value = withRepeat(
      withSequence(
        withDelay(4200, withTiming(0.35, { duration: 70 })),
        withTiming(1, { duration: 60 }),
        withTiming(0.55, { duration: 60 }),
        withTiming(1, { duration: 120 }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(o);
  }, [on, flicker, o]);

  const anim = useAnimatedStyle(() => ({ opacity: o.value }));

  if (!on) {
    return (
      <Text style={style} {...rest}>
        {children}
      </Text>
    );
  }
  return (
    <Animated.Text
      style={[style, { color, textShadowColor: color, textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 } }, anim]}
      {...rest}
    >
      {children}
    </Animated.Text>
  );
};

interface NeonHaloProps {
  color: string;
  size: number;
  style?: StyleProp<ViewStyle>;
  /** Mạnh hơn cho phần tử đang được chọn (vd. bài học hiện tại). */
  strong?: boolean;
}

/** Quầng sáng tròn toả ra phía sau một nút (đặt absolute, căn giữa bằng style). */
export const NeonHalo: React.FC<NeonHaloProps> = ({ color, size, style, strong = false }) => {
  const on = useNeon();
  const p = useSharedValue(0);

  useEffect(() => {
    if (!on) return;
    p.value = withRepeat(withTiming(1, { duration: strong ? 1600 : 2800, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(p);
  }, [on, strong, p]);

  const ring = useAnimatedStyle(() => ({
    opacity: (strong ? 0.75 : 0.4) * (1 - p.value),
    transform: [{ scale: 1 + p.value * (strong ? 0.55 : 0.3) }],
  }));

  if (!on) return null;
  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}22` }, style]}
      />
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color }, style, ring]}
      />
    </>
  );
};
