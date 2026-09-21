import { Platform } from 'react-native';
import { apiClient, getCurrentUserId } from '@/src/core/api/client';
import { User } from '@/src/core/types/schema';

export interface UpdateProfilePayload {
  displayName?: string;
  username?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  countryCode?: string;
  cefrLevel?: string;
  targetGoal?: string;
  dailyGoalXp?: number;
  uiLanguage?: string;
}

export interface LearningSettingsPayload {
  cefrLevel?: string;
  targetGoal?: string;
  dailyGoalXp?: number;
  uiLanguage?: string;
  timezone?: string;
  ttsVoice?: string;
  ttsSpeed?: number;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

const mapUserProfile = (data: any): Partial<User> => ({
  id: String(data.id || ''),
  email: data.email || '',
  username: data.username || '',
  phone: data.phone || '',
  bio: data.bio || '',
  country_code: data.countryCode || 'VN',
  display_name: data.displayName || '',
  avatar_url: data.avatarUrl || null,
  role: ((data.role || 'STUDENT') as string).toLowerCase() as any,
  plan: ((data.plan || 'FREE') as string).toLowerCase() as any,
  cefr_level: data.learningSettings?.cefrLevel || data.cefrLevel || 'B1',
  target_goal: data.learningSettings?.targetGoal || data.targetGoal || '',
  ui_language: data.learningSettings?.uiLanguage || data.uiLanguage || 'vi',
  timezone: data.learningSettings?.timezone || data.timezone || 'Asia/Ho_Chi_Minh',
  tts_speed: data.learningSettings?.ttsSpeed ? Number(data.learningSettings.ttsSpeed) : 1.0,
  is_active: data.isActive !== false,
  is_email_verified: Boolean(data.isEmailVerified),
  daily_goal_xp: data.learningSettings?.dailyGoalXp || data.dailyGoalXp || 50,
  onboarding_completed: Boolean(data.onboardingCompleted)
});

/**
 * Tải ảnh đại diện người dùng lên AWS S3 qua Content Service & API Gateway
 * Endpoint: POST /admin/upload/image?folder=avatars
 * Trả về: URL công khai trên AWS S3
 */
export const uploadAvatarApi = async (fileUri: string, fileName?: string, mimeType?: string): Promise<string> => {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const res = await fetch(fileUri);
    const blob = await res.blob();
    const cleanName = fileName || 'avatar.jpg';
    formData.append('file', blob, cleanName);
  } else {
    formData.append('file', {
      uri: fileUri,
      name: fileName || 'avatar.jpg',
      type: mimeType || 'image/jpeg',
    } as any);
  }

  const response = await apiClient.post<any>('/admin/upload/image?folder=avatars', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const resData = response.data?.data || response.data;
  const url = resData?.url;
  if (!url) {
    throw new Error(resData?.message || 'Không nhận được đường dẫn ảnh từ AWS S3');
  }
  return url;
};

/**
 * GET /api/v1/users/me?userId=...
 * Get current user's profile
 */
export const getProfileApi = async (userId?: string): Promise<Partial<User>> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/users/me?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (data) return mapUserProfile(data);
  } catch (err) {
    console.warn('[ProfileAPI] getProfileApi error:', err);
    throw err;
  }
  return {};
};

/**
 * PUT /api/v1/users/me?userId=...
 * Update display name, phone, bio, avatar
 */
export const updateProfileApi = async (payload: UpdateProfilePayload, userId?: string): Promise<Partial<User>> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.put<any>(`/api/v1/users/me?userId=${uid}`, payload);
    const data = response.data?.data || response.data;
    if (data) return mapUserProfile(data);
  } catch (err: any) {
    console.warn('[ProfileAPI] updateProfileApi error:', err?.response?.data || err.message);
    throw err;
  }
  return {};
};

/**
 * PUT /api/v1/users/me/password?userId=...
 * Change password
 */
export const changePasswordApi = async (payload: ChangePasswordPayload, userId?: string): Promise<void> => {
  const uid = userId || getCurrentUserId();
  try {
    await apiClient.put<any>(`/api/v1/users/me/password?userId=${uid}`, payload);
  } catch (err: any) {
    console.warn('[ProfileAPI] changePasswordApi error:', err?.response?.data || err.message);
    throw err;
  }
};

/**
 * GET /api/v1/users/me/learning-settings?userId=...
 * Get learning settings
 */
export const getLearningSettingsApi = async (userId?: string): Promise<LearningSettingsPayload> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/users/me/learning-settings?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (data) {
      return {
        cefrLevel: data.cefrLevel || undefined,
        targetGoal: data.targetGoal || undefined,
        dailyGoalXp: data.dailyGoalXp || undefined,
        uiLanguage: data.uiLanguage || undefined,
        timezone: data.timezone || undefined,
        ttsVoice: data.ttsVoice || undefined,
        ttsSpeed: data.ttsSpeed ? Number(data.ttsSpeed) : undefined
      };
    }
  } catch (err) {
    console.warn('[ProfileAPI] getLearningSettingsApi error:', err);
  }
  return {};
};

/**
 * PUT /api/v1/users/me/learning-settings?userId=...
 * Update learning settings
 */
export const updateLearningSettingsApi = async (payload: LearningSettingsPayload, userId?: string): Promise<LearningSettingsPayload> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.put<any>(`/api/v1/users/me/learning-settings?userId=${uid}`, payload);
    const data = response.data?.data || response.data;
    if (data) return data;
  } catch (err: any) {
    console.warn('[ProfileAPI] updateLearningSettingsApi error:', err?.response?.data || err.message);
    throw err;
  }
  return payload;
};
