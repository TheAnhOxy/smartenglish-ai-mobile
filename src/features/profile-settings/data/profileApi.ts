import { apiClient, getCurrentUserId } from '@/src/core/api/client';
import { User } from '@/src/core/types/schema';

export interface UpdateProfilePayload {
  displayName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  countryCode?: string;
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
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const mapUserProfile = (data: any): Partial<User> => ({
  id: String(data.id || ''),
  email: data.email || '',
  display_name: data.displayName || '',
  avatar_url: data.avatarUrl || null,
  role: ((data.role || 'STUDENT') as string).toLowerCase() as any,
  plan: ((data.plan || 'FREE') as string).toLowerCase() as any,
  cefr_level: data.learningSettings?.cefrLevel || data.cefrLevel || 'B1',
  target_goal: data.learningSettings?.targetGoal || data.targetGoal || '',
  ui_language: data.learningSettings?.uiLanguage || 'vi',
  timezone: data.learningSettings?.timezone || 'Asia/Ho_Chi_Minh',
  tts_speed: data.learningSettings?.ttsSpeed ? Number(data.learningSettings.ttsSpeed) : 1.0,
  is_active: data.isActive !== false,
  is_email_verified: Boolean(data.isEmailVerified),
  daily_goal_xp: data.learningSettings?.dailyGoalXp || 50,
  onboarding_completed: Boolean(data.onboardingCompleted)
});

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
