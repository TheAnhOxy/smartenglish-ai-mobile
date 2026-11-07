import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export function useStaggerReveal(index: number, staggerDelayMs = 50) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * staggerDelayMs,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: index * staggerDelayMs,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, staggerDelayMs]);

  return {
    opacity,
    transform: [{ translateY }],
  };
}

