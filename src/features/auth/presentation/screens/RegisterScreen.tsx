import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthFlow } from '../../application/useAuthFlow';

export const RegisterScreen = () => {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { register, isPending, isError, error } = useAuthFlow();

  const handleRegister = () => {
    setErrorMessage('');
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin bắt buộc.');
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

    // Call real register API
    register(
      {
        email: email.trim(),
        password: password.trim(),
        displayName: displayName.trim(),
        username: email.trim().split('@')[0],
        phone: phone.trim() || undefined,
        referralCode: referralCode.trim() || undefined,
        cefrLevel: 'B1',
        targetGoal: 'TOEIC 750'
      },
      {
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err.message || 'Đăng ký không thành công, vui lòng kiểm tra lại.';
          setErrorMessage(msg);
        }
      }
    );
  };

  const activeError = errorMessage || (isError ? ((error as any)?.response?.data?.message || 'Email hoặc thông tin đã tồn tại trong hệ thống.') : '');

  return (
    <ScrollView className="flex-1 bg-surface px-6 pt-14">
      {/* Header */}
      <View className="items-center mb-6">
        <View className="w-16 h-16 rounded-full bg-primary justify-center items-center mb-3 shadow-md">
          <Text className="text-3xl text-white font-bold">⚡</Text>
        </View>
        <Text className="text-2xl font-bold text-neutralInk">Tạo Tài Khoản Mới</Text>
        <Text className="text-xs text-neutralGray mt-1 text-center">
          Bắt đầu hành trình chinh phục tiếng Anh cá nhân hóa cùng SmartEnglish
        </Text>
      </View>

      {/* Form */}
      <View className="bg-cardWhite p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        {activeError ? (
          <View className="bg-error/10 p-3 rounded-xl mb-4 border border-error/20">
            <Text className="text-xs text-error font-medium">{activeError}</Text>
          </View>
        ) : null}

        <View className="mb-3">
          <Text className="text-xs font-semibold text-neutralInk mb-1">Họ & Tên Hiển Thị *</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Ví dụ: Nguyễn Văn A"
            className="bg-surface px-4 py-3 rounded-xl text-neutralInk text-sm border border-gray-200"
          />
        </View>

        <View className="mb-3">
          <Text className="text-xs font-semibold text-neutralInk mb-1">Địa Chỉ Email *</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="hocvien@gmail.com"
            className="bg-surface px-4 py-3 rounded-xl text-neutralInk text-sm border border-gray-200"
          />
        </View>

        <View className="mb-3">
          <Text className="text-xs font-semibold text-neutralInk mb-1">Số Điện Thoại (Tùy chọn)</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="0987654321"
            className="bg-surface px-4 py-3 rounded-xl text-neutralInk text-sm border border-gray-200"
          />
        </View>

        <View className="mb-3">
          <Text className="text-xs font-semibold text-neutralInk mb-1">Mật Khẩu *</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            className="bg-surface px-4 py-3 rounded-xl text-neutralInk text-sm border border-gray-200"
          />
        </View>

        <View className="mb-3">
          <Text className="text-xs font-semibold text-neutralInk mb-1">Nhập Lại Mật Khẩu *</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="••••••••"
            className="bg-surface px-4 py-3 rounded-xl text-neutralInk text-sm border border-gray-200"
          />
        </View>

        <View className="mb-5">
          <Text className="text-xs font-semibold text-neutralInk mb-1">Mã Giới Thiệu (Tùy chọn +50 Coins)</Text>
          <TextInput
            value={referralCode}
            onChangeText={(t) => setReferralCode(t.toUpperCase())}
            placeholder="Nhập mã giới thiệu nếu có"
            className="bg-surface px-4 py-3 rounded-xl text-neutralInk text-sm border border-gray-200 uppercase font-mono"
          />
        </View>

        <Pressable
          onPress={handleRegister}
          disabled={isPending}
          className="bg-primary py-3.5 rounded-xl items-center shadow-md active:bg-primaryDark"
        >
          {isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-white font-bold text-base">Đăng Ký & Tiếp Tục ➔</Text>
          )}
        </Pressable>
      </View>

      {/* Already have account */}
      <View className="flex-row justify-center items-center gap-1 mb-10">
        <Text className="text-xs text-neutralGray">Đã có tài khoản?</Text>
        <Pressable onPress={() => router.push('/(auth)/login' as any)}>
          <Text className="text-xs font-bold text-primary">Đăng Nhập Tại Đây</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
