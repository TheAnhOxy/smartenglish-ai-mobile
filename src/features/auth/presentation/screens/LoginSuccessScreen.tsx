import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
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
  const opacity = useSharedValue(0);
  const floatY  = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 800 }));
    floatY.value  = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-10, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming( 10, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    ));
  }, []);

  const rad = (angle * Math.PI) / 180;
  const tx  = Math.cos(rad) * radius;
  const ty  = Math.sin(rad) * radius;

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View
      style={[
        s.wordChip,
        { transform: [{ translateX: tx }, { translateY: ty }] },
        animStyle,
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

  // Shared values
  const bgOpacity    = useSharedValue(0);
  const logoScale    = useSharedValue(0.25);
  const logoOpacity  = useSharedValue(0);
  const logoRotate   = useSharedValue(-10);
  const ring1Scale   = useSharedValue(0.5);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale   = useSharedValue(0.5);
  const ring2Opacity = useSharedValue(0);
  const textOpacity  = useSharedValue(0);
  const textY        = useSharedValue(24);
  const barProgress  = useSharedValue(0);
  const exitOpacity  = useSharedValue(1);

  const navigateOut = () => {
    const dest = getDestination();
    router.replace(dest as any);
  };

  useEffect(() => {
    // Phase 1 – Background fade-in
    bgOpacity.value = withTiming(1, { duration: 350 });

    // Phase 2 – Logo spring-in
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 700 }));
    logoScale.value   = withDelay(200, withSpring(1, { damping: 10, stiffness: 80 }));
    logoRotate.value  = withDelay(200, withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) }));

    // Phase 3 – Pulse rings (staggered, slower)
    ring1Scale.value   = withDelay(700, withRepeat(withSequence(withTiming(0.5, { duration: 0 }), withTiming(2.2, { duration: 2400, easing: Easing.out(Easing.quad) })), -1, false));
    ring1Opacity.value = withDelay(700, withRepeat(withSequence(withTiming(0.6, { duration: 0 }), withTiming(0, { duration: 2400 })), -1, false));
    ring2Scale.value   = withDelay(1400, withRepeat(withSequence(withTiming(0.5, { duration: 0 }), withTiming(2.2, { duration: 2400, easing: Easing.out(Easing.quad) })), -1, false));
    ring2Opacity.value = withDelay(1400, withRepeat(withSequence(withTiming(0.6, { duration: 0 }), withTiming(0, { duration: 2400 })), -1, false));

    // Phase 4 – Text slide-up & fade-in
    textOpacity.value = withDelay(900, withTiming(1, { duration: 700 }));
    textY.value       = withDelay(900, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }));

    // Phase 5 – Progress bar fill (slower, 4s)
    barProgress.value = withDelay(1000, withTiming(1, {
      duration: 3800,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    }));

    // Phase 6 – Fade-out & navigate after ~5s
    const timer = setTimeout(() => {
      exitOpacity.value = withTiming(0, { duration: 500 }, () => {
        runOnJS(navigateOut)();
      });
    }, 5000);

    return () => clearTimeout(timer); // cleanup = no memory leak
  }, []);

  // Animated styles
  const bgStyle    = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const logoStyle  = useAnimatedStyle(() => ({
    opacity:   logoOpacity.value,
    transform: [{ scale: logoScale.value }, { rotate: `${logoRotate.value}deg` }],
  }));
  const ring1Style = useAnimatedStyle(() => ({
    opacity: ring1Opacity.value,
    transform: [{ scale: ring1Scale.value }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    opacity: ring2Opacity.value,
    transform: [{ scale: ring2Scale.value }],
  }));
  const textStyle  = useAnimatedStyle(() => ({
    opacity:   textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));
  const barStyle   = useAnimatedStyle(() => ({
    width: `${interpolate(barProgress.value, [0, 1], [0, 100])}%` as any,
  }));
  const rootStyle  = useAnimatedStyle(() => ({ opacity: exitOpacity.value }));

  const greeting = role === 'teacher' ? 'Xin chào Giáo Viên! 👋' : 'Xin chào Học Viên! 👋';
  const subtitle  = role === 'teacher' ? 'Đang tải lớp học của bạn...' : 'Đang chuẩn bị lộ trình học...';

  return (
    <Animated.View style={[s.root, rootStyle]}>
      {/* Background */}
      <Animated.View style={[StyleSheet.absoluteFill, s.bg, bgStyle]} />

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
        <Animated.View style={[s.ring, ring1Style]} />
        <Animated.View style={[s.ring, ring2Style]} />

        {/* Logo */}
        <Animated.View style={[s.logoCard, logoStyle]}>
          <Image
            source={require('@/assets/images/loxera-logo.png')}
            style={s.logoImg}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* ── Text + Progress ── */}
      <Animated.View style={[s.textBlock, textStyle]}>
        {/* Success badge */}
        <View style={s.badge}>
          <Text style={s.badgeTick}>✓ </Text>
          <Text style={s.badgeLabel}>Đăng nhập thành công</Text>
        </View>

        <Text style={s.greeting}>{greeting}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>

        {/* Glowing progress bar */}
        <View style={s.track}>
          <Animated.View style={[s.fill, barStyle]} />
        </View>

        <Text style={s.powered}>Powered by Loxera AI · v2.0</Text>
      </Animated.View>
    </Animated.View>
  );
};

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
