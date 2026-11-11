import React, { useEffect, useRef, useState } from 'react';
import { Platform, TextInput, type TextInputInstance } from 'react-native';
import { useRouter } from 'expo-router';
import { Gift, Lock, Mail, Phone, User } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuthFlow } from '../../application/useAuthFlow';
import { useOnboardingStore } from '@/src/features/onboarding/application/useOnboardingStore';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  loadGoogleGsiScript,
  signInWithGoogleWeb,
} from '../../infrastructure/googleAuthHelper';
import { AuthButton, AuthDivider, AuthErrorBanner, AuthFooterLink, AuthLayout, AuthTextField } from '../components/AuthUI';

WebBrowser.maybeCompleteAuthSession();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = 'name' | 'email' | 'password' | 'confirm';

export const RegisterScreen = () => {
  const router = useRouter();
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState('');

  // Mục tiêu & trình độ lấy từ bước chọn mục tiêu / test đầu vào (trước đây gửi cứng 'B1' / 'TOEIC 750')
  const { targetGoal, result } = useOnboardingStore();
  const { register, googleLogin, isPending, isError, error } = useAuthFlow();

  useEffect(() => {
    if (Platform.OS === 'web') {
      loadGoogleGsiScript().catch((e) => console.warn('Lỗi tải Google SDK Web:', e));
    }
  }, []);

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const params = googleResponse.params as Record<string, string | undefined>;
    const token =
      googleResponse.authentication?.idToken ||
      googleResponse.authentication?.accessToken ||
      params?.id_token ||
      params?.access_token;
    if (token) googleLogin(token);
  }, [googleResponse, googleLogin]);

  const clearError = (field: Field) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError('');
  };

  const validate = (): boolean => {
    const errors: Partial<Record<Field, string>> = {};
    if (!displayName.trim()) errors.name = 'Vui lòng nhập họ tên';
    if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Email không đúng định dạng';
    if (password.length < 6) errors.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (confirmPassword !== password) errors.confirm = 'Mật khẩu nhập lại không khớp';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = () => {
    setFormError('');
    if (!validate()) return;
    const cleanEmail = email.trim();
    register(
      {
        email: cleanEmail,
        password: password.trim(),
        displayName: displayName.trim(),
        username: cleanEmail.split('@')[0],
        phone: phone.trim() || undefined,
        referralCode: referralCode.trim() || undefined,
        cefrLevel: result?.cefr_level || undefined,
        targetGoal: targetGoal || undefined,
      },
      {
        onError: (err) => {
          const e = err as { response?: { data?: { message?: string } }; message?: string };
          setFormError(e?.response?.data?.message || e?.message || 'Đăng ký không thành công');
        },
      }
    );
  };

  const handleGooglePress = async () => {
    setFormError('');
    try {
      if (Platform.OS === 'web') {
        await signInWithGoogleWeb(
          (token) => googleLogin(token),
          (msg) => setFormError(msg)
        );
        return;
      }
      await promptGoogleAsync?.();
    } catch (err) {
      console.warn('Google sign up prompt error:', err);
      setFormError('Không thể mở đăng nhập Google, vui lòng thử lại');
    }
  };

  const serverError = isError && !formError
    ? (error as { response?: { data?: { message?: string } } })?.response?.data?.message || ''
    : '';

  return (
    <AuthLayout
      title="Tạo tài khoản"
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'))}
      showMascot={false}
      footer={<AuthFooterLink text="Đã có tài khoản?" link="Đăng nhập" onPress={() => router.replace('/(auth)/login')} />}
    >
      <AuthErrorBanner message={formError || serverError} />

      <AuthTextField
        label="Họ và tên"
        icon={User}
        value={displayName}
        onChangeText={(t) => {
          setDisplayName(t);
          clearError('name');
        }}
        error={fieldErrors.name}
        autoComplete="name"
        placeholder="Nguyễn Văn A"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <AuthTextField
        ref={emailRef}
        label="Email"
        icon={Mail}
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          clearError('email');
        }}
        error={fieldErrors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        placeholder="hocvien@gmail.com"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthTextField
        label="Số điện thoại (không bắt buộc)"
        icon={Phone}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="09xx xxx xxx"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthTextField
        ref={passwordRef}
        label="Mật khẩu"
        icon={Lock}
        secure
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          clearError('password');
        }}
        error={fieldErrors.password}
        autoComplete="new-password"
        placeholder="Tối thiểu 6 ký tự"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <AuthTextField
        ref={confirmRef}
        label="Nhập lại mật khẩu"
        icon={Lock}
        secure
        value={confirmPassword}
        onChangeText={(t) => {
          setConfirmPassword(t);
          clearError('confirm');
        }}
        error={fieldErrors.confirm}
        autoComplete="new-password"
        placeholder="••••••••"
        returnKeyType="next"
      />
      <AuthTextField
        label="Mã giới thiệu (không bắt buộc)"
        icon={Gift}
        value={referralCode}
        onChangeText={setReferralCode}
        autoCapitalize="characters"
        placeholder="VD: LOXERA2026"
        returnKeyType="go"
        onSubmitEditing={handleRegister}
      />

      <AuthButton label="Đăng ký" onPress={handleRegister} loading={isPending} />
      <AuthDivider label="hoặc" />
      <AuthButton label="Tiếp tục với Google" variant="outline" onPress={handleGooglePress} disabled={isPending} />
    </AuthLayout>
  );
};
