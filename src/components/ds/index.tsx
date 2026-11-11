// Thành phần giao diện dùng chung cho bộ thiết kế mới.
// Dùng Animated (native driver) như các hook có sẵn trong src/hooks để chạy ổn định trên Expo Go.
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ds, dsFont, dsRadius, dsSize } from '@/src/theme/ds';
import { feedback } from './feedback';

export { feedback, haptic, playSound, setUiSoundEnabled } from './feedback';

// ───── Tap: Pressable co nhẹ khi nhấn ─────
type TapProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  sound?: 'tap' | 'select' | 'none';
  children?: React.ReactNode;
};

export const Tap: React.FC<TapProps> = ({ style, scaleTo = 0.96, sound = 'tap', onPressIn, onPressOut, onPress, children, disabled, ...rest }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: v === 1 ? 8 : 0 }).start();
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        to(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (sound === 'tap') feedback.tap();
        else if (sound === 'select') feedback.select();
        onPress?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }, disabled ? { opacity: 0.5 } : null]}>{children}</Animated.View>
    </Pressable>
  );
};

// ───── Button3D: nút có gờ đáy, lún xuống khi nhấn ─────
type ButtonVariant = 'primary' | 'success' | 'danger' | 'amber' | 'light' | 'ghost';

const VARIANTS: Record<ButtonVariant, { bg: string; edge: string; fg: string; border?: string }> = {
  primary: { bg: ds.btn, edge: ds.btnEdge, fg: ds.white },
  success: { bg: ds.green, edge: ds.greenEdge, fg: ds.white },
  danger: { bg: ds.red, edge: ds.redEdge, fg: ds.white },
  amber: { bg: ds.amber, edge: ds.amberDeep, fg: ds.ink },
  light: { bg: ds.white, edge: ds.lineStrong, fg: ds.ink, border: ds.line },
  ghost: { bg: 'transparent', edge: 'transparent', fg: ds.btn },
};

interface Button3DProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  height?: number;
  sound?: boolean;
  accessibilityLabel?: string;
}

const EDGE = 4;

export const Button3D: React.FC<Button3DProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  height = 54,
  sound = true,
  accessibilityLabel,
}) => {
  const v = VARIANTS[disabled ? 'light' : variant];
  const press = useRef(new Animated.Value(0)).current;
  const set = (to: number) =>
    Animated.timing(press, { toValue: to, duration: 70, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, EDGE - 1] });
  const edge = variant === 'ghost' ? 0 : EDGE;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled || loading}
      onPressIn={() => set(1)}
      onPressOut={() => set(0)}
      onPress={() => {
        if (sound) feedback.tap();
        onPress?.();
      }}
      style={[{ height: height + edge }, style]}
    >
      {edge > 0 ? <View style={[b.edge, { top: edge, height, backgroundColor: v.edge }]} /> : null}
      <Animated.View
        style={[
          b.face,
          { height, backgroundColor: v.bg, transform: [{ translateY }] },
          v.border ? { borderWidth: 1.5, borderColor: v.border } : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.fg} />
        ) : (
          <>
            {icon}
            <Text style={[b.label, { color: disabled ? ds.faint : v.fg }]} numberOfLines={1}>
              {label}
            </Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
};

const b = StyleSheet.create({
  edge: { position: 'absolute', left: 0, right: 0, borderRadius: dsRadius.md },
  face: {
    borderRadius: dsRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  label: { fontFamily: dsFont.bold, fontSize: dsSize.base, letterSpacing: 0.2 },
});

// ───── Reveal: trồi lên + hiện dần, có độ trễ để tạo nhịp lần lượt ─────
interface RevealProps {
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const Reveal: React.FC<RevealProps> = ({ delay = 0, distance = 14, style, children }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, delay, useNativeDriver: true, speed: 14, bounciness: 5 }).start();
  }, [v, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ───── ProgressBar: thanh tiến độ chạy mượt ─────
interface ProgressBarProps {
  value: number; // 0..1
  color?: string;
  track?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, color = ds.sky, track = ds.line, height = 12, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  useEffect(() => {
    Animated.spring(anim, { toValue: clamped, useNativeDriver: false, speed: 10, bounciness: 4 }).start();
  }, [anim, clamped]);
  return (
    <View style={[{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          height,
          borderRadius: height,
          backgroundColor: color,
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      >
        <View style={[pb.shine, { height: Math.max(2, height * 0.28), borderRadius: height }]} />
      </Animated.View>
    </View>
  );
};

const pb = StyleSheet.create({
  shine: { position: 'absolute', top: 2, left: 6, right: 6, backgroundColor: 'rgba(255,255,255,0.35)' },
});

// ───── Pulse: vòng sáng lan tỏa (nút đang học, mic) ─────
interface PulseProps {
  size: number;
  color: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const PulseRing: React.FC<PulseProps> = ({ size, color, active = true, style }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      v.stopAnimation();
      v.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [v, active]);
  if (!active) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: color,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }],
        },
        style,
      ]}
    />
  );
};

// ───── Kiểu chữ ─────
export const dsText = StyleSheet.create({
  display: { fontFamily: dsFont.displayHeavy, fontSize: dsSize.xxl, color: ds.ink, letterSpacing: -0.5 },
  h1: { fontFamily: dsFont.display, fontSize: dsSize.xl, color: ds.ink, letterSpacing: -0.3 },
  h2: { fontFamily: dsFont.display, fontSize: dsSize.lg, color: ds.ink, letterSpacing: -0.2 },
  h3: { fontFamily: dsFont.display, fontSize: dsSize.md, color: ds.ink },
  body: { fontFamily: dsFont.body, fontSize: dsSize.base, color: ds.ink },
  bodyMuted: { fontFamily: dsFont.body, fontSize: dsSize.sm, color: ds.muted },
  label: { fontFamily: dsFont.semibold, fontSize: dsSize.sm, color: ds.ink },
  caption: { fontFamily: dsFont.medium, fontSize: dsSize.xs, color: ds.muted },
  overline: { fontFamily: dsFont.bold, fontSize: dsSize.xs, color: ds.muted, letterSpacing: 1, textTransform: 'uppercase' },
});
