import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import { palette } from '@/src/theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressSpring(0.96);

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return s.secondaryContainer;
      case 'outline':
        return s.outlineContainer;
      case 'ghost':
        return s.ghostContainer;
      default:
        return s.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return s.secondaryText;
      case 'outline':
        return s.outlineText;
      case 'ghost':
        return s.ghostText;
      default:
        return s.primaryText;
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      style={[
        s.base,
        getContainerStyle(),
        disabled && s.disabledContainer,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : palette.primary} />
      ) : (
        <>
          {icon}
          <Text style={[s.baseText, getTextStyle(), disabled && s.disabledText, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
};

const s = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryContainer: {
    backgroundColor: palette.primary,
  },
  secondaryContainer: {
    backgroundColor: palette.primarySoft,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: palette.primary,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  disabledContainer: {
    backgroundColor: palette.mauve,
    opacity: 0.6,
  },
  baseText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: palette.primary,
  },
  outlineText: {
    color: palette.primary,
  },
  ghostText: {
    color: palette.textSoft,
  },
  disabledText: {
    color: '#FFFFFF',
  },
});
