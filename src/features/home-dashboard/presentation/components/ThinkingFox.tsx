import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedFoxMascot } from '@/src/core/components/AnimatedFoxMascot';
import { ds, dsFont, dsSize } from '@/src/theme/ds';

/** Những gì cáo "nghĩ" trong đầu, đổi lần lượt. */
const THOUGHTS = ['apple?', 'Hello!', 'How are you?', 'vocabulary', "Let's learn!", 'I can do it!'] as const;
const SWITCH_MS = 2200;

interface ThinkingFoxProps {
  size?: number;
}

/** Chấm tròn nhỏ dẫn từ đầu cáo lên bong bóng, nhấp nháy lần lượt. */
const ThoughtDot: React.FC<{ d: number; delay: number; style: object }> = ({ d, delay, style }) => {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(v);
  }, [delay, v]);
  const anim = useAnimatedStyle(() => ({ opacity: 0.45 + v.value * 0.55, transform: [{ scale: 0.85 + v.value * 0.25 }] }));
  return <Animated.View style={[s.dot, { width: d, height: d, borderRadius: d / 2 }, style, anim]} />;
};

/** Linh vật cáo đang suy nghĩ: bong bóng tiếng Anh nổi trên đầu, đổi từ theo vòng. */
export const ThinkingFox: React.FC<ThinkingFoxProps> = ({ size = 96 }) => {
  const [index, setIndex] = useState(0);
  const float = useSharedValue(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % THOUGHTS.length), SWITCH_MS);
    float.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      clearInterval(id);
      cancelAnimation(float);
    };
  }, [float]);

  const bubbleFloat = useAnimatedStyle(() => ({ transform: [{ translateY: -float.value * 4 }] }));

  return (
    <View style={[s.root, { width: size * 1.35, height: size + 46 }]} pointerEvents="none">
      <Animated.View style={[s.bubble, bubbleFloat]}>
        <Animated.Text key={index} entering={FadeIn.duration(280)} exiting={FadeOut.duration(180)} style={s.bubbleText} numberOfLines={1}>
          {THOUGHTS[index]}
        </Animated.Text>
      </Animated.View>
      <ThoughtDot d={9} delay={0} style={{ top: 38, right: size * 0.36 }} />
      <ThoughtDot d={6} delay={200} style={{ top: 50, right: size * 0.44 }} />
      <View style={s.fox}>
        <AnimatedFoxMascot size={size} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'flex-end' },
  bubble: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 76,
    maxWidth: 128,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: ds.white,
    alignItems: 'center',
    zIndex: 2,
  },
  bubbleText: { fontFamily: dsFont.display, fontSize: dsSize.sm, color: ds.btn },
  dot: { position: 'absolute', backgroundColor: ds.white, zIndex: 2 },
  fox: { alignItems: 'center' },
});
