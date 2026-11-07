import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Hook cho tab bar icon: bounce lên khi active, trở về khi inactive
// Dùng spring native driver để có cảm giác rõ độ nảy mượt mà, không phụ thuộc JSI/worklet
export function useTabBounce(focused: boolean) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.18,
          useNativeDriver: true,
          friction: 4,
          tension: 120,
        }),
        Animated.spring(translateY, {
          toValue: -5,
          useNativeDriver: true,
          friction: 4,
          tension: 120,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 140,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 6,
          tension: 140,
        }),
      ]).start();
    }
  }, [focused, scale, translateY]);

  const animatedStyle = {
    transform: [{ scale }, { translateY }],
  };

  return { animatedStyle };
}
