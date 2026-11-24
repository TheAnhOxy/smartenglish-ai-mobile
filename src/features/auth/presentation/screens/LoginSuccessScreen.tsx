import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, Sparkle } from 'lucide-react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedFoxMascot } from '@/src/core/components/AnimatedFoxMascot';
import { useAuthStore } from '@/src/core/flows/authStore';
import { fetchPlacementStatusApi } from '@/src/features/onboarding/data/onboardingApi';
import { ds, dsFont, dsSize } from '@/src/theme/ds';

/** Tổng thời gian màn chào trước khi chuyển trang (ms). */
const DURATION = 3400;
const EXIT = 380;

const STEPS = ['Đang tải hồ sơ của bạn', 'Đang xếp bài học theo trình độ', 'Sẵn sàng rồi!'] as const;

/** Ngôi sao nhỏ lấp lánh quanh linh vật. */
const Twinkle: React.FC<{ top: number; left: number; size: number; delay: number }> = ({ top, left, size, delay }) => {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [delay, v]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.25 + v.value * 0.75,
    transform: [{ scale: 0.6 + v.value * 0.5 }, { rotate: `${v.value * 45}deg` }],
  }));
  return (
    <Animated.View style={[s.twinkle, { top, left }, style]}>
      <Sparkle size={size} color={ds.skyLight} fill={ds.skyLight} />
    </Animated.View>
  );
};

