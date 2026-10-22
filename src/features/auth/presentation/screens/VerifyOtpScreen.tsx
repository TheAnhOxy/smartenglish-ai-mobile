import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthFlow } from '../../application/useAuthFlow';
import { colors } from '@/src/theme/colors';
import { ShieldCheck, Mail, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react-native';

export const VerifyOtpScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email || '').trim();

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>('');
  const [resendSuccess, setResendSuccess] = useState<string>('');

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const { verifyOtp, resendOtp, isPending, isResendingOtp } = useAuthFlow();

  // Timer đếm ngược 60s cho phép gửi lại mã
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDigitChange = (value: string, index: number) => {
    setLocalError('');
    setResendSuccess('');

    // Nếu người dùng paste chuỗi 6 ký tự
    if (value.length > 1) {
      const cleaned = value.replace(/[^0-9]/g, '').slice(0, 6);
      if (cleaned.length > 0) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < cleaned.length; i++) {
          nextDigits[i] = cleaned[i];
        }
        setOtpDigits(nextDigits);
        const nextFocus = Math.min(cleaned.length, 5);
        inputRefs.current[nextFocus]?.focus();

        if (cleaned.length === 6) {
          submitOtp(cleaned);
        }
      }
      return;
    }

    const digit = value.replace(/[^0-9]/g, '');
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = nextDigits.join('');
    if (fullCode.length === 6) {
      submitOtp(fullCode);
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const nextDigits = [...otpDigits];
        nextDigits[index - 1] = '';
        setOtpDigits(nextDigits);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const submitOtp = (code: string) => {
    if (!email) {
      setLocalError('Không tìm thấy thông tin email cần xác thực.');
      return;
    }
    if (code.length !== 6) {
      setLocalError('Vui lòng nhập đầy đủ 6 chữ số mã OTP.');
      return;
    }

    setLocalError('');
    verifyOtp(
      { email, otpCode: code },
      {
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.';
          setLocalError(msg);
        },
      }
    );
  };

  const handleResend = () => {
    if (!canResend || !email || isResendingOtp) return;
    setLocalError('');
    setResendSuccess('');

    resendOtp(email, {
      onSuccess: () => {
        setResendSuccess('Mã OTP mới đã được gửi vào hộp thư của bạn!');
        setCountdown(60);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Không thể gửi lại mã lúc này. Vui lòng thử lại sau.';
        setLocalError(msg);
      },
    });
  };

  const safeTop = (insets.top || 16) + 12;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.contentContainer, { paddingTop: safeTop }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Nút quay lại */}
      <TouchableOpacity
        style={s.backBtn}
        onPress={() => router.replace('/(auth)/login' as any)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ArrowLeft color={colors.text} size={22} strokeWidth={2} />
        <Text style={s.backText}>Đăng nhập</Text>
      </TouchableOpacity>

      {/* Header icon */}
      <View style={s.header}>
        <View style={s.iconCircle}>
          <ShieldCheck color={colors.primary} size={36} strokeWidth={2.2} />
        </View>
        <Text style={s.title}>Xác Thực Email</Text>
        <Text style={s.subtitle}>
          Mã xác thực bảo mật gồm 6 chữ số đã được gửi tới hộp thư:
        </Text>
        <View style={s.emailPill}>
          <Mail color={colors.primaryMid} size={15} strokeWidth={2} style={{ marginRight: 6 }} />
          <Text style={s.emailText} numberOfLines={1}>
            {email || 'chưa xác định email'}
          </Text>
        </View>
      </View>

      {/* Form Card */}
      <View style={s.card}>
        {/* Error Alert */}
        {localError ? (
          <View style={s.errorBox}>
            <AlertCircle color={colors.danger || '#EF4444'} size={18} strokeWidth={2} />
            <Text style={s.errorText}>{localError}</Text>
          </View>
        ) : null}

        {/* Success Alert */}
        {resendSuccess ? (
          <View style={s.successBox}>
            <CheckCircle2 color={colors.success || '#10B981'} size={18} strokeWidth={2} />
            <Text style={s.successText}>{resendSuccess}</Text>
          </View>
        ) : null}

        <Text style={s.inputLabel}>Nhập mã OTP 6 số:</Text>

        {/* 6 Ô nhập OTP */}
        <View style={s.otpRow}>
          {otpDigits.map((digit, index) => {
            const isFilled = digit.length > 0;
            return (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(val) => handleDigitChange(val, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={6} // Hỗ trợ paste chuỗi
                selectTextOnFocus
                style={[
                  s.otpBox,
                  isFilled && s.otpBoxFilled,
                  localError ? s.otpBoxError : null,
                ]}
              />
            );
          })}
        </View>

        {/* Nút Xác thực */}
        <TouchableOpacity
          style={[s.submitBtn, isPending && s.btnDisabled]}
          onPress={() => submitOtp(otpDigits.join(''))}
          disabled={isPending}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={s.submitBtnText}>Xác Nhận & Đăng Nhập</Text>
          )}
        </TouchableOpacity>

        {/* Khu vực Gửi lại mã & Đếm ngược */}
        <View style={s.resendContainer}>
          <Text style={s.resendHint}>Chưa nhận được mã xác thực?</Text>
          {canResend ? (
            <TouchableOpacity
              style={s.resendBtn}
              onPress={handleResend}
              disabled={isResendingOtp}
            >
              {isResendingOtp ? (
                <ActivityIndicator color={colors.secondaryDeep} size="small" />
              ) : (
                <View style={s.resendRow}>
                  <RefreshCw color={colors.secondaryDeep} size={15} strokeWidth={2} />
                  <Text style={s.resendBtnText}>Gửi lại mã OTP</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={s.countdownText}>
              Gửi lại sau <Text style={s.countdownHighlight}>{countdown}s</Text>
            </Text>
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginLeft: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emailText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger || '#EF4444',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 13,
    color: colors.success || '#10B981',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 14,
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  otpBoxError: {
    borderColor: colors.danger || '#EF4444',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  resendHint: {
    fontSize: 13,
    color: colors.textSoft,
    marginBottom: 8,
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendBtnText: {
    fontSize: 14,
    color: colors.secondaryDeep,
    fontWeight: '700',
    marginLeft: 6,
  },
  countdownText: {
    fontSize: 13,
    color: colors.textFaint,
    fontWeight: '500',
  },
  countdownHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
});
