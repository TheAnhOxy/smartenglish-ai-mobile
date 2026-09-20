import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Check,
  User as UserIcon,
  Mail,
  Phone,
  Globe,
  Target,
  Zap,
  Sparkles,
  Shield,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  SlidersHorizontal,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/src/core/flows/authStore';
import {
  getProfileApi,
  updateProfileApi,
  uploadAvatarApi,
  changePasswordApi,
} from '@/src/features/profile-settings/data/profileApi';

const CEFR_LEVELS = [
  { level: 'A1', title: 'Mới bắt đầu' },
  { level: 'A2', title: 'Sơ cấp' },
  { level: 'B1', title: 'Trung cấp' },
  { level: 'B2', title: 'Trung cao cấp' },
  { level: 'C1', title: 'Cao cấp' },
  { level: 'C2', title: 'Thành thạo' },
];

const TARGET_GOALS = [
  'Giao tiếp tự tin',
  'IELTS 6.5+',
  'TOEIC 750+',
  'Phỏng vấn xin việc',
  'Du học & Định cư',
  'Tiếng Anh du lịch',
];

const DAILY_XP_OPTIONS = [
  { xp: 10, label: '10 XP', desc: 'Nhẹ nhàng' },
  { xp: 20, label: '20 XP', desc: 'Vừa sức' },
  { xp: 30, label: '30 XP', desc: 'Chuẩn' },
  { xp: 50, label: '50 XP', desc: 'Nghiêm túc' },
  { xp: 100, label: '100 XP', desc: 'Siêu cao thủ' },
];

const COUNTRY_OPTIONS = [
  { code: 'VN', label: 'Việt Nam 🇻🇳' },
  { code: 'US', label: 'Hoa Kỳ 🇺🇸' },
  { code: 'UK', label: 'Anh 🇬🇧' },
  { code: 'JP', label: 'Nhật Bản 🇯🇵' },
  { code: 'KR', label: 'Hàn Quốc 🇰🇷' },
  { code: 'SG', label: 'Singapore 🇸🇬' },
];

type ActiveTab = 'profile' | 'learning' | 'security';

