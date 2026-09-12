import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuthFlow } from '../../application/useAuthFlow';
import { LoxeraFoxMascot } from '@/src/core/components/LoxeraFoxMascot';
import { palette, font } from '@/src/theme';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import { useStaggerReveal } from '@/src/hooks/useStaggerReveal';
import { User, GraduationCap, ShieldAlert } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isPending, isError, error } = useAuthFlow();

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      return;
    }
    login({ email: email.trim(), password: password.trim() });
  };

  const loginSpring = usePressSpring(0.97);

  const cardAnim0 = useStaggerReveal(0, 60);
  const cardAnim1 = useStaggerReveal(1, 60);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header & Logo */}
      <Animated.View style={[s.header, cardAnim0]}>
        <View style={s.logoWrapper}>
          <LoxeraFoxMascot size={92} showGlow animated />
        </View>
        <Text style={s.appTitle}>Loxera</Text>
        <Text style={s.appSubtitle}>
          Trợ lý học tiếng Anh cá nhân hóa thế hệ mới
        </Text>
      </Animated.View>

      {/* Login Form */}
      <Animated.View style={[s.card, cardAnim1]}>
        <Text style={s.formTitle}>Đăng nhập tài khoản</Text>

        {isError && (
          <View style={s.errorBox}>
            <ShieldAlert color={palette.danger} size={18} />
            <Text style={s.errorText}>
              {(error as any)?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.'}
            </Text>
          </View>
        )}

        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="email@example.com"
            placeholderTextColor={palette.textSoft}
            style={s.input}
          />
        </View>

        <View style={s.inputGroupLarge}>
          <Text style={s.inputLabel}>Mật khẩu</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={palette.textSoft}
            style={s.input}
          />
        </View>

        <AnimatedPressable
          onPress={handleLogin}
          onPressIn={loginSpring.onPressIn}
          onPressOut={loginSpring.onPressOut}
          disabled={isPending}
          style={[s.loginBtn, loginSpring.animatedStyle]}
        >
          {isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={s.loginBtnText}>Đăng Nhập</Text>
          )}
        </AnimatedPressable>
      </Animated.View>

      {/* Social Login Dividers */}
      <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>Hoặc tiếp tục với</Text>
        <View style={s.dividerLine} />
      </View>

      <View style={s.socialRow}>
        <Pressable style={s.socialBtn}>
          <Image
            source={{ uri: 'https://www.google.com/favicon.ico' }}
            style={s.socialIcon}
          />
          <Text style={s.socialText}>Google</Text>
        </Pressable>
        <Pressable style={s.socialBtn}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/0/747.png' }}
            style={s.socialIcon}
          />
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
    backgroundColor: palette.bg,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 28,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    fontFamily: font.family,
    color: palette.textSoft,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: palette.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '500',
    color: palette.textSoft,
    marginBottom: 14,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleBtn: {
    flex: 1,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
  },
  roleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.text,
  },
  roleSub: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(225, 84, 63, 0.08)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(225, 84, 63, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    fontFamily: font.family,
    color: palette.danger,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputGroupLarge: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '500',
    color: palette.textSoft,
    marginBottom: 6,
  },
  input: {
    backgroundColor: palette.bg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    fontSize: 15,
    fontFamily: font.family,
    color: palette.text,
    borderWidth: 1,
    borderColor: palette.border,
  },
  loginBtn: {
    backgroundColor: palette.primary,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontFamily: font.family,
    fontWeight: '700',
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.border,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontFamily: font.family,
    color: palette.textSoft,
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
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  socialIcon: {
    width: 18,
    height: 18,
  },
  socialText: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.text,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  registerText: {
    fontSize: 14,
    fontFamily: font.family,
    color: palette.textSoft,
  },
  registerLink: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.primary,
  },
});


