import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { setThemePref } from '@/src/theme/themeMode';
import { useThemeMode } from '@/src/theme/useThemeMode';

interface ThemeToggleProps {
  /** 'onDark': đặt trên nền tối (phần đầu màn đăng nhập). */
  variant?: 'default' | 'onDark';
  style?: StyleProp<ViewStyle>;
}

/** Nút đổi nhanh Sáng ↔ Tối (lưu lựa chọn; Cài đặt có thêm tuỳ chọn "Theo hệ thống"). */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'default', style }) => {
  const { dark } = useThemeMode();
  const onDark = variant === 'onDark';
  return (
    <Pressable
      onPress={() => setThemePref(dark ? 'light' : 'dark')}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      style={[
        s.btn,
        // Màu inline để giữ đúng ở cả hai theme
        onDark
          ? { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }
          : dark
            ? { backgroundColor: 'rgba(23,36,58,0.9)', borderColor: 'rgba(253,230,138,0.45)' }
            : { backgroundColor: '#FFFFFF', borderColor: '#E3EAF2' },
        style,
      ]}
    >
      {dark ? <Sun size={20} color="#FBBF24" /> : <Moon size={20} color={onDark ? '#FFFFFF' : '#0F2A44'} />}
    </Pressable>
  );
};

const s = StyleSheet.create({
  btn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
