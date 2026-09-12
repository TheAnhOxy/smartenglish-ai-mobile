import { apiClient, getCurrentUserId } from '@/src/core/api/client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingPeriod: 'free' | 'monthly' | 'yearly';
  features: string[];
  isPopular?: boolean;
}

export interface SubscriptionStatus {
  userId: string;
  planId: string;
  planName: string;
  status: 'active' | 'expired' | 'free' | 'cancelled';
  startDate: string | null;
  endDate: string | null;
  permissions: string[];
  isPremium: boolean;
}

export interface SubscribeRequest {
  planId: string;
  paymentMethod: string;
  transactionId?: string;
}

/**
 * GET /api/v1/payment/plans
 * Returns all available subscription plans (Free, Premium Monthly, Premium Yearly)
 */
export const fetchSubscriptionPlansApi = async (): Promise<SubscriptionPlan[]> => {
  try {
    const response = await apiClient.get<any>('/api/v1/payment/plans');
    const data = response.data?.data || response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data.map((p: any) => ({
        id: String(p.id || p.planId || 'plan-free'),
        name: p.name || p.planName || 'Free',
        price: Number(p.price || p.priceVnd || 0),
        currency: p.currency || 'VND',
        billingPeriod: (p.billingPeriod || p.period || 'free').toLowerCase() as any,
        features: Array.isArray(p.features) ? p.features : [],
        isPopular: Boolean(p.isPopular || p.recommended)
      }));
    }
  } catch (err) {
    console.warn('[Subscription] fetchSubscriptionPlansApi error:', err);
  }
  // Return minimal fallback so the UI renders
  return [
    {
      id: 'plan-free',
      name: 'Free',
      price: 0,
      currency: 'VND',
      billingPeriod: 'free',
      features: ['Học từ vựng cơ bản', 'Quiz giới hạn 5/ngày', 'Flashcard tối đa 2 bộ'],
    },
    {
      id: 'plan-premium-monthly',
      name: 'Premium Monthly',
      price: 89000,
      currency: 'VND',
      billingPeriod: 'monthly',
      features: ['Tất cả tính năng Free', 'AI Roleplay không giới hạn', 'Quét ảnh không giới hạn', 'Bài kiểm tra TOEIC/IELTS'],
      isPopular: true,
    },
    {
      id: 'plan-premium-yearly',
      name: 'Premium Yearly',
      price: 799000,
      currency: 'VND',
      billingPeriod: 'yearly',
      features: ['Tất cả tính năng Premium', 'Tiết kiệm 25%', 'Ưu tiên hỗ trợ'],
    },
  ];
};

/**
 * GET /api/v1/payment/subscriptions/status
 * Returns the current user's subscription status
 */
export const fetchSubscriptionStatusApi = async (userId?: string): Promise<SubscriptionStatus> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/payment/subscriptions/status?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (data) {
      return {
        userId: String(data.userId || uid),
        planId: data.planId || 'plan-free',
        planName: data.planName || 'Free',
        status: (data.status || 'free').toLowerCase() as any,
        startDate: data.startDate || null,
        endDate: data.endDate || data.expiresAt || null,
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
        isPremium: Boolean(data.isPremium || data.status === 'active')
      };
    }
  } catch (err) {
    console.warn('[Subscription] fetchSubscriptionStatusApi error:', err);
  }
  return {
    userId: String(uid),
    planId: 'plan-free',
    planName: 'Free',
    status: 'free',
    startDate: null,
    endDate: null,
    permissions: [],
    isPremium: false
  };
};

/**
 * POST /api/v1/payment/subscriptions/subscribe
 * Subscribes the user to a premium plan
 */
export const subscribeToPlanApi = async (request: SubscribeRequest, userId?: string): Promise<SubscriptionStatus> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(`/api/v1/payment/subscriptions/subscribe?userId=${uid}`, request);
    const data = response.data?.data || response.data;
    if (data) {
      return {
        userId: String(data.userId || uid),
        planId: data.planId || request.planId,
        planName: data.planName || 'Premium',
        status: (data.status || 'active') as any,
        startDate: data.startDate || new Date().toISOString(),
        endDate: data.endDate || data.expiresAt || null,
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
        isPremium: true
      };
    }
  } catch (err: any) {
    console.warn('[Subscription] subscribeToPlanApi error:', err?.response?.data || err.message);
    throw err;
  }
  throw new Error('Subscription response was empty');
};
