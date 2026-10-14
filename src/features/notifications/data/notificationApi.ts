import { apiClient, getCurrentUserId } from '@/src/core/api/client';
import { NotificationItem } from '@/src/core/types/schema';

/**
 * GET /api/v1/notifications
 * Lấy danh sách thông báo của người dùng từ backend.
 * Tương thích cả mảng thuần và Page response (data.content).
 */
export const fetchNotificationsApi = async (userId?: string): Promise<NotificationItem[]> => {
  const uid = userId || getCurrentUserId();
  try {
    const url = uid ? `/api/v1/notifications?userId=${uid}` : '/api/v1/notifications';
    const response = await apiClient.get<any>(url);

    // Spring Boot trả về bọc ApiResponse: { status: 200, data: Page { content: [...] } }
    const rawData = response.data?.data || response.data;
    const items = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.content)
      ? rawData.content
      : [];

    if (items.length > 0) {
      return items.map((n: any) => ({
        id: String(n.id || n.notificationId || ''),
        user_id: String(n.userId || uid),
        notification_type: (n.type || n.notificationType || 'system').toLowerCase() as any,
        title: n.title || 'Thông báo',
        body: n.body || n.message || n.content || '',
        is_read: Boolean(n.isRead || n.read),
        created_at: n.createdAt || n.sentAt || new Date().toISOString(),
        metadata: n.metadata || undefined,
        target_link: n.targetLink || undefined
      }));
    }
  } catch (err) {
    console.warn('[NotificationAPI] fetchNotificationsApi error:', err);
  }
  return [];
};

/**
 * PATCH /api/v1/notifications/{id}/read
 * Đánh dấu thông báo là đã đọc (sử dụng PATCH theo đúng chuẩn REST của backend)
 */
export const markNotificationReadApi = async (notificationId: string, userId?: string): Promise<boolean> => {
  const uid = userId || getCurrentUserId();
  try {
    const url = uid
      ? `/api/v1/notifications/${notificationId}/read?userId=${uid}`
      : `/api/v1/notifications/${notificationId}/read`;
    await apiClient.patch<any>(url);
    return true;
  } catch (err) {
    console.warn('[NotificationAPI] markNotificationReadApi error:', err);
    return false;
  }
};

/**
 * POST /api/v1/notifications/push-tokens
 * Đăng ký Expo Push Token của thiết bị lên hệ thống
 */
export const registerPushTokenApi = async (
  token: string,
  deviceType: string = 'MOBILE',
  deviceName?: string
): Promise<boolean> => {
  try {
    await apiClient.post('/api/v1/notifications/push-tokens', {
      token,
      deviceType,
      deviceName,
    });
    return true;
  } catch (err) {
    console.warn('[NotificationAPI] registerPushTokenApi error:', err);
    return false;
  }
};

/**
 * DELETE /api/v1/notifications/push-tokens/{token}
 * Hủy đăng ký push token khi đăng xuất
 */
export const unregisterPushTokenApi = async (token: string): Promise<boolean> => {
  try {
    await apiClient.delete(`/api/v1/notifications/push-tokens/${encodeURIComponent(token)}`);
    return true;
  } catch (err) {
    console.warn('[NotificationAPI] unregisterPushTokenApi error:', err);
    return false;
  }
};

