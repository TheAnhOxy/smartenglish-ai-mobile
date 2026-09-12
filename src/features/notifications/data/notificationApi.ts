import { apiClient, getCurrentUserId } from '@/src/core/api/client';
import { NotificationItem } from '@/src/core/types/schema';

/**
 * GET /api/v1/notification?userId=...
 * Fetches user notifications. Falls back to empty array if notification service is unavailable.
 */
export const fetchNotificationsApi = async (userId?: string): Promise<NotificationItem[]> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/notification?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data.map((n: any) => ({
        id: String(n.id || n.notificationId || ''),
        user_id: String(uid),
        notification_type: (n.type || n.notificationType || 'system').toLowerCase() as any,
        title: n.title || 'Thông báo',
        body: n.body || n.message || n.content || '',
        is_read: Boolean(n.isRead || n.read),
        created_at: n.createdAt || n.sentAt || new Date().toISOString(),
        metadata: n.metadata || undefined
      }));
    }
  } catch (err) {
    console.warn('[NotificationAPI] fetchNotificationsApi error:', err);
  }
  return [];
};

/**
 * PUT /api/v1/notification/{id}/read
 * Mark a single notification as read
 */
export const markNotificationReadApi = async (notificationId: string, userId?: string): Promise<boolean> => {
  const uid = userId || getCurrentUserId();
  try {
    await apiClient.put<any>(`/api/v1/notification/${notificationId}/read?userId=${uid}`);
    return true;
  } catch (err) {
    console.warn('[NotificationAPI] markNotificationReadApi error:', err);
    return false;
  }
};