export const LoginSuccessScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (params.role ?? 'student') as 'student' | 'teacher' | 'admin';
  const displayName = useAuthStore((st) => st.currentUser?.display_name);
  const firstName = (displayName || '').trim().split(/\s+/).pop() || '';

  // Giáo viên dùng app mobile như học viên (quản lý lớp làm trên Web Portal)
  // Học viên chưa làm bài kiểm tra đầu vào → làm test trước để xếp lộ trình đúng trình độ
  // (hỏi server trong lúc màn chào đang chạy; lỗi mạng thì vào trang chủ như cũ)
  const placementDone = useRef<boolean | null>(null);
  useEffect(() => {
    if (role !== 'student') return;
    fetchPlacementStatusApi()
      .then((st) => {
        placementDone.current = st.completed;
      })
      .catch(() => {
        placementDone.current = null;
      });
  }, [role]);

  const getDestination = (): string => {
    if (role === 'teacher') return '/(student)/home';
    const meta = (globalThis as { __loginMeta?: { onboarding_completed?: boolean } }).__loginMeta;
    if (meta && !meta.onboarding_completed) return '/(auth)/welcome';
    if (role === 'student' && placementDone.current === false) return '/(student)/placement';
    return '/(student)/home';
  };

  const [step, setStep] = useState(0);
  const navigated = useRef(false);

  const screen = useSharedValue(0);
  const bubble = useSharedValue(0);
  const text = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    screen.value = withTiming(1, { duration: 320 });
    bubble.value = withDelay(650, withSpring(1, { damping: 9, stiffness: 160 }));
    text.value = withDelay(450, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    progress.value = withDelay(500, withTiming(1, { duration: DURATION - 700, easing: Easing.bezier(0.3, 0.6, 0.4, 1) }));

    const stepTimers = [
      setTimeout(() => setStep(1), 1300),
      setTimeout(() => setStep(2), DURATION - 700),
    ];
    const exitTimer = setTimeout(() => {
      screen.value = withTiming(0, { duration: EXIT });
    }, DURATION);
    const navTimer = setTimeout(() => {
      if (navigated.current) return;
      navigated.current = true;
      router.replace(getDestination() as never);
    }, DURATION + EXIT);

    return () => {
      stepTimers.forEach(clearTimeout);
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
    // Chạy một lần khi vào màn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const screenStyle = useAnimatedStyle(() => ({ opacity: screen.value }));
  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubble.value,
    transform: [{ scale: 0.4 + bubble.value * 0.6 }, { translateY: (1 - bubble.value) * 12 }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: text.value,
    transform: [{ translateY: (1 - text.value) * 18 }],
  }));
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const greeting = firstName ? `Chào ${firstName}!` : 'Chào bạn!';
  const title = role === 'teacher' ? 'Chào mừng thầy cô trở lại' : 'Chào mừng bạn trở lại';

  return (
    <Animated.View style={[s.root, screenStyle]}>
      <LinearGradient colors={[ds.hero, ds.heroSoft, ds.btnEdge]} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[s.halo, s.haloTop]} />
      <View style={[s.halo, s.haloBottom]} />

      <View style={[s.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}>
        <View style={s.stage}>
          <View style={s.spotlight} />
          <Twinkle top={18} left={40} size={16} delay={0} />
          <Twinkle top={70} left={262} size={12} delay={300} />
          <Twinkle top={190} left={18} size={10} delay={600} />
          <Twinkle top={210} left={250} size={14} delay={900} />

          <Animated.View style={[s.bubble, bubbleStyle]}>
            <Text style={s.bubbleText} numberOfLines={1}>
              {greeting}
            </Text>
            <View style={s.bubbleTail} />
          </Animated.View>

          <AnimatedFoxMascot size={230} style={s.fox} />
        </View>

        <Animated.View style={[s.textBlock, textStyle]}>
          <View style={s.badge}>
            <CheckCircle2 size={14} color={ds.green} />
            <Text style={s.badgeText}>Đăng nhập thành công</Text>
          </View>
          <Text style={s.title}>{title}</Text>

          <View style={s.stepRow}>
            <Animated.Text key={step} entering={FadeIn.duration(260)} exiting={FadeOut.duration(160)} style={s.stepText}>
              {STEPS[step]}
            </Animated.Text>
          </View>

          <View style={s.track}>
            <Animated.View style={[s.fill, barStyle]} />
          </View>
          <View style={s.dots}>
            {STEPS.map((label, i) => (
              <View key={label} style={[s.dot, i <= step && s.dotOn]} />
            ))}
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

export default LoginSuccessScreen;

const STAGE_W = 300;
const STAGE_H = 300;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.hero },
  halo: { position: 'absolute', borderRadius: 999, backgroundColor: ds.onInkFaint },
  haloTop: { width: 320, height: 320, top: -120, right: -110 },
  haloBottom: { width: 260, height: 260, bottom: -90, left: -100 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 28 },

  stage: { width: STAGE_W, height: STAGE_H, alignItems: 'center', justifyContent: 'flex-end' },
  spotlight: {
    position: 'absolute',
    bottom: 6,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(125,211,252,0.10)',
  },
  fox: { marginBottom: 4 },
  twinkle: { position: 'absolute' },

  bubble: {
    position: 'absolute',
    top: 6,
    right: 4,
    maxWidth: 170,
    backgroundColor: ds.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    zIndex: 2,
    transformOrigin: '15% 100%',
  },
  bubbleText: { fontFamily: dsFont.display, fontSize: dsSize.base, color: ds.ink },
  bubbleTail: {
    position: 'absolute',
    bottom: -6,
    left: 22,
    width: 14,
    height: 14,
    backgroundColor: ds.white,
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
  },

  textBlock: { width: '100%', maxWidth: 340, alignItems: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(22,163,74,0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  badgeText: { fontFamily: dsFont.semibold, fontSize: dsSize.xs, color: ds.greenSoft },
  title: { fontFamily: dsFont.displayHeavy, fontSize: dsSize.xl, color: ds.white, textAlign: 'center', letterSpacing: -0.3 },
  stepRow: { height: 24, justifyContent: 'center', marginTop: 8, marginBottom: 18 },
  stepText: { fontFamily: dsFont.medium, fontSize: dsSize.sm, color: ds.onInk, textAlign: 'center' },
  track: { width: '100%', height: 6, borderRadius: 3, backgroundColor: ds.onInkFaint, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: ds.amber },
  dots: { flexDirection: 'row', gap: 6, marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ds.onInkFaint },
  dotOn: { backgroundColor: ds.amber },
});
