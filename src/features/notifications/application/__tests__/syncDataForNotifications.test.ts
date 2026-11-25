import { QueryClient } from '@tanstack/react-query';

jest.mock('@/src/core/flows/refreshEntitlements', () => ({ refreshEntitlements: jest.fn() }));
jest.mock('../pushNotificationService', () => ({ presentLocalNotificationAsync: jest.fn() }));
jest.mock('../../data/notificationApi', () => ({ fetchLatestUnreadNotificationsApi: jest.fn() }));

import { refreshEntitlements } from '@/src/core/flows/refreshEntitlements';
import { syncDataForNotifications } from '../useNotificationRealtimeSync';

const keysInvalidated = (types: string[]) => {
  const qc = new QueryClient();
  const spy = jest.spyOn(qc, 'invalidateQueries');
  syncDataForNotifications(qc, types);
  return spy.mock.calls.map(([f]) => (f as { queryKey: unknown[] }).queryKey[0]);
};

describe('syncDataForNotifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('giáo viên giao bài hoặc chấm điểm: tải lại bài tập và lớp', () => {
    expect(keysInvalidated(['homework_assigned'])).toEqual(['student-assignments', 'class-detail', 'my-classes']);
    expect(keysInvalidated(['teacher_feedback'])).toContain('student-assignments');
    expect(refreshEntitlements).not.toHaveBeenCalled();
  });

  it('thanh toán, hủy gói, hoàn tiền: làm mới quyền lợi gói', () => {
    for (const t of ['payment', 'payment_receipt', 'payment_cancelled_refund_pending', 'refunded']) {
      syncDataForNotifications(new QueryClient(), [t]);
    }
    expect(refreshEntitlements).toHaveBeenCalledTimes(4);
  });

  it('thông báo khác: không tải lại gì', () => {
    expect(keysInvalidated(['system', 'social'])).toEqual([]);
    expect(refreshEntitlements).not.toHaveBeenCalled();
  });
});
