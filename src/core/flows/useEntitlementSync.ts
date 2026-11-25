import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { fetchCurrentUserApi } from '@/src/features/auth/data/authApi';
import { useAuthStore } from './authStore';
import { refreshEntitlements } from './refreshEntitlements';

const MIN_INTERVAL_MS = 30_000;

/**
 * Khi app quay lại từ nền, hỏi máy chủ gói hiện tại của người dùng. Gói đổi ở nơi khác
 * (thanh toán trên trình duyệt, quản trị viên cấp gói, hoàn tiền, hết hạn) thì làm mới quyền lợi
 * để các trang giới hạn mở khóa hoặc khóa lại ngay, không cần đăng xuất.
 */
export const useEntitlementSync = (userId?: string | number | null) => {
  const lastCheck = useRef(0);

  useEffect(() => {
    if (!userId) return;

    const check = async () => {
      const now = Date.now();
      if (now - lastCheck.current < MIN_INTERVAL_MS) return;
      lastCheck.current = now;
      try {
        const { user } = await fetchCurrentUserApi();
        const current = useAuthStore.getState().currentUser;
        if (!current) return;
        if (user.plan !== current.plan || (user.plan_expires_at ?? null) !== (current.plan_expires_at ?? null)) {
          await refreshEntitlements();
        }
      } catch {
        // Mất mạng: lần quay lại sau sẽ kiểm tra lại
      }
    };

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, [userId]);
};
