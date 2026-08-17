import React, { useEffect } from 'react';
import { View, Text, Pressable, Image, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withDelay,
  withSequence,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export const WelcomeScreen = () => {
  const router = useRouter();

  // Logo entrance animations
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(-40);

  // Sparkle glow pulse
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  // Floating particles
  const particle1Y = useSharedValue(0);
  const particle2Y = useSharedValue(0);
  const particle3Y = useSharedValue(0);

  useEffect(() => {
    // Logo bounce-in
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    logoTranslateY.value = withSpring(0, { damping: 14, stiffness: 90 });

    // Glow pulse loop
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500 }),
        withTiming(0.15, { duration: 1500 })
      ),
      -1,
      true
    );

    // Floating particles
    particle1Y.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(15, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    particle2Y.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(12, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(-12, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    particle3Y.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(10, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }, { translateY: logoTranslateY.value }],
    opacity: logoOpacity.value,
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const particle1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: particle1Y.value }],
  }));
  const particle2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: particle2Y.value }],
  }));
  const particle3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: particle3Y.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Floating Decorative Particles */}
      <Animated.View style={[styles.particle, styles.particle1, particle1Style]} />
      <Animated.View style={[styles.particle, styles.particle2, particle2Style]} />
      <Animated.View style={[styles.particle, styles.particle3, particle3Style]} />

      {/* Logo Section */}
      <View style={styles.logoSection}>
        {/* Glow Ring Behind Logo */}
        <Animated.View style={[styles.glowRing, glowAnimStyle]} />

        {/* Loxera Logo inside Premium Rounded Card Badge */}
        <Animated.View style={[styles.logoCard, logoAnimStyle]}>
          <Image
            source={require('@/assets/images/loxera-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App Title */}
        <Animated.Text
          entering={FadeInDown.delay(300).duration(600)}
          style={styles.appTitle}
        >
          Loxera English
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          entering={FadeInDown.delay(450).duration(600)}
          style={styles.tagline}
        >
          Trợ lý đồng hành thông minh giúp bạn{'\n'}làm chủ tiếng Anh với lộ trình cá nhân hóa.
        </Animated.Text>
      </View>

      {/* Bottom CTA Buttons */}
      <View style={styles.ctaSection}>
        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <Pressable
            onPress={() => router.push('/(auth)/register' as any)}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Tạo Tài Khoản Mới ➔</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(750).duration(500)}>
          <Pressable
            onPress={() => router.push('/(auth)/choose-goal' as any)}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>Bắt Đầu Ngay (Placement Test)</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(900).duration(500)}>
          <Pressable
            onPress={() => router.push('/(auth)/login' as any)}
            style={styles.outlineBtn}
          >
            <Text style={styles.outlineBtnText}>Đã Có Tài Khoản? Đăng Nhập</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 48,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  glowRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#93C5FD',
    top: -10,
  },
  logoCard: {
    width: 180,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E3A5F',
    marginTop: 20,
    letterSpacing: 0.3,
  },
  tagline: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  ctaSection: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  outlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: '#1E3A5F',
    fontWeight: '700',
    fontSize: 14,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    zIndex: 0,
  },
  particle1: {
    width: 12,
    height: 12,
    backgroundColor: '#93C5FD',
    top: 100,
    left: 40,
    opacity: 0.6,
  },
  particle2: {
    width: 8,
    height: 8,
    backgroundColor: '#60A5FA',
    top: 180,
    right: 50,
    opacity: 0.5,
  },
  particle3: {
    width: 16,
    height: 16,
    backgroundColor: '#BFDBFE',
    top: 320,
    left: width * 0.75,
    opacity: 0.4,
  },
});
