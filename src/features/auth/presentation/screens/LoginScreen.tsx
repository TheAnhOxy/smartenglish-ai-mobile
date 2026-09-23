import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthFlow } from '../../application/useAuthFlow';
import { LoxeraFoxMascot } from '@/src/core/components/LoxeraFoxMascot';
import { colors } from '@/src/theme/colors';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import { useStaggerReveal } from '@/src/hooks/useStaggerReveal';
import { ShieldAlert, Eye, EyeOff, Mail, Lock } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const LoginScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isPending, isError, error } = useAuthFlow();

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) return;
    login({ email: email.trim(), password: password.trim() });
  };

  const loginSpring = usePressSpring(0.97);
  const cardAnim0 = useStaggerReveal(0, 60);
  const cardAnim1 = useStaggerReveal(1, 60);

  const safeTop = Math.max(insets.top, 48) + 12;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.contentContainer, { paddingTop: safeTop }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header & Logo */}
      <Animated.View style={[s.header, cardAnim0]}>
        <View style={s.logoWrapper}>
          <LoxeraFoxMascot size={88} showGlow animated />
        </View>
        <Text style={s.appTitle}>Loxera</Text>
        <Text style={s.appSubtitle}>
          Trợ lý học tiếng Anh cá nhân hóa thế hệ mới
        </Text>
      </Animated.View>

      {/* Login Form Card */}
      <Animated.View style={[s.card, cardAnim1]}>
        <Text style={s.formTitle}>Đăng nhập tài khoản</Text>

        {/* Error Box */}
        {isError && (
          <View style={s.errorBox}>
            <ShieldAlert color={colors.danger} size={16} strokeWidth={2} />
            <Text style={s.errorText}>
              {(error as any)?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.'}
            </Text>
          </View>
        )}

        {/* Email Field */}
        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Email</Text>
          <View style={s.inputWrapper}>
            <Mail color={colors.textFaint} size={16} strokeWidth={1.8} style={s.inputIcon} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="email@example.com"
              placeholderTextColor={colors.textFaint}
              style={s.inputField}
            />
          </View>
        </View>

        {/* Password Field */}
        <View style={s.inputGroupLarge}>
          <Text style={s.inputLabel}>Mật khẩu</Text>
          <View style={s.inputWrapper}>
            <Lock color={colors.textFaint} size={16} strokeWidth={1.8} style={s.inputIcon} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textFaint}
              style={s.inputFieldPassword}
            />
            <Pressable
              onPress={() => setShowPassword(v => !v)}
              style={s.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {showPassword
                ? <EyeOff color={colors.textFaint} size={16} strokeWidth={1.8} />
                : <Eye color={colors.textFaint} size={16} strokeWidth={1.8} />
              }
            </Pressable>
          </View>
        </View>

        {/* Forgot Password */}
        <Pressable style={s.forgotRow}>
          <Text style={s.forgotText}>Quên mật khẩu?</Text>
        </Pressable>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isPending}
          activeOpacity={0.85}
          style={s.loginBtn}
        >
          {isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={s.loginBtnText}>Đăng Nhập</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Social Login Dividers */}
      <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>Hoặc tiếp tục với</Text>
        <View style={s.dividerLine} />
      </View>

      <View style={s.socialRow}>
        <Pressable style={s.socialBtn}>
          <Text style={s.socialBtnLabel}>G</Text>
          <Text style={s.socialText}>Google</Text>
        </Pressable>
        <Pressable style={s.socialBtn}>
          <Text style={s.socialBtnLabel}></Text>
          <Text style={s.socialText}>Apple</Text>
        </Pressable>
      </View>

      {/* Link to Register */}
      <View style={s.registerRow}>
        <Text style={s.registerText}>Chưa có tài khoản?</Text>
        <Pressable onPress={() => router.push('/(auth)/register' as any)}>
          <Text style={s.registerLink}>Đăng ký ngay</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: colors.textSoft,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 19,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(225, 84, 63, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    flex: 1,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputGroupLarge: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSoft,
    marginBottom: 7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text,
  },
  inputFieldPassword: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text,
  },
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primaryDeep,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: colors.textFaint,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  registerText: {
    fontSize: 14,
    color: colors.textSoft,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
