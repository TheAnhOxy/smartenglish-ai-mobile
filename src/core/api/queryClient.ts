import { AppState, Platform } from 'react-native';
import { QueryClient, focusManager } from '@tanstack/react-query';

/** QueryClient dùng chung toàn app (tách riêng để đăng xuất có thể xoá cache dữ liệu của tài khoản cũ). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 phút
    },
  },
});

// Trên Android/iOS, TanStack Query không tự biết app quay lại từ nền: báo "focus" theo AppState
// để các truy vấn đang hiển thị và đã cũ được tải lại. Web đã có sẵn sự kiện visibilitychange.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
    return () => sub.remove();
  });
}
