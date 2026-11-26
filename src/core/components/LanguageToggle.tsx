import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Globe } from 'lucide-react-native';
import { setLanguage } from '@/src/i18n/i18n';
import { useLanguage } from '@/src/i18n/useLanguage';
import { useThemeMode } from '@/src/theme/useThemeMode';

interface LanguageToggleProps {
  /** 'onDark': đặt trên nền tối (phần đầu màn đăng nhập / đăng ký). */
  variant?: 'default' | 'onDark';
  style?: StyleProp<ViewStyle>;
}

/** Nút đổi nhanh Tiếng Việt ↔ English (lưu lựa chọn; Cài đặt có mục Ngôn ngữ). */
export const LanguageToggle: React.FC<LanguageToggleProps> = ({ variant = 'default', style }) => {
  const { lang } = useLanguage();
  const { dark } = useThemeMode();
  const onDark = variant === 'onDark';
  const fg = onDark ? '#FFFFFF' : dark ? '#FDE68A' : '#0F2A44';
  return (
    <Pressable
      onPress={() => setLanguage(lang === 'vi' ? 'en' : 'vi')}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={lang === 'vi' ? 'Chuyển sang tiếng Anh' : 'Switch to Vietnamese'}
      style={[
        s.btn,
        onDark
          ? { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }
          : dark
            ? { backgroundColor: 'rgba(23,36,58,0.9)', borderColor: 'rgba(253,230,138,0.45)' }
            : { backgroundColor: '#FFFFFF', borderColor: '#E3EAF2' },
        style,
      ]}
    >
      <Globe size={15} color={fg} />
      {/* Mã ngôn ngữ cố định độ rộng để nút không co giãn khi đổi */}
      <Text style={[s.code, { color: fg }]}>{lang === 'vi' ? 'VI' : 'EN'}</Text>
    </Pressable>
  );
};

const s = StyleSheet.create({
  btn: {
    height: 40,
    minWidth: 58,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  code: { width: 20, textAlign: 'center', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
});
