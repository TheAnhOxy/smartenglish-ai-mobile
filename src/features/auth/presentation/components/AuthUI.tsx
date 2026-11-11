import React, { forwardRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextInputInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { LoxeraFoxMascot } from '@/src/core/components/LoxeraFoxMascot';

/* Bộ khung dùng chung cho đăng nhập / đăng ký / xác thực: cùng lề, cùng cỡ chữ, cùng kiểu nút & loading. */

interface AuthLayoutProps {
  title: string;
  onBack?: () => void;
  showMascot?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, onBack, showMascot = true, children, footer }) => {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface dark:bg-darkBg"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} accessibilityLabel="Quay lại" className="w-10 h-10 -ml-2 items-center justify-center">
            <ArrowLeft size={20} color={AppColors.neutralInk} />
          </Pressable>
        ) : null}

        {showMascot ? (
          <View className="items-center mt-4 mb-6">
            <LoxeraFoxMascot size={72} />
          </View>
        ) : (
          <View className="h-6" />
        )}

        <Text className="text-2xl font-bold text-neutralInk dark:text-white mb-6">{title}</Text>
        {children}
        {footer ? <View className="mt-auto pt-8">{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

interface AuthTextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon: LucideIcon;
  error?: string | null;
  secure?: boolean;
}

export const AuthTextField = forwardRef<TextInputInstance, AuthTextFieldProps>(
  ({ label, icon: Icon, error, secure, ...inputProps }, ref) => {
    const [hidden, setHidden] = useState(true);
    return (
      <View className="mb-4">
        <Text className="text-xs font-semibold text-neutralGray mb-1.5">{label}</Text>
        <View
          className={`flex-row items-center h-12 px-3 rounded-xl bg-white dark:bg-darkCard border ${
            error ? 'border-error' : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <Icon size={16} color={AppColors.neutralGray} />
          <TextInput
            ref={ref}
            {...inputProps}
            secureTextEntry={secure ? hidden : false}
            placeholderTextColor={AppColors.neutralGray}
            className="flex-1 ml-2 text-sm text-neutralInk dark:text-white"
          />
          {secure ? (
            <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8} accessibilityLabel={hidden ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}>
              {hidden ? <Eye size={16} color={AppColors.neutralGray} /> : <EyeOff size={16} color={AppColors.neutralGray} />}
            </Pressable>
          ) : null}
        </View>
        {error ? <Text className="text-xs text-error mt-1">{error}</Text> : null}
      </View>
    );
  }
);
AuthTextField.displayName = 'AuthTextField';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
}

export const AuthButton: React.FC<AuthButtonProps> = ({ label, onPress, loading, disabled, variant = 'primary' }) => {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      className={`h-12 rounded-xl items-center justify-center flex-row ${
        isPrimary ? 'bg-primary active:bg-primaryDark' : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-darkCard'
      }`}
      style={{ opacity: loading || disabled ? 0.7 : 1 }}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : AppColors.primary} size="small" />
      ) : (
        <Text className={`text-sm font-bold ${isPrimary ? 'text-white' : 'text-neutralInk dark:text-white'}`}>{label}</Text>
      )}
    </Pressable>
  );
};

export const AuthErrorBanner: React.FC<{ message?: string | null; children?: React.ReactNode }> = ({ message, children }) =>
  message ? (
    <View className="bg-error/10 rounded-xl px-3 py-2.5 mb-4">
      <Text className="text-xs text-error">{message}</Text>
      {children}
    </View>
  ) : null;

export const AuthDivider: React.FC<{ label: string }> = ({ label }) => (
  <View className="flex-row items-center my-5">
    <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    <Text className="text-xs text-neutralGray mx-3">{label}</Text>
    <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
  </View>
);

export const AuthFooterLink: React.FC<{ text: string; link: string; onPress: () => void }> = ({ text, link, onPress }) => (
  <View className="flex-row justify-center items-center">
    <Text className="text-sm text-neutralGray">{text} </Text>
    <Pressable onPress={onPress} hitSlop={8}>
      <Text className="text-sm font-bold text-primary">{link}</Text>
    </Pressable>
  </View>
);
