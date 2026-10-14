import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  User as UserIcon,
  Camera,
  Mail,
  Phone,
  CheckCircle2,
  Sparkles,
  Check,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export const COUNTRY_OPTIONS = [
  { code: 'VN', label: 'Việt Nam 🇻🇳' },
  { code: 'US', label: 'Hoa Kỳ 🇺🇸' },
  { code: 'UK', label: 'Anh 🇬🇧' },
  { code: 'JP', label: 'Nhật Bản 🇯🇵' },
  { code: 'KR', label: 'Hàn Quốc 🇰🇷' },
  { code: 'SG', label: 'Singapore 🇸🇬' },
];

interface ProfileInfoTabProps {
  displayName: string;
  setDisplayName: (val: string) => void;
  username: string;
  setUsername: (val: string) => void;
  email: string;
  phone: string;
  setPhone: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  avatarUrl: string;
  countryCode: string;
  setCountryCode: (val: string) => void;
  isUploadingAvatar: boolean;
  uploadSuccessNote: string | null;
  handlePickAvatar: () => void;
  handleSave: () => void;
  isSaving: boolean;
}

export const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({
  displayName,
  setDisplayName,
  username,
  setUsername,
  email,
  phone,
  setPhone,
  bio,
  setBio,
  avatarUrl,
  countryCode,
  setCountryCode,
  isUploadingAvatar,
  uploadSuccessNote,
  handlePickAvatar,
  handleSave,
  isSaving,
}) => {
  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      {/* Avatar Hero Card */}
      <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm items-center mb-4">
        <View className="relative">
          <Image
            source={{ uri: avatarUrl }}
            className="w-24 h-24 rounded-full border-4 border-[#0D3B73]/20 bg-gray-100"
          />
          {isUploadingAvatar && (
            <View className="absolute inset-0 bg-black/50 rounded-full justify-center items-center">
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}
          <Pressable
            onPress={handlePickAvatar}
            disabled={isUploadingAvatar}
            className="w-8 h-8 rounded-full bg-[#00BCD4] justify-center items-center absolute bottom-0 right-0 border-2 border-white shadow-md active:scale-95"
          >
            <Camera color="#FFFFFF" size={15} />
          </Pressable>
        </View>

        <Pressable
          onPress={handlePickAvatar}
          disabled={isUploadingAvatar}
          className="mt-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200 flex-row items-center gap-1.5"
        >
          <Camera color="#4B5563" size={13} />
          <Text className="text-xs font-semibold text-gray-700">
            {isUploadingAvatar ? 'Đang tải ảnh lên...' : 'Đổi ảnh đại diện'}
          </Text>
        </Pressable>

        {uploadSuccessNote && (
          <View className="mt-2.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex-row items-center gap-1.5">
            <Sparkles color="#059669" size={13} />
            <Text className="text-[11px] font-semibold text-emerald-700">{uploadSuccessNote}</Text>
          </View>
        )}
      </View>

      {/* Basic Info Fields Card */}
      <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
        <View className="flex-row items-center gap-2 mb-4 pb-2 border-b border-gray-100">
          <UserIcon color="#0D3B73" size={18} />
          <Text className="text-sm font-bold text-gray-800">Thông tin cơ bản</Text>
        </View>

        {/* Display Name */}
        <View className="mb-4">
          <View className="flex-row items-center gap-1 mb-1.5">
            <Text className="text-xs font-semibold text-gray-600">Họ và tên / Tên hiển thị</Text>
            <Text className="text-xs font-bold text-red-500">*</Text>
          </View>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Nhập tên hiển thị của bạn"
            placeholderTextColor="#9CA3AF"
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 font-medium"
          />
        </View>

        {/* Username */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-gray-600 mb-1.5">Tên người dùng (Handle định danh)</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-1.5">
            <Text className="text-sm font-bold text-gray-400 mr-1">@</Text>
            <TextInput
              value={username}
              onChangeText={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              className="flex-1 py-1 text-sm text-gray-800 font-medium"
            />
          </View>
        </View>

        {/* Email (Read-only) */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-gray-600 mb-1.5">Địa chỉ Email</Text>
          <View className="flex-row items-center bg-gray-100/70 border border-gray-200 rounded-2xl px-4 py-2.5">
            <Mail color="#9CA3AF" size={16} />
            <Text className="text-sm text-gray-600 font-medium flex-1 ml-2">{email || 'chưa cập nhật'}</Text>
            <View className="bg-emerald-100 px-2 py-0.5 rounded-full flex-row items-center gap-1">
              <CheckCircle2 color="#059669" size={11} />
              <Text className="text-[10px] font-bold text-emerald-700">Đã xác minh</Text>
            </View>
          </View>
        </View>

        {/* Phone */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-gray-600 mb-1.5">Số điện thoại liên hệ</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-1.5">
            <Phone color="#9CA3AF" size={16} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Ví dụ: 0901234567"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              className="flex-1 py-1 ml-2 text-sm text-gray-800 font-medium"
            />
          </View>
        </View>

        {/* Bio */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-gray-600 mb-1.5">Tiểu sử ngắn</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Giới thiệu đôi nét về bản thân hoặc châm ngôn học tiếng Anh..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 font-medium h-20"
          />
        </View>

        {/* Country Selection */}
        <View>
          <Text className="text-xs font-semibold text-gray-600 mb-2">Quốc gia</Text>
          <View className="flex-row flex-wrap gap-2">
            {COUNTRY_OPTIONS.map((item) => {
              const isSelected = countryCode === item.code;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => setCountryCode(item.code)}
                  className={`px-3.5 py-2 rounded-2xl border ${
                    isSelected ? 'bg-[#0D3B73] border-[#0D3B73]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Bottom Action Button */}
      <Pressable
        onPress={handleSave}
        disabled={isSaving || isUploadingAvatar}
        className="bg-[#0D3B73] py-4 rounded-2xl items-center shadow-md active:bg-[#0a2f5c] flex-row justify-center gap-2 mb-8"
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Check color="#FFFFFF" size={18} strokeWidth={3} />
            <Text className="text-sm font-bold text-white">Lưu Thông Tin Hồ Sơ</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};
