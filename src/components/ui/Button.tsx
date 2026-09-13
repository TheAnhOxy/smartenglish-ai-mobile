import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import { colors, palette } from '@/src/theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Custom Animated Button Loader Icon
const ButtonSpinner: React.FC<{ color: string; size?: number }> = ({ color, size = 20 }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2.5,
            borderColor: `${color}30`,
            borderTopColor: color,
            borderRightColor: color,
          },
          spinStyle,
        ]}
      />
    </View>
  );
};

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
  const { animatedStyle, onPressIn, onPressOut } = usePressSpring(0.97);

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

  const loaderColor = variant === 'primary' ? '#FFFFFF' : colors.primary;

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
        <View style={s.loadingRow}>
          <ButtonSpinner color={loaderColor} size={18} />
          <Text style={[s.baseText, getTextStyle(), { opacity: 0.9 }]}>Đang xử lý...</Text>
        </View>
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryContainer: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  secondaryContainer: {
    backgroundColor: colors.primarySoft,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  disabledContainer: {
    backgroundColor: colors.textFaint,
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  baseText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: colors.primary,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.textSoft,
  },
  disabledText: {
    color: '#FFFFFF',
  },
});
