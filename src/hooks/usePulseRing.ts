import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { easings, timing } from '@/src/theme/motion';

// Pulse ring animation cho avatar khi có notification
// active=true: ring nở ra rồi mờ dần, lặp vô hạn
// active=false: ring tắt ngay

export function usePulseRing(active: boolean) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      opacity.value = withRepeat(
        withTiming(0, { duration: 1400, easing: easings.out }),
        -1,
        false
      );
      scale.value = withRepeat(
        withTiming(1.5, { duration: 1400, easing: easings.out }),
        -1,
        false
      );
    } else {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      opacity.value = withTiming(0, { duration: timing.fast });
      scale.value = withTiming(1, { duration: timing.fast });
    }
  }, [active, opacity, scale]);

  // Khi bắt đầu: set về trạng thái khởi đầu
  useEffect(() => {
    if (active) {
      opacity.value = 0.65;
      scale.value = 1;
    }
  }, [active, opacity, scale]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return { ringStyle };
}
