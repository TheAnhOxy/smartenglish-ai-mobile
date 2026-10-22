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
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthFlow } from '../../application/useAuthFlow';
import { LoxeraFoxMascot } from '@/src/core/components/LoxeraFoxMascot';
import { colors } from '@/src/theme/colors';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import { useStaggerReveal } from '@/src/hooks/useStaggerReveal';
import { ShieldAlert, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  loadGoogleGsiScript,
  signInWithGoogleWeb,
} from '../../infrastructure/googleAuthHelper';

WebBrowser.maybeCompleteAuthSession();

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const LoginScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { login, googleLogin, isPending, isError, error } = useAuthFlow();

  // Khởi tạo trước Google Identity Services trên Web
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      loadGoogleGsiScript().catch((e) => console.warn('Lỗi tải Google SDK Web:', e));
    }
  }, []);

  // Cấu hình Google Sign-In qua Expo AuthSession cho môi trường Native (Android/iOS)
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const token =
        googleResponse.authentication?.idToken ||
        googleResponse.authentication?.accessToken ||
        (googleResponse.params as any)?.id_token ||
        (googleResponse.params as any)?.access_token;
      if (token) {
        googleLogin(token);
      }
    }
  }, [googleResponse]);

  const handleLogin = () => {
    setValidationError('');
    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      setValidationError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    // Ràng buộc nghiêm ngặt: Chỉ cho phép Email/Gmail, không cho phép số điện thoại
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setValidationError('Vui lòng nhập đúng định dạng email (ví dụ: hocvien@gmail.com). Hệ thống không hỗ trợ đăng nhập bằng số điện thoại.');
      return;
    }

    login({ email: cleanEmail, password: password.trim() });
  };

  const handleGooglePress = async () => {
    setValidationError('');
    try {
      if (Platform.OS === 'web') {
        // Trên Web: Dùng Google Identity Services chính thức để tránh lỗi COOP (Cross-Origin-Opener-Policy)
        await signInWithGoogleWeb(
          (token) => googleLogin(token),
          (errMsg) => setValidationError(errMsg)
        );
        return;
      }

      if (promptGoogleAsync) {
        await promptGoogleAsync();
      }
    } catch (err: any) {
      console.warn('Google sign in prompt error:', err);
      setValidationError('Không thể mở đăng nhập Google lúc này. Vui lòng thử lại.');
    }
  };

  const loginSpring = usePressSpring(0.97);
  const cardAnim0 = useStaggerReveal(0, 60);
  const cardAnim1 = useStaggerReveal(1, 60);

  const safeTop = (insets.top || 16) + 12;

  const rawErrorMessage =
    validationError ||
    (isError
      ? (error as any)?.response?.data?.message || (error as any)?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.'
      : '');

  const isEmailUnverified =
    rawErrorMessage.toLowerCase().includes('chưa được xác thực email') ||
    rawErrorMessage.toLowerCase().includes('xác thực mã otp');

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
        {rawErrorMessage ? (
          <View style={s.errorBox}>
            <ShieldAlert color={colors.danger} size={16} strokeWidth={2} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={s.errorText}>{rawErrorMessage}</Text>
              {isEmailUnverified && email.trim() ? (
                <TouchableOpacity
                  style={s.verifyNowBtn}
                  onPress={() => router.push(`/(auth)/verify-otp?email=${encodeURIComponent(email.trim())}` as any)}
                >
                  <Text style={s.verifyNowText}>Xác thực mã OTP ngay</Text>
                  <ArrowRight color={colors.primary} size={14} strokeWidth={2.2} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Email Field - Bắt buộc Gmail / Email, không có số điện thoại */}
        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Địa chỉ Email / Gmail</Text>
          <View style={s.inputWrapper}>
            <Mail color={colors.textFaint} size={16} strokeWidth={1.8} style={s.inputIcon} />
            <TextInput
              value={email}
              onChangeText={(txt) => {
                setEmail(txt);
                setValidationError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="hocvien@gmail.com"
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
              onChangeText={(txt) => {
                setPassword(txt);
                setValidationError('');
              }}
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textFaint}
              style={s.inputFieldPassword}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              style={s.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {showPassword ? (
                <EyeOff color={colors.textFaint} size={16} strokeWidth={1.8} />
              ) : (
                <Eye color={colors.textFaint} size={16} strokeWidth={1.8} />
              )}
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
        <Pressable
          style={s.socialBtn}
          onPress={handleGooglePress}
          disabled={isPending}
        >
          <Text style={[s.socialBtnLabel, { color: '#EA4335' }]}>G</Text>
          <Text style={s.socialText}>Google</Text>
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
    lineHeight: 18,
  },
  verifyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 2,
  },
  verifyNowText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
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
