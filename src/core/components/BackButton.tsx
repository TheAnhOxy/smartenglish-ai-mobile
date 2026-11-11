import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/src/theme';

interface BackButtonProps {
  /** Mặc định quay lại màn trước, không có lịch sử thì về trang chủ. */
  onPress?: () => void;
  /** 'onDark' cho header nền tối. */
  variant?: 'default' | 'onDark';
  style?: StyleProp<ViewStyle>;
}

/** Nút quay lại dùng chung cho mọi màn hình. */
export const BackButton: React.FC<BackButtonProps> = ({ onPress, variant = 'default', style }) => {
  const router = useRouter();
  const handlePress =
    onPress ??
    (() => {
      if (router.canGoBack()) router.back();
      else router.replace('/(student)/home');
    });
  const dark = variant === 'onDark';

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Quay lại"
      style={({ pressed }) => [s.base, dark ? s.dark : s.light, pressed && { opacity: 0.7 }, style]}
    >
      <ArrowLeft size={20} color={dark ? '#FFFFFF' : colors.text} strokeWidth={2} />
    </Pressable>
  );
};

const s = StyleSheet.create({
  base: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  light: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  dark: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
});
