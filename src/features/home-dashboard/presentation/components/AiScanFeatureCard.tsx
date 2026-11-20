import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple, Coffee, Lamp } from 'lucide-react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Tap } from '@/src/components/ds';
import { Camera, ChevronRight } from '@/src/components/ds/icons';
import { ds, dsFont, dsRadius, dsShadow, dsSize } from '@/src/theme/ds';

const VIEW = 104;
const BOX = 58;

/** Các "ảnh chụp" minh hoạ: đồ vật và kết quả AI nhận ra. */
const SAMPLES = [
  { icon: Coffee, en: 'cup', vi: 'cái cốc' },
  { icon: Apple, en: 'apple', vi: 'quả táo' },
  { icon: Lamp, en: 'lamp', vi: 'cái đèn' },
] as const;
const CYCLE_MS = 2600;

interface AiScanFeatureCardProps {
  onPress: () => void;
}

/** Thẻ nổi bật Quét ảnh AI: khung camera nhận diện đồ vật và hiện từ vựng như kết quả quét thật. */
export const AiScanFeatureCard: React.FC<AiScanFeatureCardProps> = ({ onPress }) => {
  const [index, setIndex] = useState(0);
  const scan = useSharedValue(0);
  const lock = useSharedValue(0);

  useEffect(() => {
    scan.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, true);
    const id = setInterval(() => setIndex((i) => (i + 1) % SAMPLES.length), CYCLE_MS);
    return () => {
      clearInterval(id);
      cancelAnimation(scan);
    };
  }, [scan]);

  // Mỗi lần đổi đồ vật: khung nhận diện co lại "bắt" vật thể
  useEffect(() => {
    lock.value = 0;
    lock.value = withSequence(
      withTiming(0, { duration: 350 }),
      withTiming(1, { duration: 320, easing: Easing.out(Easing.back(2)) }),
    );
  }, [index, lock]);

  const lineStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scan.value * (VIEW - 10) }] }));
  const boxStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + lock.value * 0.6,
    transform: [{ scale: 1.35 - lock.value * 0.35 }],
  }));

  const sample = SAMPLES[index];
  const ObjectIcon = sample.icon;

  return (
    <Tap onPress={onPress} style={s.card} scaleTo={0.98} accessibilityLabel="Quét ảnh AI: chụp đồ vật để học từ vựng">
      <View style={s.viewfinder}>
        <LinearGradient colors={[ds.amberSoft, ds.skySoft]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Animated.View key={sample.en} entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={s.object}>
          <ObjectIcon size={38} color={ds.inkSoft} strokeWidth={1.6} />
        </Animated.View>
        <Animated.View style={[s.detectBox, boxStyle]} />
        <Animated.View style={[s.scanLine, lineStyle]} />
        <View style={s.recDot} />
      </View>

      <View style={s.info}>
        <Text style={s.kicker}>Học từ đồ vật quanh bạn</Text>
        <Text style={s.title}>Quét ảnh AI</Text>
        <Animated.View key={`r-${sample.en}`} entering={FadeIn.delay(380).duration(260)} style={s.result}>
          <Text style={s.resultEn}>{sample.en}</Text>
          <Text style={s.resultVi}>{sample.vi}</Text>
        </Animated.View>
        <View style={s.cta}>
          <Camera size={16} color={ds.white} />
          <Text style={s.ctaText}>Mở camera</Text>
          <ChevronRight size={14} color={ds.white} />
        </View>
      </View>
    </Tap>
  );
};

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: ds.card,
    borderRadius: dsRadius.xl,
    borderWidth: 1.5,
    borderColor: ds.line,
    borderBottomWidth: 4,
    borderBottomColor: ds.greenEdge,
    ...dsShadow.card,
  },
  viewfinder: {
    width: VIEW,
    height: VIEW,
    borderRadius: dsRadius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  object: { alignItems: 'center', justifyContent: 'center' },
  detectBox: {
    position: 'absolute',
    width: BOX,
    height: BOX,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ds.green,
  },
  scanLine: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: ds.green,
    opacity: 0.7,
  },
  recDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: ds.red },
  info: { flex: 1, gap: 4 },
  kicker: { fontFamily: dsFont.semibold, fontSize: dsSize.xs, color: ds.greenText },
  title: { fontFamily: dsFont.display, fontSize: dsSize.lg, color: ds.ink },
  result: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  resultEn: { fontFamily: dsFont.bold, fontSize: dsSize.base, color: ds.green },
  resultVi: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: ds.green,
    borderRadius: dsRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  ctaText: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.white },
});
