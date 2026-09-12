import { useSharedValue, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

export function useStaggerReveal(index: number, staggerDelayMs = 50) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(
      index * staggerDelayMs,
      withTiming(1, { duration: 350 })
    );
    translateY.value = withDelay(
      index * staggerDelayMs,
      withTiming(0, { duration: 350 })
    );
  }, [index, staggerDelayMs]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
}
