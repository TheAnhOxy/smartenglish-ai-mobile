import { apiClient } from '@/src/core/api/client';
import { User } from '@/src/core/types/schema';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  username?: string;
  phone?: string;
  cefrLevel?: string;
  targetGoal?: string;
  referralCode?: string;
}

/** Map a backend UserProfileResponseDTO to the mobile User schema */
const mapUserProfile = (userInfo: any, fallbackEmail?: string): User => {
  const ls = userInfo?.learningSettings || {};
  return {
    id: String(userInfo?.id || ''),
    email: userInfo?.email || fallbackEmail || '',
    display_name: userInfo?.displayName || 'Học Viên',
    avatar_url: userInfo?.avatarUrl || null,
    role: ((userInfo?.role || 'STUDENT') as string).toLowerCase() as any,
    plan: ((userInfo?.plan || 'FREE') as string).toLowerCase().replace('_', '') as any,
    cefr_level: ls.cefrLevel || userInfo?.cefrLevel || 'B1',
    target_goal: ls.targetGoal || userInfo?.targetGoal || 'TOEIC 750',
    ui_language: ls.uiLanguage || 'vi',
    timezone: ls.timezone || 'Asia/Ho_Chi_Minh',
    tts_speed: ls.ttsSpeed ? Number(ls.ttsSpeed) : 1.0,
    is_active: userInfo?.isActive !== false,
    is_email_verified: Boolean(userInfo?.isEmailVerified),
    daily_goal_xp: ls.dailyGoalXp || 50,
    onboarding_completed: Boolean(userInfo?.onboardingCompleted),
    created_at: userInfo?.createdAt || new Date().toISOString(),
    updated_at: userInfo?.lastLoginAt || new Date().toISOString()
  };
};

export const loginApi = async (emailOrUsername: string, password_hash: string): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<any>('/api/v1/auth/login', {
      emailOrUsername: emailOrUsername,
      password: password_hash
    });
    const data = response.data?.data || response.data;
    const token = data?.accessToken || data?.access_token;
    if (!token) {
      throw new Error(data?.message || 'Tài khoản hoặc mật khẩu không chính xác');
    }
    return {
      access_token: token,
      refresh_token: data.refreshToken || data.refresh_token || '',
      user: mapUserProfile(data.user, emailOrUsername)
    };
  } catch (err: any) {
    console.warn('Real Auth API login error:', err?.response?.data || err.message);
    throw err;
  }
};

export const registerApi = async (payload: RegisterPayload): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<any>('/api/v1/auth/register', {
      email: payload.email,
      password: payload.password,
      displayName: payload.displayName,
      username: payload.username || payload.email.split('@')[0],
      phone: payload.phone || undefined,
      cefrLevel: payload.cefrLevel || 'B1',
      targetGoal: payload.targetGoal || 'TOEIC 750',
      referralCode: payload.referralCode || undefined
    });
    const data = response.data?.data || response.data;
    // Some register responses return only tokens (no user object) - handle both
    const userFromResponse = data.user || {};
    return {
      access_token: data.accessToken || data.access_token || '',
      refresh_token: data.refreshToken || data.refresh_token || '',
      user: {
        ...mapUserProfile(userFromResponse, payload.email),
        // Override with what we know from the registration payload
        display_name: payload.displayName,
        email: payload.email,
        role: 'student',
        plan: 'free' as any,
        cefr_level: payload.cefrLevel || 'B1',
        target_goal: payload.targetGoal || 'TOEIC 750',
        onboarding_completed: false,
        is_email_verified: false
      }
    };
  } catch (err: any) {
    console.warn('Real Auth API register error:', err?.response?.data || err.message);
    throw err;
  }
};

export const fetchCurrentUserApi = async (userId: string): Promise<{ user: User }> => {
  try {
    const response = await apiClient.get<any>(`/api/v1/users/me?userId=${userId}`);
    const user = response.data?.data || response.data;
    return { user: mapUserProfile(user) };
  } catch (err) {
    console.warn('Fetch current user error:', err);
    throw err;
  }
};
