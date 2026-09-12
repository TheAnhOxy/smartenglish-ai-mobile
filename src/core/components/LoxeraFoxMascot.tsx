import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { BookOpen, Sparkles } from 'lucide-react-native';

interface LoxeraFoxMascotProps {
  size?: number;
  showGlow?: boolean;
  showBook?: boolean;
  animated?: boolean;
}

export const LoxeraFoxMascot: React.FC<LoxeraFoxMascotProps> = ({
  size = 140,
  showGlow = true,
  showBook = true,
  animated = true,
}) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  // Book reading & floating magic sparkles animations
  const bookRotate = useSharedValue(0);
  const bookY = useSharedValue(0);
  const sparkle1Y = useSharedValue(0);
  const sparkle2Y = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (animated) {
      // Floating up and down
      translateY.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Subtle breathing scale
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Glow pulse
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 1300 }),
          withTiming(1, { duration: 1300 })
        ),
        -1,
        true
      );

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1300 }),
          withTiming(0.25, { duration: 1300 })
        ),
        -1,
        true
      );

      // Book subtle reading tilt & lift
      bookY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(2, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      bookRotate.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1400 }),
          withTiming(4, { duration: 1400 })
        ),
        -1,
        true
      );

      // Floating sparkles drifting upward
      sparkle1Y.value = withRepeat(
        withSequence(
          withTiming(-14, { duration: 1800, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 1800, easing: Easing.in(Easing.quad) })
        ),
        -1,
        true
      );

      sparkle2Y.value = withDelay(
        400,
        withRepeat(
          withSequence(
            withTiming(-16, { duration: 2000, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 2000, easing: Easing.in(Easing.quad) })
          ),
          -1,
          true
        )
      );

      sparkleOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const bookAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bookY.value },
      { rotate: `${bookRotate.value}deg` },
    ],
  }));

  const sparkle1AnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sparkle1Y.value }],
    opacity: sparkleOpacity.value,
  }));

  const sparkle2AnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sparkle2Y.value }],
    opacity: sparkleOpacity.value,
  }));

  const containerSize = size + 30;

  return (
    <View style={[styles.wrapper, { width: containerSize, height: containerSize }]}>
      {/* Background Glowing Aura Ring */}
      {showGlow && (
        <Animated.View
          style={[
            styles.glowRing,
            {
              width: size * 0.95,
              height: size * 0.95,
              borderRadius: (size * 0.95) / 2,
            },
            glowStyle,
          ]}
        />
      )}

      {/* Floating Magic Sparkles around Fox */}
      {showBook && (
        <>
          <Animated.View style={[styles.sparkleLeft, sparkle1AnimStyle]}>
            <Sparkles color="#FFD166" size={18} />
          </Animated.View>
          <Animated.View style={[styles.sparkleRight, sparkle2AnimStyle]}>
            <Text style={styles.sparkleText}>📖</Text>
          </Animated.View>
        </>
      )}

      {/* Animated Loxera Fox Cutout Character Image */}
      <Animated.View style={[styles.foxContainer, animatedStyle]}>
        <Image
          source={require('@/assets/images/LoxeraFront.png')}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />

        {/* Floating Book Reading Badge at the bottom of mascot */}
        {showBook && (
          <Animated.View style={[styles.bookBadge, bookAnimStyle]}>
            <View style={styles.bookIconWrap}>
              <BookOpen color="#0EA5E9" size={16} strokeWidth={2.5} />
            </View>
            <Text style={styles.bookBadgeText}>Đang Học Tiếng Anh ✨</Text>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: 'rgba(14, 165, 233, 0.25)',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
    elevation: 12,
  },
  foxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bookBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  bookIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  sparkleLeft: {
    position: 'absolute',
    top: 5,
    left: 10,
    zIndex: 10,
  },
  sparkleRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  sparkleText: {
    fontSize: 16,
  },
});
