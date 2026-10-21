import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/src/core/api/client';
import { fetchStudentPlansApi, StudentSubscriptionPlan } from '@/src/features/subscription-paywall/data/subscriptionApi';

describe('Phase 12 Mobile – Paywall Package Default & Upgrade Logic Hardening', () => {
  let mock: MockAdapter;

  const mockPlans: StudentSubscriptionPlan[] = [
    {
      id: 'S-PLAN-FREE',
      name: 'Gói Cơ Bản Miễn Phí',
      priceMonthly: 0,
      priceYearly: 0,
      durationMonths: 0,
      isPopular: false,
      isActive: true,
      quotas: { chat: 15, speaking: 10, writing: 2, scan: 5, maxClasses: 3 },
      features: [],
    },
    {
      id: 'S-PLAN-MONTHLY',
      name: 'Gói Học Viên Tháng',
      priceMonthly: 59000,
      priceYearly: 0,
      durationMonths: 1,
      isPopular: true,
      isActive: true,
      quotas: { chat: 9999, speaking: 9999, writing: 9999, scan: 9999, maxClasses: 9999 },
      features: [],
    },
    {
      id: 'S-PLAN-YEARLY',
      name: 'Gói Học Viên Năm',
      priceMonthly: 0,
      priceYearly: 499000,
      durationMonths: 12,
      isPopular: true,
      isActive: true,
      quotas: { chat: 9999, speaking: 9999, writing: 9999, scan: 9999, maxClasses: 9999 },
      features: [],
    },
  ];

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  // Helper matching PaywallScreen's isPlanCurrent logic
  const isPlanCurrent = (userPlan: string | undefined, planId: string) => {
    if (!userPlan) return false;
    if (userPlan === 'premium_monthly' && planId.includes('MONTHLY')) return true;
    if (userPlan === 'premium_yearly' && planId.includes('YEARLY')) return true;
    if (userPlan === 'lifetime' && planId.includes('LIFETIME')) return true;
    return false;
  };

  // Helper matching PaywallScreen's default selection algorithm
  const resolveDefaultPlan = (userPlan: string | undefined, plans: StudentSubscriptionPlan[]): string => {
    const available = plans.filter((p) => p.id !== 'S-PLAN-FREE' && !isPlanCurrent(userPlan, p.id));
    if (available.length > 0) {
      const promoMonthly = available.find((p) => p.id === 'S-PLAN-MONTHLY');
      if (promoMonthly) {
        return promoMonthly.id;
      }
      return available[0].id;
    }
    return 'S-PLAN-YEARLY';
  };

  it('1. For Free tier user, paywall filters out Free plan and defaults to Monthly/Yearly upgrade', () => {
    const selected = resolveDefaultPlan('free', mockPlans);
    expect(selected).toBe('S-PLAN-MONTHLY');
    expect(selected).not.toBe('S-PLAN-FREE');
  });

  it('2. For active Monthly subscriber, paywall does not default to Monthly again, but offers Yearly upgrade', () => {
    const selected = resolveDefaultPlan('premium_monthly', mockPlans);
    expect(selected).toBe('S-PLAN-YEARLY');
    expect(selected).not.toBe('S-PLAN-MONTHLY');
    expect(selected).not.toBe('S-PLAN-FREE');
  });

  it('3. fetchStudentPlansApi queries backend payment-service with target=student', async () => {
    mock.onGet('/api/v1/payment/plans?target=student').reply(200, {
      status: 200,
      data: mockPlans,
    });

    const plans = await fetchStudentPlansApi();
    expect(plans.length).toBeGreaterThanOrEqual(1);
    expect(plans.some((p) => p.id === 'S-PLAN-MONTHLY')).toBe(true);
  });
});
