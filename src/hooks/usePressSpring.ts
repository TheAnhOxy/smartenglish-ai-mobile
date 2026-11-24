import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const SPRING = { damping: 15, stiffness: 400, mass: 0.6 } as const;

/**
 * Phản hồi co nhẹ khi chạm. Dùng Reanimated vì mọi nơi gọi đều gắn style vào
 * `Animated.createAnimatedComponent(Pressable)` của Reanimated; trả Animated.Value của RN
 * cho component đó sẽ làm app crash "Transform with key of scale must be a number".
 */
export function usePressSpring(scaleTo = 0.97) {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(scaleTo, SPRING);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, SPRING);
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
