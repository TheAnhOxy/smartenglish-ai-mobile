import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';
import { timing, easings } from '@/src/theme/motion';

interface DatabaseLoaderProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  /** Nếu true, hiển thị full-screen centered overlay */
  fullscreen?: boolean;
}

// ─── Animated pulse ring — một vòng sóng xung kích ───
const PulseRing: React.FC<{
  delay: number;
  size: number;
  color: string;
}> = ({ delay, size, color }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);

  useEffect(() => {
    const run = () => {
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.6, { duration: timing.fast, easing: easings.out }),
            withTiming(0, { duration: timing.slow, easing: easings.in })
          ),
          -1,
          false
        )
      );
      scale.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: timing.slow + timing.fast, easing: easings.out }),
          -1,
          false
        )
      );
    };
    run();
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
        },
        ringStyle,
      ]}
    />
  );
};

// ─── Animated rotating orbit dots ───
const OrbitDot: React.FC<{
  angle: number;
  radius: number;
  color: string;
  duration: number;
  delay: number;
}> = ({ angle, radius, color, duration, delay }) => {
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration, easing: easings.inOut }),
        -1,
        false
      )
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => {
    const rad = ((rotate.value + angle) * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    return {
      transform: [{ translateX: x }, { translateY: y }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
        },
        dotStyle,
      ]}
    />
  );
};

// ─── Database cylinder SVG-like icon with glow ───
const DatabaseIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const glowOpacity = useSharedValue(0.4);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: timing.slow, easing: easings.inOut }),
        withTiming(0.4, { duration: timing.slow, easing: easings.inOut })
      ),
      -1,
      true
    );
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: timing.slow + 100, easing: easings.inOut }),
        withTiming(1, { duration: timing.slow + 100, easing: easings.inOut })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const innerSize = size * 0.55;

  return (
    <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, iconStyle]}>
      {/* Glow background */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: (size * 0.7) / 2,
            backgroundColor: color,
          },
          glowStyle,
        ]}
      />
      {/* Icon background circle */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${color}20`,
          borderWidth: 2,
          borderColor: `${color}60`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Database cylinder shape */}
        <View style={{ alignItems: 'center', gap: 3 }}>
          {/* Top ellipse */}
          <View
            style={{
              width: innerSize,
              height: innerSize * 0.35,
              borderRadius: innerSize * 0.2,
              backgroundColor: color,
              borderTopLeftRadius: innerSize * 0.5,
              borderTopRightRadius: innerSize * 0.5,
              borderBottomLeftRadius: innerSize * 0.5,
              borderBottomRightRadius: innerSize * 0.5,
            }}
          />
          {/* Middle stripe */}
          <View
            style={{
              width: innerSize,
              height: 3,
              backgroundColor: `${color}80`,
              borderRadius: 2,
            }}
          />
          {/* Bottom base */}
          <View
            style={{
              width: innerSize,
              height: innerSize * 0.25,
              borderRadius: innerSize * 0.15,
              backgroundColor: `${color}CC`,
            }}
          />
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Animated dots text indicator ───
const LoadingDots: React.FC<{ color: string }> = ({ color }) => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const anim = (val: SharedValue<number>, delay: number) => {
      val.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: timing.base }),
            withTiming(0.3, { duration: timing.base })
          ),
          -1,
          false
        )
      );
    };
    anim(dot1, 0);
    anim(dot2, 150);
    anim(dot3, 300);
  }, []);

  const d1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const d2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const d3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  const dotStyle = { width: 5, height: 5, borderRadius: 2.5, backgroundColor: color };

  return (
    <View style={{ flexDirection: 'row', gap: 5, marginTop: 8 }}>
      <Animated.View style={[dotStyle, d1Style]} />
      <Animated.View style={[dotStyle, d2Style]} />
      <Animated.View style={[dotStyle, d3Style]} />
    </View>
  );
};

// ─── Main DatabaseLoader Component ───
export const DatabaseLoader: React.FC<DatabaseLoaderProps> = ({
  message = 'Đang tải dữ liệu...',
  subMessage,
  size = 'md',
  color = colors.primary,
  fullscreen = false,
}) => {
  const iconSizeMap = { sm: 56, md: 72, lg: 96 };
  const ringBaseSizeMap = { sm: 90, md: 110, lg: 144 };
  const iconSize = iconSizeMap[size];
  const ringBase = ringBaseSizeMap[size];

  const container = (
    <View style={s.wrapper}>
      {/* Orbit rings */}
      <View style={{ width: ringBase * 1.6, height: ringBase * 1.6, alignItems: 'center', justifyContent: 'center' }}>
        <PulseRing delay={0} size={ringBase} color={color} />
        <PulseRing delay={400} size={ringBase * 1.25} color={color} />
        <PulseRing delay={800} size={ringBase * 1.5} color={color} />

        {/* Orbit dots */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <OrbitDot angle={0} radius={ringBase * 0.52} color={`${color}CC`} duration={2400} delay={0} />
          <OrbitDot angle={120} radius={ringBase * 0.52} color={`${color}99`} duration={2400} delay={0} />
          <OrbitDot angle={240} radius={ringBase * 0.52} color={`${color}66`} duration={2400} delay={0} />
        </View>

        {/* Center icon */}
        <DatabaseIcon size={iconSize} color={color} />
      </View>

      {/* Text */}
      <View style={s.textBlock}>
        {message ? <Text style={[s.message, { color: colors.text }]}>{message}</Text> : null}
        {subMessage ? <Text style={[s.subMessage, { color: colors.textSoft }]}>{subMessage}</Text> : null}
        <LoadingDots color={color} />
      </View>
    </View>
  );

  if (fullscreen) {
    return <View style={s.fullscreen}>{container}</View>;
  }
  return container;
};

const s = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 16,
  },
  message: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subMessage: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
});
