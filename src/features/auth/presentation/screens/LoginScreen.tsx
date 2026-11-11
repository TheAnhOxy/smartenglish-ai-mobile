import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuthFlow } from '../../application/useAuthFlow';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  loadGoogleGsiScript,
  signInWithGoogleWeb,
} from '../../infrastructure/googleAuthHelper';
import { AuthButton, AuthDivider, AuthErrorBanner, AuthFooterLink, AuthLayout, AuthTextField } from '../components/AuthUI';

WebBrowser.maybeCompleteAuthSession();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginScreen = () => {
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { login, googleLogin, isPending, isError, error } = useAuthFlow();

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

  const handleLogin = () => {
    setValidationError('');
    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      setValidationError('Vui lòng nhập email và mật khẩu');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setValidationError('Email không đúng định dạng');
      return;
    }
    login({ email: cleanEmail, password: password.trim() });
  };

  const handleGooglePress = async () => {
    setValidationError('');
    try {
      if (Platform.OS === 'web') {
        await signInWithGoogleWeb(
          (token) => googleLogin(token),
          (msg) => setValidationError(msg)
        );
        return;
      }
      await promptGoogleAsync?.();
    } catch (err) {
      console.warn('Google sign in prompt error:', err);
      setValidationError('Không thể mở đăng nhập Google, vui lòng thử lại');
    }
  };

  const serverError = isError
    ? (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
      (error as { message?: string })?.message ||
      'Đăng nhập thất bại'
    : '';
  const errorMessage = validationError || serverError;
  const needsOtp = /xác thực email|xác thực mã otp/i.test(errorMessage);

  return (
    <AuthLayout
      title="Đăng nhập"
      footer={<AuthFooterLink text="Chưa có tài khoản?" link="Đăng ký" onPress={() => router.push('/(auth)/register')} />}
    >
      <AuthErrorBanner message={errorMessage}>
        {needsOtp && email.trim() ? (
          <Pressable
            onPress={() => router.push(`/(auth)/verify-otp?email=${encodeURIComponent(email.trim())}`)}
            className="mt-1.5"
          >
            <Text className="text-xs font-bold text-primary">Xác thực OTP ngay</Text>
          </Pressable>
        ) : null}
      </AuthErrorBanner>

      <AuthTextField
        label="Email"
        icon={Mail}
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setValidationError('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        placeholder="hocvien@gmail.com"
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
          setValidationError('');
        }}
        autoComplete="password"
        placeholder="••••••••"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
      />

      <AuthButton label="Đăng nhập" onPress={handleLogin} loading={isPending} />
      <AuthDivider label="hoặc" />
      <AuthButton label="Tiếp tục với Google" variant="outline" onPress={handleGooglePress} disabled={isPending} />
    </AuthLayout>
  );
};
