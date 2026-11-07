import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated, Easing } from 'react-native';
import { BookOpen, Sparkles } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';

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
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  // Book reading & floating magic sparkles animations
  const bookRotate = useRef(new Animated.Value(0)).current;
  const bookY = useRef(new Animated.Value(0)).current;
  const sparkle1Y = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (animated) {
      // Floating up and down
      const animTranslate = Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, { toValue: -10, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );

      // Subtle breathing scale
      const animScale = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.05, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );

      // Glow pulse
      const animGlow = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(glowScale, { toValue: 1.25, duration: 1300, useNativeDriver: true }),
            Animated.timing(glowScale, { toValue: 1, duration: 1300, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(glowOpacity, { toValue: 0.6, duration: 1300, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.25, duration: 1300, useNativeDriver: true }),
          ]),
        ])
      );

      // Book subtle reading tilt & lift
      const animBook = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(bookY, { toValue: -4, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(bookY, { toValue: 2, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bookRotate, { toValue: -4, duration: 1400, useNativeDriver: true }),
            Animated.timing(bookRotate, { toValue: 4, duration: 1400, useNativeDriver: true }),
          ]),
        ])
      );

      // Floating sparkles drifting upward
      const animSparkle = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(sparkle1Y, { toValue: -14, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(sparkle1Y, { toValue: 0, duration: 1800, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(sparkleOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(sparkleOpacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
          ]),
        ])
      );

      animTranslate.start();
      animScale.start();
      animGlow.start();
      animBook.start();
      animSparkle.start();

      return () => {
        animTranslate.stop();
        animScale.stop();
        animGlow.stop();
        animBook.stop();
        animSparkle.stop();
      };
    }
  }, [animated]);

  const rotateStr = bookRotate.interpolate({
    inputRange: [-4, 4],
    outputRange: ['-4deg', '4deg'],
  });

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
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />
      )}

      {/* Floating Magic Sparkles around Fox */}
      {showBook && (
        <Animated.View
          style={[
            styles.sparkleLeft,
            {
              opacity: sparkleOpacity,
              transform: [{ translateY: sparkle1Y }],
            },
          ]}
        >
          <Sparkles color={colors.primary} size={15} />
        </Animated.View>
      )}

      {/* Animated Loxera Fox Cutout Character Image */}
      <Animated.View
        style={[
          styles.foxContainer,
          {
            transform: [
              { translateY },
              { scale },
            ],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/LoxeraFront.png')}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />

        {/* Floating Book Reading Badge at the bottom of mascot */}
        {showBook && (
          <Animated.View
            style={[
              styles.bookBadge,
              {
                transform: [
                  { translateY: bookY },
                  { rotate: rotateStr },
                ],
              },
            ]}
          >
            <View style={styles.bookIconWrap}>
              <BookOpen color={colors.primary} size={14} strokeWidth={2} />
            </View>
            <Text style={styles.bookBadgeText}>Đang Học Tiếng Anh</Text>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

export default LoxeraFoxMascot;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: colors.primarySoft,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
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
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  bookIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
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
