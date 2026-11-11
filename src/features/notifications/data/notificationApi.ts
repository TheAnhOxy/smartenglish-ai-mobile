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

    return items.map((n: any) => mapNotification(n, uid));
  } catch (err) {
    console.warn('[NotificationAPI] fetchNotificationsApi error:', err);
  }
  return [];
};

const mapNotification = (n: any, uid: string): NotificationItem => ({
  id: String(n.id || n.notificationId || ''),
  user_id: String(n.userId || uid),
  notification_type: (n.type || n.notificationType || 'system').toLowerCase() as any,
  title: n.title || 'Thông báo',
  body: n.body || n.message || n.content || '',
  is_read: Boolean(n.isRead || n.read),
  created_at: n.createdAt || n.sentAt || new Date().toISOString(),
  metadata: n.metadata || undefined,
  target_link: n.targetLink || undefined,
});

/**
 * GET /api/v1/notifications?unreadOnly=true&size=N
 * Lấy nhanh vài thông báo chưa đọc mới nhất — dùng cho cơ chế polling realtime.
 * Ném lỗi (không nuốt) để bên gọi phân biệt "lỗi mạng" với "không có thông báo".
 */
export const fetchLatestUnreadNotificationsApi = async (size = 10): Promise<NotificationItem[]> => {
  const uid = getCurrentUserId();
  const response = await apiClient.get<any>('/api/v1/notifications', {
    params: { unreadOnly: true, page: 0, size },
  });
  const rawData = response.data?.data || response.data;
  const items = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.content) ? rawData.content : [];
  return items.map((n: any) => mapNotification(n, uid));
};

/** GET /api/v1/notifications/unread-count — số thông báo chưa đọc (chấm đỏ trên chuông). */
export const fetchUnreadNotificationCountApi = async (): Promise<number> => {
  const response = await apiClient.get<any>('/api/v1/notifications/unread-count');
  const data = response.data?.data ?? response.data;
  const count = typeof data === 'number' ? data : Number(data?.count ?? data?.unreadCount ?? 0);
  return Number.isFinite(count) ? count : 0;
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

