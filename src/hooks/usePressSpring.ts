import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { spring } from '@/src/theme/motion';

// Mọi Pressable/TouchableOpacity PHẢI dùng hook này
// Dùng spring.snappy để có phản hồi tức thì khi ngón tay chạm
// Thiếu bước này là nguyên nhân #1 khiến app "đơ" — ngón tay bấm mà UI im lặng 100-150ms

export function usePressSpring(scaleTo = 0.97) {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    'worklet';
    scale.value = withSpring(scaleTo, spring.snappy);
  };

  const onPressOut = () => {
    'worklet';
    scale.value = withSpring(1, spring.snappy);
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
