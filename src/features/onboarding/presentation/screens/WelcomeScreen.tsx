import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoxeraFoxMascot } from '@/src/core/components/LoxeraFoxMascot';
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
import { colors } from '@/src/theme/colors';
import { ArrowRight, PlayCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const WelcomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
        withTiming(1.15, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 1800 }),
        withTiming(0.12, { duration: 1800 })
      ),
      -1,
      true
    );

    // Floating particles
    particle1Y.value = withRepeat(
      withSequence(
        withTiming(-16, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(16, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    particle2Y.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(14, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
          withTiming(-14, { duration: 2600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    particle3Y.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.ease) })
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

  const safeTop = Math.max(insets.top, 48) + 12;
  const safeBottom = Math.max(insets.bottom, 24) + 12;

  return (
    <View style={[styles.container, { paddingTop: safeTop, paddingBottom: safeBottom }]}>
      {/* Floating Decorative Particles */}
      <Animated.View style={[styles.particle, styles.particle1, particle1Style]} />
      <Animated.View style={[styles.particle, styles.particle2, particle2Style]} />
      <Animated.View style={[styles.particle, styles.particle3, particle3Style]} />

      {/* Top Brand Badge */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.brandBadge}>
        <View style={styles.brandBadgeDot} />
        <Text style={styles.brandBadgeText}>SmartEnglish AI</Text>
      </Animated.View>

      {/* Logo Section */}
      <View style={styles.logoSection}>
        {/* Glow Ring Behind Logo */}
        <Animated.View style={[styles.glowRing, glowAnimStyle]} />

        {/* Loxera Fox Logo Mascot */}
        <Animated.View style={[styles.logoCard, logoAnimStyle]}>
          <LoxeraFoxMascot size={200} showGlow showBook animated />
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

        {/* Feature Pills — text only, no emoji */}
        <Animated.View entering={FadeInDown.delay(550).duration(500)} style={styles.pillsRow}>
          <View style={styles.featurePill}>
            <Text style={styles.featurePillText}>Cá nhân hóa</Text>
          </View>
          <View style={styles.featurePill}>
            <Text style={styles.featurePillText}>AI Tutor</Text>
          </View>
          <View style={styles.featurePill}>
            <Text style={styles.featurePillText}>Placement Test</Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom CTA Buttons */}
      <View style={styles.ctaSection}>
        {/* Primary CTA — Register */}
        <Animated.View entering={FadeInDown.delay(650).duration(500)}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register' as any)}
            activeOpacity={0.85}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Tạo Tài Khoản Mới</Text>
            <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>

        {/* Secondary CTA — Placement Test */}
        <Animated.View entering={FadeInDown.delay(780).duration(500)}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/choose-goal' as any)}
            activeOpacity={0.85}
            style={styles.secondaryBtn}
          >
            <PlayCircle color={colors.primary} size={18} strokeWidth={2} />
            <Text style={styles.secondaryBtnText}>Bắt Đầu Ngay (Placement Test)</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Login link */}
        <Animated.View entering={FadeInDown.delay(900).duration(500)}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login' as any)}
            activeOpacity={0.8}
            style={styles.outlineBtn}
          >
            <Text style={styles.outlineBtnText}>Đã Có Tài Khoản? Đăng Nhập</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F7',  // rõ ràng hơn #F8FAFC, dễ phân biệt với trắng thuần
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  // Brand badge top
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: colors.primary,  // nền navy đậm — chữ trắng contrast tốt
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  brandBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',  // chữ trắng trên nền navy — dễ đọc
    letterSpacing: 0.3,
  },
  // Logo section
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: 8,
  },
  glowRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.primarySoft,
    top: 10,
  },
  logoCard: {
    width: 230,
    height: 230,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 16,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featurePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  featurePillText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  // CTA section
  ctaSection: {
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primaryDeep,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    backgroundColor: colors.secondarySoft,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  outlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingVertical: 13,
    borderRadius: 18,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  // Decorative particles
  particle: {
    position: 'absolute',
    borderRadius: 50,
    zIndex: 0,
  },
  particle1: {
    width: 10,
    height: 10,
    backgroundColor: colors.secondary,
    top: 140,
    left: 32,
    opacity: 0.5,
  },
  particle2: {
    width: 7,
    height: 7,
    backgroundColor: colors.primary,
    top: 220,
    right: 44,
    opacity: 0.3,
  },
  particle3: {
    width: 14,
    height: 14,
    backgroundColor: colors.primarySoft,
    top: 380,
    left: width * 0.72,
    opacity: 0.6,
  },
});
