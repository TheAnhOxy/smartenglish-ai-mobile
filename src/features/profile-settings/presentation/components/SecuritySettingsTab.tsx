import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Shield,
  Smartphone,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { changePasswordApi } from '@/src/features/profile-settings/data/profileApi';

interface SecuritySettingsTabProps {
  userId?: string | number;
}

export const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({ userId }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Field touch states
  const [touched, setTouched] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: 'Chưa nhập', color: '#9CA3AF' };
    if (pwd.length < 6) return { score: 1, text: 'Yếu (< 6 ký tự)', color: '#EF4444' };
    const hasNum = /\d/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = [hasNum, hasUpper, hasSpecial].filter(Boolean).length;
    if (score >= 2 && pwd.length >= 8) return { score: 3, text: 'Mạnh', color: '#10B981' };
    if (score >= 1) return { score: 2, text: 'Trung bình', color: '#F59E0B' };
    return { score: 1, text: 'Yếu', color: '#EF4444' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const errors = {
    oldPassword: !oldPassword.trim() ? 'Vui lòng nhập mật khẩu hiện tại' : null,
    newPassword:
      !newPassword.trim()
        ? 'Vui lòng nhập mật khẩu mới'
        : newPassword.length < 6
        ? 'Mật khẩu mới phải có ít nhất 6 ký tự'
        : null,
    confirmPassword:
      !confirmPassword.trim()
        ? 'Vui lòng xác nhận lại mật khẩu mới'
        : newPassword !== confirmPassword
        ? 'Mật khẩu xác nhận không khớp'
        : null,
  };

  const isFormValid = !errors.oldPassword && !errors.newPassword && !errors.confirmPassword;

  const handleChangePassword = async () => {
    setTouched({
      oldPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    if (!isFormValid) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ và kiểm tra các trường mật khẩu bắt buộc (*)');
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePasswordApi({ oldPassword, newPassword }, userId ? String(userId) : undefined);
      Alert.alert('Thành công', 'Mật khẩu tài khoản đã được thay đổi thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTouched({ oldPassword: false, newPassword: false, confirmPassword: false });
    } catch (err: any) {
      console.error('Lỗi đổi mật khẩu:', err);
      Alert.alert('Lỗi', err.message || 'Mật khẩu hiện tại không chính xác.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      {/* Security Status Overview Card */}
      <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
        <View className="flex-row items-center gap-3 mb-3 pb-3 border-b border-gray-100">
          <View className="w-10 h-10 rounded-2xl bg-emerald-50 justify-center items-center">
            <Shield color="#059669" size={22} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-800">Tài khoản được bảo vệ</Text>
            <Text className="text-xs text-emerald-600 font-medium">Mật khẩu được mã hóa chuẩn Bcrypt an toàn</Text>
          </View>
        </View>

        <View className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Smartphone color="#64748B" size={16} />
            <Text className="text-xs font-semibold text-gray-700">Phiên đăng nhập hiện tại</Text>
          </View>
          <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-emerald-700">Đang hoạt động</Text>
          </View>
        </View>
      </View>

      {/* Change Password Card */}
      <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
        <View className="flex-row items-center gap-2 mb-4 pb-2 border-b border-gray-100">
          <KeyRound color="#0D3B73" size={18} />
          <Text className="text-sm font-bold text-gray-800">Đổi mật khẩu tài khoản</Text>
        </View>

        {/* Old Password */}
        <View className="mb-4">
          <View className="flex-row items-center gap-1 mb-1.5">
            <Text className="text-xs font-semibold text-gray-600">Mật khẩu hiện tại</Text>
            <Text className="text-xs font-bold text-red-500">*</Text>
          </View>
          <View
            className={`flex-row items-center bg-gray-50 border rounded-2xl px-4 py-1.5 ${
              touched.oldPassword && errors.oldPassword ? 'border-red-400 bg-red-50/40' : 'border-gray-200'
            }`}
          >
            <Lock color="#9CA3AF" size={16} />
            <TextInput
              value={oldPassword}
              onChangeText={setOldPassword}
              onBlur={() => setTouched((p) => ({ ...p, oldPassword: true }))}
              placeholder="Nhập mật khẩu hiện tại"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showOldPassword}
              className="flex-1 py-1 ml-2 text-sm text-gray-800 font-medium"
            />
            <Pressable onPress={() => setShowOldPassword(!showOldPassword)} className="p-1">
              {showOldPassword ? <EyeOff color="#6B7280" size={16} /> : <Eye color="#6B7280" size={16} />}
            </Pressable>
          </View>
          {touched.oldPassword && errors.oldPassword && (
            <Text className="text-[11px] text-red-500 mt-1 ml-1 font-medium">{errors.oldPassword}</Text>
          )}
        </View>

        {/* New Password */}
        <View className="mb-2">
          <View className="flex-row items-center gap-1 mb-1.5">
            <Text className="text-xs font-semibold text-gray-600">Mật khẩu mới</Text>
            <Text className="text-xs font-bold text-red-500">*</Text>
          </View>
          <View
            className={`flex-row items-center bg-gray-50 border rounded-2xl px-4 py-1.5 ${
              touched.newPassword && errors.newPassword ? 'border-red-400 bg-red-50/40' : 'border-gray-200'
            }`}
          >
            <Lock color="#9CA3AF" size={16} />
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              onBlur={() => setTouched((p) => ({ ...p, newPassword: true }))}
              placeholder="Tối thiểu 6 ký tự"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showNewPassword}
              className="flex-1 py-1 ml-2 text-sm text-gray-800 font-medium"
            />
            <Pressable onPress={() => setShowNewPassword(!showNewPassword)} className="p-1">
              {showNewPassword ? <EyeOff color="#6B7280" size={16} /> : <Eye color="#6B7280" size={16} />}
            </Pressable>
          </View>
          {touched.newPassword && errors.newPassword && (
            <Text className="text-[11px] text-red-500 mt-1 ml-1 font-medium">{errors.newPassword}</Text>
          )}
        </View>

        {/* Password Strength Indicator */}
        {newPassword.length > 0 && (
          <View className="mb-4 mt-1 flex-row items-center justify-between px-1">
            <View className="flex-row gap-1 flex-1 mr-3">
              <View
                className={`h-1.5 flex-1 rounded-full ${
                  passwordStrength.score >= 1 ? 'bg-red-400' : 'bg-gray-200'
                }`}
              />
              <View
                className={`h-1.5 flex-1 rounded-full ${
                  passwordStrength.score >= 2 ? 'bg-amber-400' : 'bg-gray-200'
                }`}
              />
              <View
                className={`h-1.5 flex-1 rounded-full ${
                  passwordStrength.score >= 3 ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            </View>
            <Text className="text-[11px] font-bold" style={{ color: passwordStrength.color }}>
              {passwordStrength.text}
            </Text>
          </View>
        )}

        {/* Confirm New Password */}
        <View className="mb-5 mt-2">
          <View className="flex-row items-center gap-1 mb-1.5">
            <Text className="text-xs font-semibold text-gray-600">Xác nhận mật khẩu mới</Text>
            <Text className="text-xs font-bold text-red-500">*</Text>
          </View>
          <View
            className={`flex-row items-center bg-gray-50 border rounded-2xl px-4 py-1.5 ${
              touched.confirmPassword && errors.confirmPassword ? 'border-red-400 bg-red-50/40' : 'border-gray-200'
            }`}
          >
            <Lock color="#9CA3AF" size={16} />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showConfirmPassword}
              className="flex-1 py-1 ml-2 text-sm text-gray-800 font-medium"
            />
            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-1">
              {showConfirmPassword ? <EyeOff color="#6B7280" size={16} /> : <Eye color="#6B7280" size={16} />}
            </Pressable>
          </View>
          {touched.confirmPassword && errors.confirmPassword && (
            <Text className="text-[11px] text-red-500 mt-1 ml-1 font-medium">{errors.confirmPassword}</Text>
          )}
        </View>

        {/* Submit Change Password Button */}
        <Pressable
          onPress={handleChangePassword}
          disabled={isChangingPassword}
          className="bg-[#0D3B73] py-3.5 rounded-2xl items-center shadow-md active:bg-[#0a2f5c] flex-row justify-center gap-2"
        >
          {isChangingPassword ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <KeyRound color="#FFFFFF" size={16} />
              <Text className="text-xs font-bold text-white">Cập Nhật Mật Khẩu</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Security Tips Card */}
      <View className="bg-blue-50/60 p-4 rounded-3xl border border-blue-100 mb-8 flex-row gap-3">
        <AlertCircle color="#0284C7" size={18} className="mt-0.5" />
        <View className="flex-1">
          <Text className="text-xs font-bold text-sky-900 mb-1">Mẹo bảo mật tài khoản</Text>
          <Text className="text-[11px] text-sky-800 leading-relaxed font-medium">
            Sử dụng mật khẩu có ít nhất 8 ký tự bao gồm chữ cái, chữ số và ký tự đặc biệt để đảm bảo tài khoản SmartEnglish AI của bạn luôn an toàn.
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};
