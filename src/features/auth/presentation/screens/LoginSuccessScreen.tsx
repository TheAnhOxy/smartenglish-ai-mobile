import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

// ─── Config ─────────────────────────────────────────────────────────────────
const FLOAT_WORDS = ['Vocabulary', 'Grammar', 'Speaking', 'Listening', 'Fluency', 'Practice'];
const WORD_CONFIGS = [
  { angle: -60, radius: 130, delay: 200 },
  { angle:  10, radius: 145, delay: 350 },
  { angle:  80, radius: 130, delay: 500 },
  { angle: 150, radius: 140, delay: 650 },
  { angle: 220, radius: 132, delay: 800 },
  { angle: 290, radius: 145, delay: 950 },
] as const;

// ─── Floating Word Chip ──────────────────────────────────────────────────────
interface ChipProps { word: string; angle: number; radius: number; delay: number; }

const FloatingWord: React.FC<ChipProps> = ({ word, angle, radius, delay }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const floatY  = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, {
            toValue: -10,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatY, {
            toValue: 10,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, floatY, opacity]);

  const rad = (angle * Math.PI) / 180;
  const tx  = Math.cos(rad) * radius;
  const ty  = Math.sin(rad) * radius;

  return (
    <Animated.View
      style={[
        s.wordChip,
        {
          opacity,
          transform: [
            { translateX: tx },
            { translateY: Animated.add(new Animated.Value(ty), floatY) },
          ],
        },
      ]}
    >
      <Text style={s.wordChipText}>{word}</Text>
    </Animated.View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export const LoginSuccessScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (params.role ?? 'student') as 'student' | 'teacher' | 'admin';

  // Map role → destination internally — avoids URL-encoding issues with parens
  const getDestination = (): string => {
    if (role === 'teacher') return '/(teacher-companion)/classes';
    const meta = (globalThis as any).__loginMeta;
    if (meta && !meta.onboarding_completed) return '/(auth)/welcome';
    return '/(student)/home';
  };

  // Shared animated values
  const bgOpacity    = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.25)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoRotate   = useRef(new Animated.Value(-10)).current;
  const ring1Scale   = useRef(new Animated.Value(0.5)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale   = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const textY        = useRef(new Animated.Value(24)).current;
  const barProgress  = useRef(new Animated.Value(0)).current;
  const exitOpacity  = useRef(new Animated.Value(1)).current;

  const navigateOut = () => {
    const dest = getDestination();
    router.replace(dest as any);
  };

  useEffect(() => {
    // Phase 1 – Background fade-in
    Animated.timing(bgOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Phase 2 – Logo spring-in (delay 200ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
        Animated.timing(logoRotate, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, 200);

    // Phase 3 – Pulse rings
    setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring1Scale, { toValue: 0.5, duration: 0, useNativeDriver: true }),
            Animated.timing(ring1Scale, { toValue: 2.2, duration: 2400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ring1Opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
            Animated.timing(ring1Opacity, { toValue: 0, duration: 2400, useNativeDriver: true }),
          ]),
        ])
      ).start();
    }, 700);

    setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring2Scale, { toValue: 0.5, duration: 0, useNativeDriver: true }),
            Animated.timing(ring2Scale, { toValue: 2.2, duration: 2400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ring2Opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0, duration: 2400, useNativeDriver: true }),
          ]),
        ])
      ).start();
    }, 1400);

    // Phase 4 – Text slide-up & fade-in (delay 900ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, 900);

    // Phase 5 – Progress bar fill (delay 1000ms)
    setTimeout(() => {
      Animated.timing(barProgress, {
        toValue: 1,
        duration: 3800,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: false,
      }).start();
    }, 1000);

    // Phase 6 – Fade-out & navigate after ~5s
    const timer = setTimeout(() => {
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        navigateOut();
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const rotateStr = logoRotate.interpolate({
    inputRange: [-10, 0],
    outputRange: ['-10deg', '0deg'],
  });

  const barWidth = barProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const greeting = role === 'teacher' ? 'Xin chào Giáo Viên!' : 'Xin chào Học Viên!';
  const subtitle  = role === 'teacher' ? 'Đang tải lớp học của bạn...' : 'Đang chuẩn bị lộ trình học...';

  return (
    <Animated.View style={[s.root, { opacity: exitOpacity }]}>
      {/* Background */}
      <Animated.View style={[StyleSheet.absoluteFill, s.bg, { opacity: bgOpacity }]} />

      {/* Decorative blobs */}
      <View style={s.blobTL} />
      <View style={s.blobBR} />

      {/* ── Logo cluster ── */}
      <View style={s.cluster}>
        {/* Floating English word chips */}
        {FLOAT_WORDS.map((w, i) => (
          <FloatingWord key={w} word={w} {...WORD_CONFIGS[i]} />
        ))}

        {/* Pulse rings */}
        <Animated.View
          style={[
            s.ring,
            {
              opacity: ring1Opacity,
              transform: [{ scale: ring1Scale }],
            },
          ]}
        />
        <Animated.View
          style={[
            s.ring,
            {
              opacity: ring2Opacity,
              transform: [{ scale: ring2Scale }],
            },
          ]}
        />

        {/* Logo */}
        <Animated.View
          style={[
            s.logoCard,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { rotate: rotateStr }],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/loxera-logo.png')}
            style={s.logoImg}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* ── Text + Progress ── */}
      <Animated.View
        style={[
          s.textBlock,
          {
            opacity: textOpacity,
            transform: [{ translateY: textY }],
          },
        ]}
      >
        {/* Success badge */}
        <View style={s.badge}>
          <Text style={s.badgeTick}>✓ </Text>
          <Text style={s.badgeLabel}>Đăng nhập thành công</Text>
        </View>

        <Text style={s.greeting}>{greeting}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>

        {/* Glowing progress bar */}
        <View style={s.track}>
          <Animated.View style={[s.fill, { width: barWidth }]} />
        </View>

        <Text style={s.powered}>Powered by Loxera AI · v2.0</Text>
      </Animated.View>
    </Animated.View>
  );
};

export default LoginSuccessScreen;

// ─── Styles ──────────────────────────────────────────────────────────────────
const LOGO = 100;
const RING = LOGO + 20;

const s = StyleSheet.create({
  root:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bg:          { backgroundColor: '#060E1E' },
  blobTL:      { position: 'absolute', top: -90, left: -90, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(14,165,233,0.10)' },
  blobBR:      { position: 'absolute', bottom: -70, right: -70, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(99,102,241,0.09)' },

  // Logo cluster
  cluster:     { width: RING, height: RING, alignItems: 'center', justifyContent: 'center', marginBottom: 56 },
  ring:        { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 1.5, borderColor: 'rgba(14,165,233,0.5)' },
  logoCard:    { width: LOGO, height: LOGO, borderRadius: LOGO / 2, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 18 },
  logoImg:     { width: 76, height: 76 },

  // Word chips
  wordChip:    { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  wordChipText:{ fontSize: 10, fontWeight: '600', color: 'rgba(203,213,225,0.65)', letterSpacing: 0.3 },

  // Text block
  textBlock:   { alignItems: 'center', paddingHorizontal: 36, width: '100%', maxWidth: 380 },
  badge:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', marginBottom: 18 },
  badgeTick:   { fontSize: 12, color: '#34D399', fontWeight: '800' },
  badgeLabel:  { fontSize: 12, fontWeight: '700', color: '#34D399', letterSpacing: 0.2 },
  greeting:    { fontSize: 22, fontWeight: '800', color: '#F1F5F9', marginBottom: 6, textAlign: 'center' },
  subtitle:    { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginBottom: 28, textAlign: 'center' },

  // Progress
  track:       { width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 },
  fill:        { height: '100%', borderRadius: 3, backgroundColor: '#0EA5E9', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 },
  powered:     { fontSize: 10, color: 'rgba(148,163,184,0.4)', fontWeight: '500', letterSpacing: 0.4 },
});
