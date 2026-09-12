import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export function usePressSpring(scaleTo = 0.96) {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    'worklet';
    scale.value = withSpring(scaleTo, {
      damping: 16,
      stiffness: 180,
    });
  };

  const onPressOut = () => {
    'worklet';
    scale.value = withSpring(1, {
      damping: 14,
      stiffness: 160,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    animatedStyle,
    onPressIn,
    onPressOut,
  };
}
