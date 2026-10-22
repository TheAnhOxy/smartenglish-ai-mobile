import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  User as UserIcon,
  Target,
  Shield,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/src/core/flows/authStore';
import {
  getProfileApi,
  updateProfileApi,
  uploadAvatarApi,
} from '@/src/features/profile-settings/data/profileApi';
import { ProfileInfoTab } from '../components/ProfileInfoTab';
import { LearningGoalsTab } from '../components/LearningGoalsTab';
import { SecuritySettingsTab } from '../components/SecuritySettingsTab';

type ActiveTab = 'profile' | 'learning' | 'security';

export const EditProfileScreen = () => {
  const router = useRouter();
  const { currentUser, updateCurrentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [, setIsLoading] = useState(true);
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

  // Load fresh profile from backend on mount
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const userId = currentUser?.id ? String(currentUser.id) : undefined;
        if (!userId) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const fresh = await getProfileApi(userId);
        if (isMounted && fresh) {
          if (fresh.role === 'admin' && currentUser?.role && currentUser.role !== 'admin') {
            console.warn('[EditProfileScreen] Bỏ qua dữ liệu admin profile không khớp với học viên');
            return;
          }
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
  }, [currentUser?.id, currentUser?.role]);

  // Pick image and upload
  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Cần cấp quyền', 'Vui lòng cấp quyền truy cập thư viện ảnh để đổi ảnh đại diện');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setAvatarUrl(selectedAsset.uri);

        setIsUploadingAvatar(true);
        setUploadSuccessNote(null);
        try {
          const uploadRes = await uploadAvatarApi(selectedAsset.uri);
          if (uploadRes) {
            setAvatarUrl(uploadRes);
            updateCurrentUser({ avatar_url: uploadRes });
            setUploadSuccessNote('Đã cập nhật ảnh đại diện lên máy chủ!');
            setTimeout(() => setUploadSuccessNote(null), 4000);
          }
        } catch (uploadErr) {
          console.warn('Upload avatar thất bại:', uploadErr);
          Alert.alert('Thông báo', 'Ảnh đại diện đã được lưu tạm trên thiết bị');
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    } catch (err) {
      console.error('Lỗi chọn ảnh:', err);
      setIsUploadingAvatar(false);
    }
  };

  // Submit profile changes
  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Thông báo', 'Họ và tên không được để trống');
      return;
    }

    try {
      setIsSaving(true);
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
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.navigate('/(student)/profile' as any);
            }
          },
        },
      ]);
    } catch (err: any) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      {/* Top Header */}
      <View className="bg-[#0D3B73] pt-8 pb-5 px-4 shadow-lg">
        <View className="w-full max-w-xl mx-auto flex-row justify-between items-center">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.navigate('/(student)/profile' as any);
              }
            }}
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
          {activeTab === 'profile' && (
            <ProfileInfoTab
              displayName={displayName}
              setDisplayName={setDisplayName}
              username={username}
              setUsername={setUsername}
              email={email}
              phone={phone}
              setPhone={setPhone}
              bio={bio}
              setBio={setBio}
              avatarUrl={avatarUrl}
              countryCode={countryCode}
              setCountryCode={setCountryCode}
              isUploadingAvatar={isUploadingAvatar}
              uploadSuccessNote={uploadSuccessNote}
              handlePickAvatar={handlePickAvatar}
              handleSave={handleSave}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'learning' && (
            <LearningGoalsTab
              cefrLevel={cefrLevel}
              setCefrLevel={setCefrLevel}
              targetGoal={targetGoal}
              setTargetGoal={setTargetGoal}
              dailyGoalXp={dailyGoalXp}
              setDailyGoalXp={setDailyGoalXp}
              uiLanguage={uiLanguage}
              setUiLanguage={setUiLanguage}
              handleSave={handleSave}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySettingsTab userId={currentUser?.id} />
          )}
        </View>
      </ScrollView>
    </View>
  );
};
