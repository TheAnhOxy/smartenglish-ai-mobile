import React from 'react';
import { Pressable, ViewStyle, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import { palette } from '@/src/theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  elevated = false,
  style,
}) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressSpring(0.98);

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[s.card, elevated && s.elevated, animatedStyle, style]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={[s.card, elevated && s.elevated, style]}>
      {children}
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
  },
  elevated: {
    shadowColor: palette.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
});