export const EditProfileScreen = () => {
  const router = useRouter();
  const { currentUser, updateCurrentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadSuccessNote, setUploadSuccessNote] = useState<string | null>(null);

  // Form Fields State
  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
  );
  const [countryCode, setCountryCode] = useState(currentUser?.country_code || 'VN');
  const [cefrLevel, setCefrLevel] = useState(currentUser?.cefr_level || 'B1');
  const [targetGoal, setTargetGoal] = useState(currentUser?.target_goal || 'Giao tiếp tự tin');
  const [dailyGoalXp, setDailyGoalXp] = useState<number>(currentUser?.daily_goal_xp || 50);
  const [uiLanguage, setUiLanguage] = useState(currentUser?.ui_language || 'vi');

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load fresh profile from backend on mount
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const userId = currentUser?.id ? String(currentUser.id) : '1';
        const fresh = await getProfileApi(userId);
        if (isMounted && fresh) {
          if (fresh.display_name) setDisplayName(fresh.display_name);
          if (fresh.username) setUsername(fresh.username);
          if (fresh.phone) setPhone(fresh.phone);
          if (fresh.bio) setBio(fresh.bio);
          if (fresh.avatar_url) setAvatarUrl(fresh.avatar_url);
          if (fresh.country_code) setCountryCode(fresh.country_code);
          if (fresh.cefr_level) setCefrLevel(fresh.cefr_level);
          if (fresh.target_goal) setTargetGoal(fresh.target_goal);
          if (fresh.daily_goal_xp) setDailyGoalXp(fresh.daily_goal_xp);
          if (fresh.ui_language) setUiLanguage(fresh.ui_language);
        }
      } catch (e) {
        console.warn('Could not load latest profile:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Pick image and upload
  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền mở thư viện ảnh để thay đổi ảnh đại diện.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsUploadingAvatar(true);
        setUploadSuccessNote(null);

        const s3Url = await uploadAvatarApi(asset.uri, asset.fileName || 'avatar.jpg', asset.mimeType || 'image/jpeg');
        setAvatarUrl(s3Url);
        setUploadSuccessNote('Đã cập nhật ảnh đại diện thành công');
      }
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh:', err);
      Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save profile changes
  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên hiển thị');
      return;
    }

    setIsSaving(true);
    try {
      const userId = currentUser?.id ? String(currentUser.id) : '1';
      const updated = await updateProfileApi(
        {
          displayName: displayName.trim(),
          username: username.trim() || undefined,
          phone: phone.trim() || undefined,
          bio: bio.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
          countryCode: countryCode || 'VN',
          cefrLevel,
          targetGoal: targetGoal.trim() || undefined,
          dailyGoalXp,
          uiLanguage,
        },
        userId
      );

      // Synchronize in local Zustand store
      updateCurrentUser({
        display_name: displayName.trim(),
        username: username.trim() || undefined,
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        country_code: countryCode || 'VN',
        cefr_level: cefrLevel,
        target_goal: targetGoal.trim() || undefined,
        daily_goal_xp: dailyGoalXp,
        ui_language: uiLanguage,
        ...updated,
      });

      Alert.alert('Thành công', 'Hồ sơ cá nhân và ảnh đại diện đã được cập nhật thành công!', [
        {
          text: 'Đồng ý',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  // Change password handler
  const handleChangePassword = async () => {
    if (!oldPassword.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Thông báo', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp với mật khẩu mới');
      return;
    }

    setIsChangingPassword(true);
    try {
      const userId = currentUser?.id ? String(currentUser.id) : '1';
      await changePasswordApi(
        {
          oldPassword: oldPassword.trim(),
          newPassword: newPassword.trim(),
        },
        userId
      );

      Alert.alert('Thành công', 'Mật khẩu của bạn đã được thay đổi thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Lỗi đổi mật khẩu:', err);
      Alert.alert('Không thể đổi mật khẩu', err.message || 'Mật khẩu hiện tại không chính xác.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Password Strength Calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: '#9CA3AF' };
    if (pass.length < 6) return { score: 1, text: 'Yếu', color: '#EF4444' };
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pass);
    if (pass.length >= 8 && hasLetters && hasNumbers && hasSpecial) {
      return { score: 3, text: 'Rất mạnh', color: '#10B981' };
    }
    if (pass.length >= 6 && hasLetters && hasNumbers) {
      return { score: 2, text: 'Trung bình', color: '#F59E0B' };
    }
    return { score: 1, text: 'Yếu', color: '#EF4444' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F8FAF9] justify-center items-center">
        <ActivityIndicator size="large" color="#0D3B73" />
        <Text className="mt-3 text-sm font-semibold text-gray-600">Đang tải hồ sơ của bạn...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      {/* Top Header */}
      <View className="bg-[#0D3B73] pt-12 pb-5 px-4 shadow-lg">
        <View className="w-full max-w-xl mx-auto flex-row justify-between items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white/15 justify-center items-center border border-white/20 active:bg-white/25"
          >
            <ArrowLeft color="#FFFFFF" size={20} />
          </Pressable>

          <View className="items-center">
            <Text className="text-lg font-extrabold text-white tracking-tight">Hồ sơ của tôi</Text>
            <Text className="text-[11px] text-blue-200 font-medium">Quản lý tài khoản & Thiết lập</Text>
          </View>

          {activeTab !== 'security' ? (
            <Pressable
              onPress={handleSave}
              disabled={isSaving || isUploadingAvatar}
              className="bg-[#00BCD4] px-4 py-2 rounded-2xl flex-row items-center gap-1.5 active:bg-[#00acc1] shadow-sm"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check color="#FFFFFF" size={16} strokeWidth={3} />
                  <Text className="text-xs font-bold text-white">Lưu</Text>
                </>
              )}
            </Pressable>
          ) : (
            <View className="w-10" />
          )}
        </View>

        {/* 3-Pill Segmented Control Switcher */}
        <View className="w-full max-w-xl mx-auto mt-4 bg-white/10 p-1 rounded-2xl flex-row border border-white/15">
          <Pressable
            onPress={() => setActiveTab('profile')}
            className={`flex-1 py-2 rounded-xl flex-row justify-center items-center gap-1.5 ${
              activeTab === 'profile' ? 'bg-white shadow-sm' : 'bg-transparent'
            }`}
          >
            <UserIcon color={activeTab === 'profile' ? '#0D3B73' : '#E2E8F0'} size={15} />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'profile' ? 'text-[#0D3B73]' : 'text-gray-300'
              }`}
            >
              Thông tin
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('learning')}
            className={`flex-1 py-2 rounded-xl flex-row justify-center items-center gap-1.5 ${
              activeTab === 'learning' ? 'bg-white shadow-sm' : 'bg-transparent'
            }`}
          >
            <Target color={activeTab === 'learning' ? '#0D3B73' : '#E2E8F0'} size={15} />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'learning' ? 'text-[#0D3B73]' : 'text-gray-300'
              }`}
            >
              Học tập
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('security')}
            className={`flex-1 py-2 rounded-xl flex-row justify-center items-center gap-1.5 ${
              activeTab === 'security' ? 'bg-white shadow-sm' : 'bg-transparent'
            }`}
          >
            <Shield color={activeTab === 'security' ? '#0D3B73' : '#E2E8F0'} size={15} />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'security' ? 'text-[#0D3B73]' : 'text-gray-300'
              }`}
            >
              Bảo mật
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Responsive Body */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-xl mx-auto">
          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === 'profile' && (
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
                  <Text className="text-xs font-semibold text-gray-600 mb-1.5">Họ và tên / Tên hiển thị *</Text>
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
                  <Text className="text-xs font-semibold text-gray-600 mb-1.5">Số điện thoại</Text>
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
          )}

          {/* TAB 2: LỘ TRÌNH & THIẾT LẬP HỌC TẬP */}
          {activeTab === 'learning' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              {/* CEFR Level Card */}
              <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
                <View className="flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <Target color="#0284C7" size={18} />
                  <Text className="text-sm font-bold text-gray-800">Trình độ CEFR hiện tại</Text>
                </View>

                <View className="flex-row flex-wrap gap-2.5">
                  {CEFR_LEVELS.map((item) => {
                    const isSelected = cefrLevel.toUpperCase() === item.level;
                    return (
                      <Pressable
                        key={item.level}
                        onPress={() => setCefrLevel(item.level)}
                        className={`w-[31%] py-3 px-2 rounded-2xl border items-center ${
                          isSelected
                            ? 'bg-[#0284C7] border-[#0284C7] shadow-sm'
                            : 'bg-gray-50 border-gray-200 active:bg-gray-100'
                        }`}
                      >
                        <Text className={`text-base font-extrabold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                          {item.level}
                        </Text>
                        <Text className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-sky-100' : 'text-gray-500'}`}>
                          {item.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Target Goal Card */}
              <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
                <View className="flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <BookOpen color="#0EA5E9" size={18} />
                  <Text className="text-sm font-bold text-gray-800">Mục tiêu học tập</Text>
                </View>

                <View className="flex-row flex-wrap gap-2 mb-3">
                  {TARGET_GOALS.map((goal) => {
                    const isSelected = targetGoal === goal;
                    return (
                      <Pressable
                        key={goal}
                        onPress={() => setTargetGoal(goal)}
                        className={`px-3.5 py-2 rounded-full border ${
                          isSelected ? 'bg-[#00BCD4] border-[#00BCD4]' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                          {goal}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TextInput
                  value={targetGoal}
                  onChangeText={setTargetGoal}
                  placeholder="Hoặc nhập mục tiêu riêng của bạn..."
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 font-medium"
                />
              </View>

              {/* Daily XP Goal */}
              <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
                <View className="flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <Zap color="#F59E0B" size={18} fill="#F59E0B" />
                  <Text className="text-sm font-bold text-gray-800">Mục tiêu XP mỗi ngày</Text>
                </View>

                <View className="gap-2.5">
                  {DAILY_XP_OPTIONS.map((item) => {
                    const isSelected = dailyGoalXp === item.xp;
                    return (
                      <Pressable
                        key={item.xp}
                        onPress={() => setDailyGoalXp(item.xp)}
                        className={`p-3.5 rounded-2xl border flex-row justify-between items-center ${
                          isSelected ? 'bg-amber-50 border-amber-400' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <View className="flex-row items-center gap-2">
                          <View
                            className={`w-7 h-7 rounded-xl justify-center items-center ${
                              isSelected ? 'bg-amber-500' : 'bg-gray-200'
                            }`}
                          >
                            <Zap color={isSelected ? '#FFFFFF' : '#6B7280'} size={14} />
                          </View>
                          <Text className={`text-sm font-bold ${isSelected ? 'text-amber-900' : 'text-gray-800'}`}>
                            {item.label}
                          </Text>
                          <Text className="text-xs text-gray-500 font-medium">({item.desc})</Text>
                        </View>
                        {isSelected && <Check color="#D97706" size={18} strokeWidth={3} />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Language Selection */}
              <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
                <View className="flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <Globe color="#10B981" size={18} />
                  <Text className="text-sm font-bold text-gray-800">Ngôn ngữ ứng dụng</Text>
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setUiLanguage('vi')}
                    className={`flex-1 py-3 rounded-2xl border items-center ${
                      uiLanguage === 'vi' ? 'bg-[#0D3B73] border-[#0D3B73]' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${uiLanguage === 'vi' ? 'text-white' : 'text-gray-800'}`}>
                      Tiếng Việt 🇻🇳
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setUiLanguage('en')}
                    className={`flex-1 py-3 rounded-2xl border items-center ${
                      uiLanguage === 'en' ? 'bg-[#0D3B73] border-[#0D3B73]' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${uiLanguage === 'en' ? 'text-white' : 'text-gray-800'}`}>
                      English 🇬🇧
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Bottom Save Button */}
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
                    <Text className="text-sm font-bold text-white">Lưu Thiết Lập Học Tập</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>
          )}

          {/* TAB 3: BẢO MẬT & ĐỔI MẬT KHẨU */}
          {activeTab === 'security' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              {/* Security Status Overview Card */}
              <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
                <View className="flex-row items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                  <View className="w-10 h-10 rounded-2xl bg-emerald-50 justify-center items-center">
                    <Shield color="#059669" size={22} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-800">Tài khoản được bảo vệ</Text>
                    <Text className="text-xs text-emerald-600 font-medium">Mật khẩu được mã hóa chuẩn Bcrypt</Text>
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
                  <Text className="text-xs font-semibold text-gray-600 mb-1.5">Mật khẩu hiện tại *</Text>
                  <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-1.5">
                    <Lock color="#9CA3AF" size={16} />
                    <TextInput
                      value={oldPassword}
                      onChangeText={setOldPassword}
                      placeholder="Nhập mật khẩu hiện tại"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showOldPassword}
                      className="flex-1 py-1 ml-2 text-sm text-gray-800 font-medium"
                    />
                    <Pressable onPress={() => setShowOldPassword(!showOldPassword)} className="p-1">
                      {showOldPassword ? <EyeOff color="#6B7280" size={16} /> : <Eye color="#6B7280" size={16} />}
                    </Pressable>
                  </View>
                </View>

                {/* New Password */}
                <View className="mb-2">
                  <Text className="text-xs font-semibold text-gray-600 mb-1.5">Mật khẩu mới *</Text>
                  <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-1.5">
                    <Lock color="#9CA3AF" size={16} />
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Tối thiểu 6 ký tự"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showNewPassword}
                      className="flex-1 py-1 ml-2 text-sm text-gray-800 font-medium"
                    />
                    <Pressable onPress={() => setShowNewPassword(!showNewPassword)} className="p-1">
                      {showNewPassword ? <EyeOff color="#6B7280" size={16} /> : <Eye color="#6B7280" size={16} />}
                    </Pressable>
                  </View>
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
                  <Text className="text-xs font-semibold text-gray-600 mb-1.5">Xác nhận mật khẩu mới *</Text>
                  <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-1.5">
                    <Lock color="#9CA3AF" size={16} />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Nhập lại mật khẩu mới"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showConfirmPassword}
                      className="flex-1 py-1 ml-2 text-sm text-gray-800 font-medium"
                    />
                    <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-1">
                      {showConfirmPassword ? <EyeOff color="#6B7280" size={16} /> : <Eye color="#6B7280" size={16} />}
                    </Pressable>
                  </View>
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <Text className="text-[11px] text-red-500 mt-1 ml-1 font-medium">Mật khẩu xác nhận chưa khớp</Text>
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
          )}
        </View>
      </ScrollView>
    </View>
  );
};
