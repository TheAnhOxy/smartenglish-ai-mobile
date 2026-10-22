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

export interface RegisterResult {
  email: string;
  displayName: string;
  requireOtp: boolean;
  expiresInSec: number;
  message: string;
}

export const registerApi = async (payload: RegisterPayload): Promise<RegisterResult> => {
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
    const res = response.data?.data || response.data;
    return {
      email: res?.email || payload.email,
      displayName: res?.displayName || payload.displayName,
      requireOtp: Boolean(res?.requireOtp ?? true),
      expiresInSec: Number(res?.expiresInSec || 300),
      message: response.data?.message || res?.message || 'Đăng ký tài khoản thành công! Vui lòng xác thực mã OTP.'
    };
  } catch (err: any) {
    console.warn('Real Auth API register error:', err?.response?.data || err.message);
    throw err;
  }
};

export const verifyOtpApi = async (email: string, otpCode: string): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<any>('/api/v1/auth/verify-otp', {
      email: email.trim(),
      otpCode: otpCode.trim()
    });
    const data = response.data?.data || response.data;
    const token = data?.accessToken || data?.access_token;
    if (!token) {
      throw new Error(data?.message || 'Xác thực OTP thất bại');
    }
    return {
      access_token: token,
      refresh_token: data.refreshToken || data.refresh_token || '',
      user: mapUserProfile(data.user, email)
    };
  } catch (err: any) {
    console.warn('Verify OTP error:', err?.response?.data || err.message);
    throw err;
  }
};

export const resendOtpApi = async (email: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post<any>('/api/v1/auth/resend-otp', {
      email: email.trim()
    });
    return {
      message: response.data?.message || 'Mã OTP mới đã được gửi vào email của bạn.'
    };
  } catch (err: any) {
    console.warn('Resend OTP error:', err?.response?.data || err.message);
    throw err;
  }
};

export const googleLoginApi = async (idToken: string): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<any>('/api/v1/auth/google', {
      idToken: idToken.trim()
    });
    const data = response.data?.data || response.data;
    const token = data?.accessToken || data?.access_token;
    if (!token) {
      throw new Error(data?.message || 'Đăng nhập Google không thành công');
    }
    return {
      access_token: token,
      refresh_token: data.refreshToken || data.refresh_token || '',
      user: mapUserProfile(data.user)
    };
  } catch (err: any) {
    console.warn('Google Login error:', err?.response?.data || err.message);
    throw err;
  }
};

export const fetchCurrentUserApi = async (userId?: string): Promise<{ user: User }> => {
  try {
    const response = await apiClient.get<any>('/api/v1/users/me');
    const user = response.data?.data || response.data;
    return { user: mapUserProfile(user) };
  } catch (err) {
    console.warn('Fetch current user error:', err);
    throw err;
  }
};
