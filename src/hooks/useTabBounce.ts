import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { spring } from '@/src/theme/motion';

// Hook cho tab bar icon: bounce lên khi active, trở về khi inactive
// Dùng spring.bouncy để có cảm giác rõ độ nảy như Duolingo/BeReal

export function useTabBounce(focused: boolean) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.18, spring.bouncy);
      translateY.value = withSpring(-5, spring.bouncy);
    } else {
      scale.value = withSpring(1, spring.snappy);
      translateY.value = withSpring(0, spring.snappy);
    }
  }, [focused, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return { animatedStyle };
}
