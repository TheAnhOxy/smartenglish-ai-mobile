import { useSharedValue, useDerivedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

export function useCountUp(targetValue: number, durationMs = 1000) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(targetValue, { duration: durationMs });
  }, [targetValue, durationMs]);

  const count = useDerivedValue(() => {
    return Math.round(progress.value);
  });

  return count;
}
