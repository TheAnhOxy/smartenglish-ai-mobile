import { hasActivePremium, planLabel } from '../plan';

const now = new Date('2026-11-12T00:00:00Z');

test('expired or undated paid plans count as free', () => {
  expect(hasActivePremium({ plan: 'premium_yearly', plan_expires_at: '2026-09-24T00:00:00Z' }, now)).toBe(false);
  expect(hasActivePremium({ plan: 'premium_monthly', plan_expires_at: null }, now)).toBe(false);
  expect(planLabel({ plan: 'premium_yearly', plan_expires_at: '2026-09-24T00:00:00Z' })).toBe('Tài khoản Miễn phí');
});

test('active and lifetime plans are premium', () => {
  expect(hasActivePremium({ plan: 'premium_monthly', plan_expires_at: '2026-12-03T00:00:00Z' }, now)).toBe(true);
  expect(hasActivePremium({ plan: 'lifetime', plan_expires_at: null }, now)).toBe(true);
  expect(hasActivePremium({ plan: 'free', plan_expires_at: null }, now)).toBe(false);
});
