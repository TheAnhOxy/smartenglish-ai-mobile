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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthFlow } from '../../application/useAuthFlow';
import { colors } from '@/src/theme/colors';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import Animated from 'react-native-reanimated';
import {
  ShieldAlert,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Lock,
  Gift,
  ArrowRight,
  UserPlus,
} from 'lucide-react-native';

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

export const RegisterScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, googleLogin, isPending, isError, error } = useAuthFlow();
  const registerSpring = usePressSpring(0.97);

  // Khởi tạo trước Google Identity Services trên Web
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      loadGoogleGsiScript().catch((e) => console.warn('Lỗi tải Google SDK Web:', e));
    }
  }, []);

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

  const handleRegister = () => {
    setErrorMessage('');
    const cleanEmail = email.trim();
    if (!displayName.trim() || !cleanEmail || !password.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Vui lòng nhập đúng định dạng email/Gmail (ví dụ: hocvien@gmail.com).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu nhập lại không khớp.');
      return;
    }

    register(
      {
        email: cleanEmail,
        password: password.trim(),
        displayName: displayName.trim(),
        username: cleanEmail.split('@')[0],
        phone: phone.trim() || undefined,
        referralCode: referralCode.trim() || undefined,
        cefrLevel: 'B1',
        targetGoal: 'TOEIC 750',
      },
      {
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ||
            err.message ||
            'Đăng ký không thành công, vui lòng kiểm tra lại.';
          setErrorMessage(msg);
        },
      }
    );
  };

  const handleGooglePress = async () => {
    setErrorMessage('');
    try {
      if (Platform.OS === 'web') {
        // Trên Web: Dùng Google Identity Services chính thức để tránh lỗi COOP
        await signInWithGoogleWeb(
          (token) => googleLogin(token),
          (errMsg) => setErrorMessage(errMsg)
        );
        return;
      }

      if (promptGoogleAsync) {
        await promptGoogleAsync();
      }
    } catch (err: any) {
      console.warn('Google sign up prompt error:', err);
      setErrorMessage('Không thể mở đăng nhập Google lúc này. Vui lòng thử lại.');
    }
  };

  const activeError =
    errorMessage ||
    (isError
      ? (error as any)?.response?.data?.message ||
        'Email hoặc thông tin đã tồn tại trong hệ thống.'
      : '');

  const safeTop = (insets.top || 16) + 12;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.contentContainer, { paddingTop: safeTop }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.iconCircle}>
          <UserPlus color={colors.primary} size={26} strokeWidth={2} />
        </View>
        <Text style={s.title}>Tạo Tài Khoản Mới</Text>
        <Text style={s.subtitle}>
          Bắt đầu hành trình chinh phục tiếng Anh cá nhân hóa cùng SmartEnglish
        </Text>
      </View>

      {/* Form Card */}
      <View style={s.card}>
        {/* Error Box */}
        {activeError ? (
          <View style={s.errorBox}>
            <ShieldAlert color={colors.danger} size={16} strokeWidth={2} />
            <Text style={s.errorText}>{activeError}</Text>
          </View>
        ) : null}

        {/* Display Name */}
        <InputRow
          label="Họ & Tên Hiển Thị *"
          icon={<User color={colors.textFaint} size={16} strokeWidth={1.8} />}
        >
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Ví dụ: Nguyễn Văn A"
            placeholderTextColor={colors.textFaint}
            style={s.inputField}
          />
        </InputRow>

        {/* Email */}
        <InputRow
          label="Địa Chỉ Email *"
          icon={<Mail color={colors.textFaint} size={16} strokeWidth={1.8} />}
        >
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="hocvien@gmail.com"
            placeholderTextColor={colors.textFaint}
            style={s.inputField}
          />
        </InputRow>

        {/* Phone */}
        <InputRow
          label="Số Điện Thoại (Tùy chọn)"
          icon={<Phone color={colors.textFaint} size={16} strokeWidth={1.8} />}
        >
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="0987654321"
            placeholderTextColor={colors.textFaint}
            style={s.inputField}
          />
        </InputRow>

        {/* Password */}
        <InputRow
          label="Mật Khẩu *"
          icon={<Lock color={colors.textFaint} size={16} strokeWidth={1.8} />}
        >
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
        </InputRow>

        {/* Confirm Password */}
        <InputRow
          label="Nhập Lại Mật Khẩu *"
          icon={<Lock color={colors.textFaint} size={16} strokeWidth={1.8} />}
        >
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textFaint}
            style={s.inputFieldPassword}
          />
          <Pressable
            onPress={() => setShowConfirmPassword(v => !v)}
            style={s.eyeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showConfirmPassword
              ? <EyeOff color={colors.textFaint} size={16} strokeWidth={1.8} />
              : <Eye color={colors.textFaint} size={16} strokeWidth={1.8} />
            }
          </Pressable>
        </InputRow>

        {/* Referral Code */}
        <View style={s.referralGroup}>
          <Text style={s.inputLabel}>Mã Giới Thiệu (Tùy chọn)</Text>
          <View style={s.referralBadge}>
            <Gift color={colors.secondary} size={14} strokeWidth={2} />
            <Text style={s.referralBadgeText}>+50 Coins khi nhập mã hợp lệ</Text>
          </View>
          <View style={s.inputWrapper}>
            <TextInput
              value={referralCode}
              onChangeText={(t) => setReferralCode(t.toUpperCase())}
              placeholder="Nhập mã giới thiệu nếu có"
              placeholderTextColor={colors.textFaint}
              style={[s.inputField, s.monoText]}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={isPending}
          activeOpacity={0.85}
          style={s.registerBtn}
        >
          {isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={s.registerBtnText}>Đăng Ký & Tiếp Tục</Text>
              <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>Hoặc đăng ký nhanh với</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Google Sign In */}
        <Pressable
          style={s.socialBtn}
          onPress={handleGooglePress}
          disabled={isPending}
        >
          <Text style={[s.socialBtnLabel, { color: '#EA4335' }]}>G</Text>
          <Text style={s.socialText}>Tiếp tục với Google</Text>
        </Pressable>
      </View>

      {/* Login link */}
      <View style={s.loginRow}>
        <Text style={s.loginText}>Đã có tài khoản?</Text>
        <Pressable onPress={() => router.push('/(auth)/login' as any)}>
          <Text style={s.loginLink}>Đăng Nhập Tại Đây</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

// ── Reusable InputRow wrapper ──────────────────────────────────────────────
interface InputRowProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}
function InputRow({ label, icon, children }: InputRowProps) {
  return (
    <View style={s.inputGroup}>
      <Text style={s.inputLabel}>{label}</Text>
      <View style={s.inputWrapper}>
        <View style={s.inputIconWrap}>{icon}</View>
        {children}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
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
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  iconEmoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
    marginBottom: 20,
    gap: 14,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(225, 84, 63, 0.2)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    flex: 1,
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSoft,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  inputIconWrap: {
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.text,
  },
  inputFieldPassword: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.text,
  },
  monoText: {
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  referralGroup: {
    gap: 6,
  },
  referralBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  referralBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryDeep,
  },
  registerBtn: {
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primaryDeep,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 4,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  loginText: {
    fontSize: 14,
    color: colors.textSoft,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
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
    paddingHorizontal: 10,
    fontSize: 12,
    color: colors.textFaint,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
