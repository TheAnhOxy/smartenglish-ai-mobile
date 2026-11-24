import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Lớp màu nền cũ phủ lên rồi mờ dần (~700ms) khi đổi Sáng ↔ Tối, để đổi theme mượt thay vì giật.
 * Không nhận chạm; tự gọi onDone khi xong.
 */
export const ThemeFade: React.FC<{ color: string; onDone: () => void }> = ({ color, onDone }) => {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  }, [o, onDone]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: color, zIndex: 100 }, st]} />;
};
