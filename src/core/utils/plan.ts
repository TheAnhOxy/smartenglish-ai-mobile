import type { User } from '@/src/core/types/schema';

type PlanUser = Pick<User, 'plan' | 'plan_expires_at'> | null | undefined;

/** Gói trả phí còn hiệu lực: trọn đời luôn còn; gói tháng/năm phải còn hạn. */
export const hasActivePremium = (user: PlanUser, now: Date = new Date()): boolean => {
  const plan = user?.plan;
  if (plan === 'lifetime') return true;
  if (plan !== 'premium_monthly' && plan !== 'premium_yearly') return false;
  if (!user?.plan_expires_at) return false;
  const expires = new Date(user.plan_expires_at);
  return !Number.isNaN(expires.getTime()) && expires > now;
};

export const planLabel = (user: PlanUser): string => {
  if (!hasActivePremium(user)) return 'Tài khoản Miễn phí';
  if (user?.plan === 'lifetime') return 'Premium Trọn đời';
  return user?.plan === 'premium_yearly' ? 'Premium Năm' : 'Premium Tháng';
};

export const planExpiryText = (user: PlanUser): string => {
  if (!hasActivePremium(user)) return 'Nâng cấp để mở khóa toàn bộ';
  if (user?.plan === 'lifetime' || !user?.plan_expires_at) return 'Không giới hạn thời gian';
  const d = new Date(user.plan_expires_at);
  return `Hết hạn: ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
};
