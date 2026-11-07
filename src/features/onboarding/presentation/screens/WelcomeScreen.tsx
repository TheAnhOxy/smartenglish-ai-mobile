import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoxeraFoxMascot } from '@/src/core/components/LoxeraFoxMascot';
import { colors } from '@/src/theme/colors';
import { ArrowRight, PlayCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const WelcomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Logo entrance animations
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(-40)).current;

  // Content fade & slide
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;

  // Sparkle glow pulse
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  // Floating particles
  const particle1Y = useRef(new Animated.Value(0)).current;
  const particle2Y = useRef(new Animated.Value(0)).current;
  const particle3Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo bounce-in
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
      Animated.spring(logoTranslateY, { toValue: 0, friction: 7, tension: 65, useNativeDriver: true }),
      Animated.timing(contentFade, { toValue: 1, duration: 800, delay: 200, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 800, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Glow pulse loop
    const animGlow = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowScale, { toValue: 1.15, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.45, duration: 1800, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.12, duration: 1800, useNativeDriver: true }),
        ]),
      ])
    );

    // Floating particles
    const animP1 = Animated.loop(
      Animated.sequence([
        Animated.timing(particle1Y, { toValue: -16, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(particle1Y, { toValue: 16, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const animP2 = Animated.loop(
      Animated.sequence([
        Animated.timing(particle2Y, { toValue: 14, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(particle2Y, { toValue: -14, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const animP3 = Animated.loop(
      Animated.sequence([
        Animated.timing(particle3Y, { toValue: -10, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(particle3Y, { toValue: 10, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    animGlow.start();
    animP1.start();
    setTimeout(() => animP2.start(), 600);
    setTimeout(() => animP3.start(), 1200);

    return () => {
      animGlow.stop();
      animP1.stop();
      animP2.stop();
      animP3.stop();
    };
  }, []);

  const safeTop = (insets.top || 16) + 12;
  const safeBottom = Math.max(insets.bottom, 24) + 12;

  return (
    <View style={[styles.container, { paddingTop: safeTop, paddingBottom: safeBottom }]}>
      {/* Floating Decorative Particles */}
      <Animated.View style={[styles.particle, styles.particle1, { transform: [{ translateY: particle1Y }] }]} />
      <Animated.View style={[styles.particle, styles.particle2, { transform: [{ translateY: particle2Y }] }]} />
      <Animated.View style={[styles.particle, styles.particle3, { transform: [{ translateY: particle3Y }] }]} />

      {/* Top Brand Badge */}
      <Animated.View style={[styles.brandBadge, { opacity: contentFade, transform: [{ translateY: contentY }] }]}>
        <View style={styles.brandBadgeDot} />
        <Text style={styles.brandBadgeText}>SmartEnglish AI</Text>
      </Animated.View>

      {/* Logo Section */}
      <View style={styles.logoSection}>
        {/* Glow Ring Behind Logo */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Loxera Fox Logo Mascot */}
        <Animated.View
          style={[
            styles.logoCard,
            {
              transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
              opacity: logoOpacity,
            },
          ]}
        >
          <LoxeraFoxMascot size={200} showGlow showBook animated />
        </Animated.View>

        {/* App Title */}
        <Animated.Text
          style={[
            styles.appTitle,
            {
              opacity: contentFade,
              transform: [{ translateY: contentY }],
            },
          ]}
        >
          Loxera English
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: contentFade,
              transform: [{ translateY: contentY }],
            },
          ]}
        >
          Trợ lý đồng hành thông minh giúp bạn{'\n'}làm chủ tiếng Anh với lộ trình cá nhân hóa.
        </Animated.Text>

        {/* Feature Pills — text only, no emoji */}
        <Animated.View
          style={[
            styles.pillsRow,
            {
              opacity: contentFade,
              transform: [{ translateY: contentY }],
            },
          ]}
        >
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
      <Animated.View
        style={[
          styles.ctaSection,
          {
            opacity: contentFade,
            transform: [{ translateY: contentY }],
          },
        ]}
      >
        {/* Primary CTA — Register */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register' as any)}
          activeOpacity={0.85}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Tạo Tài Khoản Mới</Text>
          <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Secondary CTA — Placement Test */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/choose-goal' as any)}
          activeOpacity={0.85}
          style={styles.secondaryBtn}
        >
          <PlayCircle color={colors.primary} size={18} strokeWidth={2} />
          <Text style={styles.secondaryBtnText}>Bắt Đầu Ngay (Placement Test)</Text>
        </TouchableOpacity>

        {/* Login link */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login' as any)}
          activeOpacity={0.8}
          style={styles.outlineBtn}
        >
          <Text style={styles.outlineBtnText}>Đã Có Tài Khoản? Đăng Nhập</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F7',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  // Brand badge top
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: colors.primary,
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
    color: '#FFFFFF',
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
