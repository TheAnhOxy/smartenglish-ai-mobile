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

export interface PlanFeature {
  key: string;
  label: string;
  enabled: boolean;
}

export interface PlanQuotas {
  chat: number;        // e.g. 15 vs 9999
  speaking: number;    // e.g. 10 vs 9999
  writing: number;     // e.g. 2 vs 9999
  scan: number;        // e.g. 5 vs 9999
  maxClasses: number;  // e.g. 3 vs 9999
}

export interface StudentSubscriptionPlan {
  id: string;
  name: string;
  badge?: string;
  priceMonthly: number;
  priceYearly: number;
  durationMonths: number;
  isPopular: boolean;
  isActive: boolean;
  quotas: PlanQuotas;
  features: PlanFeature[];
}

/**
 * Lấy danh sách cấu hình Gói Học Viên thật từ Admin / Backend Payment Service
 */
export const fetchStudentPlansApi = async (): Promise<StudentSubscriptionPlan[]> => {
  try {
    const response = await apiClient.get<any>('/api/v1/payment/admin/plans');
    const data = response.data?.data || response.data;
    if (data?.studentPlans && Array.isArray(data.studentPlans) && data.studentPlans.length > 0) {
      return data.studentPlans.map((p: any) => ({
        id: String(p.id),
        name: String(p.name || ''),
        badge: p.badge ? String(p.badge) : undefined,
        priceMonthly: Number(p.priceMonthly || 0),
        priceYearly: Number(p.priceYearly || 0),
        durationMonths: Number(p.durationMonths ?? 0),
        isPopular: Boolean(p.isPopular),
        isActive: p.isActive !== false,
        quotas: {
          chat: Number(p.dailyAiChat ?? 15),
          speaking: Number(p.dailyAiSpeaking ?? 10),
          writing: Number(p.weeklyAiWriting ?? 2),
          scan: Number(p.dailyAiScan ?? 5),
          maxClasses: Number(p.maxClasses ?? 3),
        },
        features: Array.isArray(p.features)
          ? p.features.map((f: any) => ({
              key: String(f.key || ''),
              label: String(f.label || ''),
              enabled: Boolean(f.enabled),
            }))
          : [],
      }));
    }
  } catch (err) {
    console.warn('[Subscription] fetchStudentPlansApi error, using synced fallback:', err);
  }

  // Cấu hình chuẩn đồng bộ 100% với cấu hình Admin trong Database
  return [
    {
      id: 'S-PLAN-FREE',
      name: 'Học Viên Miễn Phí',
      badge: 'Cơ bản',
      priceMonthly: 0,
      priceYearly: 0,
      durationMonths: 0,
      isPopular: false,
      isActive: true,
      quotas: {
        chat: 15,
        speaking: 10,
        writing: 2,
        scan: 5,
        maxClasses: 3,
      },
      features: [
        { key: 'toeic_exam', label: 'Làm đề thi TOEIC & Mock Test miễn phí', enabled: true },
        { key: 'flashcard_srs', label: 'Học từ vựng Flashcard SRS không giới hạn từ', enabled: true },
      ],
    },
    {
      id: 'S-PLAN-MONTHLY',
      name: 'Học Viên Premium Tháng',
      badge: 'Linh hoạt',
      priceMonthly: 199000,
      priceYearly: 0,
      durationMonths: 1,
      isPopular: false,
      isActive: true,
      quotas: {
        chat: 9999,
        speaking: 9999,
        writing: 9999,
        scan: 9999,
        maxClasses: 9999,
      },
      features: [
        { key: 'toeic_exam', label: 'Kho đề thi TOEIC & Mock Test đầy đủ mới nhất', enabled: true },
        { key: 'flashcard_srs', label: 'Toàn bộ từ vựng cơ bản & IELTS 8.0 chuyên sâu', enabled: true },
        { key: 'class_membership', label: 'Tham gia lớp học của giáo viên không giới hạn', enabled: true },
        { key: 'ai_chat', label: 'AI Chat hội thoại thông minh không giới hạn', enabled: true },
        { key: 'ai_speaking', label: 'Luyện phát âm AI & phân tích ngữ điệu không giới hạn', enabled: true },
        { key: 'ai_writing', label: 'Chấm viết luận AI & viết lại bài mẫu Band 8.0+', enabled: true },
        { key: 'ai_scan', label: 'Quét ảnh giải bài tập AI không giới hạn', enabled: true },
        { key: 'exam_ai_explainer', label: 'AI phân tích bẫy đề & giải thích câu sai chi tiết', enabled: true },
        { key: 'no_ads', label: '100% Không có quảng cáo làm phiền', enabled: true },
      ],
    },
    {
      id: 'S-PLAN-YEARLY',
      name: 'Học Viên Premium Năm',
      badge: 'Khuyên dùng 🔥',
      priceMonthly: 0,
      priceYearly: 1490000,
      durationMonths: 12,
      isPopular: true,
      isActive: true,
      quotas: {
        chat: 9999,
        speaking: 9999,
        writing: 9999,
        scan: 9999,
        maxClasses: 9999,
      },
      features: [
        { key: 'toeic_exam', label: 'Toàn bộ quyền lợi gói Premium Tháng', enabled: true },
        { key: 'flashcard_srs', label: 'Mở khóa toàn bộ từ vựng chuyên ngành độc quyền', enabled: true },
        { key: 'class_membership', label: 'Tham gia lớp học không giới hạn', enabled: true },
        { key: 'ai_chat', label: 'Ưu tiên tốc độ phản hồi từ AI Model cao cấp nhất', enabled: true },
        { key: 'ai_speaking', label: 'Báo cáo điểm chuẩn CEFR chi tiết sau mỗi tháng', enabled: true },
        { key: 'ai_writing', label: 'Chấm viết luận không giới hạn + gợi ý phát triển ý', enabled: true },
        { key: 'exam_ai_explainer', label: 'AI cố vấn giải thích bẫy đề TOEIC 1-1', enabled: true },
        { key: 'no_ads', label: '100% Không có quảng cáo làm phiền', enabled: true },
      ],
    },
    {
      id: 'S-PLAN-LIFETIME',
      name: 'Học Viên Trọn Đời (Lifetime)',
      badge: 'Vĩnh viễn',
      priceMonthly: 0,
      priceYearly: 3990000,
      durationMonths: 999,
      isPopular: false,
      isActive: true,
      quotas: {
        chat: 9999,
        speaking: 9999,
        writing: 9999,
        scan: 9999,
        maxClasses: 9999,
      },
      features: [
        { key: 'daily_lessons', label: 'Sở hữu vĩnh viễn toàn bộ tính năng và khóa học mới', enabled: true },
        { key: 'quiz_practice', label: 'Cập nhật kho đề thi mới liên tục trọn đời', enabled: true },
        { key: 'ai_chat', label: 'Không giới hạn băng thông và tính năng AI', enabled: true },
        { key: 'speaking_score', label: 'Chấm điểm Speaking & Writing cao cấp trọn đời', enabled: true },
        { key: 'writing_fix', label: 'Tư vấn lộ trình học 1-1 định kỳ', enabled: true },
        { key: 'no_ads', label: '100% Không có quảng cáo làm phiền', enabled: true },
      ],
    },
  ];
};

/**
 * GET /api/v1/payment/plans (legacy compatibility)
 */
export const fetchSubscriptionPlansApi = async (): Promise<SubscriptionPlan[]> => {
  const plans = await fetchStudentPlansApi();
  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.priceYearly > 0 ? p.priceYearly : p.priceMonthly,
    currency: 'VND',
    billingPeriod: p.durationMonths === 0 ? 'free' : p.durationMonths >= 12 ? 'yearly' : 'monthly',
    features: p.features.filter((f) => f.enabled).map((f) => f.label),
    isPopular: p.isPopular,
  }));
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
  const rawId = String(request.planId || '');
  const numericPlanId = rawId.includes('LIFETIME') ? 4 : rawId.includes('YEARLY') ? 3 : 2;
  const cycle = rawId.includes('YEARLY') || rawId.includes('LIFETIME') ? 'YEARLY' : 'MONTHLY';

  const payload = {
    planId: numericPlanId,
    planCode: rawId,
    paymentMethod: request.paymentMethod || 'MOMO',
    billingCycle: cycle,
  };

  try {
    const response = await apiClient.post<any>(`/api/v1/payment/subscriptions/subscribe?userId=${uid}`, payload);
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
