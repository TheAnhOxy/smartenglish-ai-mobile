import { QueryClient } from '@tanstack/react-query';

/** QueryClient dùng chung toàn app (tách riêng để đăng xuất có thể xoá cache dữ liệu của tài khoản cũ). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 phút
    },
  },
});
