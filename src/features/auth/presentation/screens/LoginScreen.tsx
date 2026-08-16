import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthFlow } from '../../application/useAuthFlow';
import { AppColors } from '@/src/core/theme/colors';

export const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('student@smartenglish.ai');
  const [password, setPassword] = useState('123456');
  const { login, isPending, isError, error, selectDemoRole } = useAuthFlow();

  const handleLogin = () => {
    login({ email, password });
  };

  return (
    <ScrollView className="flex-1 bg-surface px-6 pt-14">
      {/* Header & Logo */}
      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-primary justify-center items-center mb-3 shadow-lg">
          <Text className="text-4xl text-white font-bold">⚡</Text>
        </View>
        <Text className="text-2xl font-bold text-neutralInk">SmartEnglish AI</Text>
        <Text className="text-sm text-neutralGray mt-1 text-center">
          AI Practice Partner toàn diện cho người học tiếng Anh
        </Text>
      </View>

      {/* Quick Demo Role Selection Cards */}
      <View className="bg-cardWhite p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <Text className="text-xs font-semibold text-neutralGray uppercase tracking-wider mb-3">
          ⚡ Đăng Nhập Nhanh Để Test RBAC (3 Roles)
        </Text>
        <View className="flex-row justify-between gap-2">
          <Pressable
            onPress={() => selectDemoRole('student')}
            className="flex-1 bg-primary/10 border border-primary/30 py-3 rounded-xl items-center active:opacity-80"
          >
            <Text className="text-xs font-bold text-primary">🎓 Học Viên</Text>
            <Text className="text-[10px] text-neutralGray mt-0.5">5 Tabs Full</Text>
          </Pressable>

          <Pressable
            onPress={() => selectDemoRole('teacher')}
            className="flex-1 bg-secondary/10 border border-secondary/30 py-3 rounded-xl items-center active:opacity-80"
          >
            <Text className="text-xs font-bold text-secondary">👩‍🏫 Giáo Viên</Text>
            <Text className="text-[10px] text-neutralGray mt-0.5">Companion</Text>
          </Pressable>

          <Pressable
            onPress={() => selectDemoRole('admin')}
            className="flex-1 bg-gray-100 border border-gray-300 py-3 rounded-xl items-center active:opacity-80"
          >
            <Text className="text-xs font-bold text-neutralInk">🔒 Admin</Text>
            <Text className="text-[10px] text-neutralGray mt-0.5">Blocked</Text>
          </Pressable>
        </View>
      </View>

      {/* Login Form */}
      <View className="bg-cardWhite p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <Text className="text-lg font-bold text-neutralInk mb-4">Đăng Nhập Tài Khoản</Text>

        {isError && (
          <View className="bg-error/10 p-3 rounded-xl mb-4 border border-error/20">
            <Text className="text-xs text-error font-medium">
              {(error as any)?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.'}
            </Text>
          </View>
        )}

        <View className="mb-4">
          <Text className="text-xs font-semibold text-neutralInk mb-1.5">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="nhapemail@domain.com"
            className="bg-surface px-4 py-3 rounded-xl text-neutralInk text-sm border border-gray-200"
          />
        </View>

        <View className="mb-6">
          <Text className="text-xs font-semibold text-neutralInk mb-1.5">Mật Khẩu</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            className="bg-surface px-4 py-3 rounded-xl text-neutralInk text-sm border border-gray-200"
          />
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={isPending}
          className="bg-primary py-3.5 rounded-xl items-center shadow-md active:bg-primaryDark"
        >
          {isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-white font-bold text-base">Đăng Nhập</Text>
          )}
        </Pressable>
      </View>

      {/* Social Login Dividers */}
      <View className="flex-row items-center my-4">
        <View className="flex-1 h-[1px] bg-gray-200" />
        <Text className="px-3 text-xs text-neutralGray font-medium">Hoặc đăng nhập bằng</Text>
        <View className="flex-1 h-[1px] bg-gray-200" />
      </View>

      <View className="flex-row justify-center gap-4 mb-6">
        <Pressable className="w-12 h-12 rounded-full bg-white border border-gray-200 items-center justify-center shadow-sm active:bg-gray-50">
          <Text className="text-lg">Google</Text>
        </Pressable>
        <Pressable className="w-12 h-12 rounded-full bg-white border border-gray-200 items-center justify-center shadow-sm active:bg-gray-50">
          <Text className="text-lg">Apple</Text>
        </Pressable>
        <Pressable className="w-12 h-12 rounded-full bg-white border border-gray-200 items-center justify-center shadow-sm active:bg-gray-50">
          <Text className="text-lg">Zalo</Text>
        </Pressable>
      </View>

      {/* Link to Register */}
      <View className="flex-row justify-center items-center gap-1 mb-12">
        <Text className="text-xs text-neutralGray">Chưa có tài khoản?</Text>
        <Pressable onPress={() => router.push('/(auth)/register' as any)}>
          <Text className="text-xs font-bold text-primary">Đăng Ký Ngay ➔</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
