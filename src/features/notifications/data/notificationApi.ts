import { MOCK_NOTIFICATIONS } from '@/src/core/data/mockData';
import { NotificationItem } from '@/src/core/types/schema';

export const fetchNotificationsApi = async (): Promise<NotificationItem[]> => {
  return MOCK_NOTIFICATIONS;
};
