import { useRef } from 'react';
import { Animated } from 'react-native';

// Phản hồi tức thì khi ngón tay chạm, dùng Animated native driver mượt mà 60fps trên mọi thiết bị
export function usePressSpring(scaleTo = 0.97) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

  const animatedStyle = {
    transform: [{ scale }],
  };

  return {
    animatedStyle,
    onPressIn,
    onPressOut,
  };
}

