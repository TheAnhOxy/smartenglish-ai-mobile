import { apiClient } from '@/src/core/api/client';

export interface LoginSession {
  id: number;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string | null;
  lastUsedAt: string | null;
  current: boolean;
}

/** GET /users/me/sessions — các thiết bị đang đăng nhập của tài khoản (UC-04). */
export const fetchSessionsApi = async (): Promise<LoginSession[]> => {
  const res = await apiClient.get<any>('/api/v1/users/me/sessions');
  const data = res.data?.data ?? res.data;
  return Array.isArray(data) ? data : [];
};

/** DELETE /users/me/sessions/{id} — đăng xuất một thiết bị từ xa. */
export const revokeSessionApi = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/users/me/sessions/${id}`);
};

/** DELETE /users/me/sessions/others — đăng xuất mọi thiết bị khác thiết bị đang dùng. */
export const revokeOtherSessionsApi = async (): Promise<number> => {
  const res = await apiClient.delete<any>('/api/v1/users/me/sessions/others');
  return Number(res.data?.data?.revoked ?? 0);
};
