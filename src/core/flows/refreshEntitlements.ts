import { apiClient } from '../api/client';
import { queryClient } from '../api/queryClient';
import { getStoredRefreshToken, saveAuthTokens } from '../storage/tokenStorage';
import { fetchCurrentUserApi } from '@/src/features/auth/data/authApi';
import { useAuthStore } from './authStore';

/**
 * Làm mới quyền lợi gói ngay sau khi thanh toán (hoặc khi máy chủ báo vượt hạn mức):
 * 1. Xin access token mới để claim `plan` trong JWT khớp gói vừa mua (các service đọc claim này).
 * 2. Tải lại hồ sơ để có `plan` và `plan_expires_at` thật.
 * 3. Xoá cache truy vấn để các trang giới hạn (lớp học, bộ thẻ, AI...) tính lại hạn mức.
 */
export const refreshEntitlements = async (): Promise<void> => {
  const refreshToken = getStoredRefreshToken();
  if (refreshToken) {
    try {
      const res = await apiClient.post('/api/v1/auth/refresh', { refreshToken });
      const data = res.data?.data || res.data;
      const accessToken: string | undefined = data?.accessToken || data?.access_token;
      if (accessToken) {
        const nextRefresh: string = data?.refreshToken || data?.refresh_token || refreshToken;
        const current = useAuthStore.getState().currentUser;
        saveAuthTokens(accessToken, nextRefresh, current ?? undefined);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        useAuthStore.setState({ accessToken });
      }
    } catch (_) {
      // Không làm mới được token thì vẫn tải lại hồ sơ bên dưới
    }
  }

  try {
    const { user } = await fetchCurrentUserApi();
    useAuthStore.getState().updateCurrentUser({
      plan: user.plan,
      plan_expires_at: user.plan_expires_at,
    });
  } catch (_) {
    // Giữ trạng thái hiện tại nếu mất kết nối
  }

  await queryClient.invalidateQueries();
};
