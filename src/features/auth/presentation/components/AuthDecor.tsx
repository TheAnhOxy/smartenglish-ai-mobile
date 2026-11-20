import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Sparkle } from 'lucide-react-native';
import { ds, dsFont, dsSize } from '@/src/theme/ds';

/** Giá trị chạy qua lại 0..1 liên tục, lệch pha theo delay. */
const useWave = (duration: number, delay: number) => {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(v);
  }, [delay, duration, v]);
  return v;
};

const WordChip: React.FC<{ word: string; top: number; side: 'left' | 'right'; offset: number; delay: number; tone: 'sky' | 'amber' | 'green' }> = ({
  word,
  top,
  side,
  offset,
  delay,
  tone,
}) => {
  const v = useWave(2600 + delay, delay);
  const style = useAnimatedStyle(() => ({
    opacity: 0.75 + v.value * 0.25,
    transform: [{ translateY: -v.value * 8 }, { rotate: `${(side === 'left' ? -1 : 1) * (4 - v.value * 6)}deg` }],
  }));
  const color = tone === 'amber' ? ds.amber : tone === 'green' ? ds.greenSoft : ds.skyLight;
  return (
    <Animated.View style={[s.chip, { top, [side]: offset, borderColor: color }, style]}>
      <Text style={[s.chipText, { color }]}>{word}</Text>
    </Animated.View>
  );
};

const Twinkle: React.FC<{ top: number; left?: number; right?: number; size: number; delay: number }> = ({ top, left, right, size, delay }) => {
  const v = useWave(1000, delay);
  const style = useAnimatedStyle(() => ({
    opacity: 0.2 + v.value * 0.8,
    transform: [{ scale: 0.6 + v.value * 0.5 }, { rotate: `${v.value * 60}deg` }],
  }));
  return (
    <Animated.View style={[s.abs, { top, left, right }, style]}>
      <Sparkle size={size} color={ds.skyLight} fill={ds.skyLight} />
    </Animated.View>
  );
};

/** Họa tiết phần đầu màn auth: từ tiếng Anh trôi lơ lửng hai bên linh vật và sao lấp lánh. */
export const AuthHeroDecor: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <WordChip word="Hello!" top={78} side="left" offset={22} delay={0} tone="sky" />
    <WordChip word="ABC" top={150} side="left" offset={48} delay={500} tone="amber" />
    <WordChip word="Speak" top={92} side="right" offset={26} delay={250} tone="green" />
    <WordChip word="Learn" top={168} side="right" offset={40} delay={800} tone="sky" />
    <Twinkle top={64} left={120} size={12} delay={0} />
    <Twinkle top={200} left={16} size={10} delay={400} />
    <Twinkle top={60} right={110} size={14} delay={700} />
    <Twinkle top={215} right={18} size={9} delay={300} />
  </View>
);

const LETTERS = ['A', 'b', 'C', 'e', 'G', 'k', 'M', 'r', 'S', 'w', 'Y', 'z'] as const;

const FloatingLetter: React.FC<{ ch: string; index: number }> = ({ ch, index }) => {
  const v = useWave(3200 + (index % 4) * 500, index * 260);
  const col = index % 4;
  const row = Math.floor(index / 4);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -v.value * 10 }, { rotate: `${(index % 2 ? 1 : -1) * 12}deg` }] }));
  return (
    <Animated.Text
      style={[
        s.letter,
        { left: `${8 + col * 24 + (row % 2) * 10}%`, top: 24 + row * 70, fontSize: 30 + (index % 3) * 8 },
        style,
      ]}
    >
      {ch}
    </Animated.Text>
  );
};

/** Nền chữ cái mờ trôi chậm ở phần dưới màn hình. */
export const AuthBackdropLetters: React.FC = () => (
  <View style={s.backdrop} pointerEvents="none">
    {LETTERS.map((ch, i) => (
      <FloatingLetter key={ch} ch={ch} index={i} />
    ))}
  </View>
);

const s = StyleSheet.create({
  abs: { position: 'absolute' },
  chip: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: ds.onInkFaint,
  },
  chipText: { fontFamily: dsFont.bold, fontSize: dsSize.xs },
  backdrop: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 260 },
  letter: { position: 'absolute', fontFamily: dsFont.displayHeavy, color: ds.line },
  moon: { backgroundColor: ds.amberSoft, overflow: 'hidden' },
  moonGlow: { position: 'absolute', backgroundColor: ds.amberSoft },
  crater: { position: 'absolute', borderRadius: 999, backgroundColor: ds.amber, opacity: 0.22 },
});

/** Trăng tròn có quầng sáng và vài miệng hố, nhấp nhô nhẹ. */
export const NightMoon: React.FC<{ size?: number }> = ({ size = 54 }) => {
  const v = useWave(2400, 0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -v.value * 5 }] }));
  const glow = useAnimatedStyle(() => ({ opacity: 0.25 + v.value * 0.2, transform: [{ scale: 1.5 + v.value * 0.15 }] }));
  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <Animated.View style={[s.moonGlow, { width: size, height: size, borderRadius: size / 2 }, glow]} />
      <View style={[s.moon, { width: size, height: size, borderRadius: size / 2 }]}>
        <View style={[s.crater, { width: size * 0.22, height: size * 0.22, top: size * 0.22, left: size * 0.24 }]} />
        <View style={[s.crater, { width: size * 0.14, height: size * 0.14, top: size * 0.56, left: size * 0.52 }]} />
        <View style={[s.crater, { width: size * 0.1, height: size * 0.1, top: size * 0.3, left: size * 0.64 }]} />
      </View>
    </Animated.View>
  );
};

const NIGHT_STARS = [
  { top: '8%', left: '12%', size: 10 },
  { top: '14%', left: '78%', size: 8 },
  { top: '30%', left: '6%', size: 7 },
  { top: '42%', left: '90%', size: 9 },
  { top: '58%', left: '4%', size: 8 },
  { top: '66%', left: '84%', size: 11 },
  { top: '78%', left: '20%', size: 9 },
  { top: '86%', left: '70%', size: 7 },
  { top: '92%', left: '40%', size: 10 },
] as const;

const NightStar: React.FC<{ top: `${number}%`; left: `${number}%`; size: number; index: number }> = ({ top, left, size, index }) => {
  const v = useWave(900 + (index % 3) * 300, index * 150);
  const style = useAnimatedStyle(() => ({ opacity: 0.3 + v.value * 0.7, transform: [{ scale: 0.7 + v.value * 0.4 }] }));
  return (
    <Animated.View style={[s.abs, { top, left }, style]}>
      <Sparkle size={size} color={ds.amberSoft} fill={ds.amberSoft} />
    </Animated.View>
  );
};

/** Bầu trời đêm phủ toàn màn hình: sao lấp lánh rải rác. */
export const NightSky: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {NIGHT_STARS.map((st, i) => (
      <NightStar key={i} top={st.top} left={st.left} size={st.size} index={i} />
    ))}
  </View>
);
