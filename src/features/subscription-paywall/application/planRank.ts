/**
 * Thứ hạng gói học viên: Tháng (1) < Năm (2) < Trọn đời (3). 0 = chưa có gói trả phí.
 * Dùng để khoá các gói thấp hơn gói đang dùng — tránh học viên tự hạ cấp từ gói VIP về gói thường.
 */
export const rankOfPlanId = (planId: string): number => {
  const id = planId.toUpperCase();
  if (id.includes('LIFETIME')) return 3;
  if (id.includes('YEARLY')) return 2;
  return 1;
};

export const rankOfUserPlan = (userPlan?: string | null): number => {
  switch ((userPlan || '').toLowerCase()) {
    case 'lifetime':
      return 3;
    case 'premium_yearly':
      return 2;
    case 'premium_monthly':
      return 1;
    default:
      return 0;
  }
};

/** Gói thấp hơn gói hiện tại (còn hạn) → không cho đăng ký. */
export const isLowerThanCurrent = (planId: string, userPlan?: string | null): boolean => {
  const current = rankOfUserPlan(userPlan);
  return current > 0 && rankOfPlanId(planId) < current;
};
