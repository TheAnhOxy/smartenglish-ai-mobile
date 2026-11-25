import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Tải lại dữ liệu mỗi khi người dùng quay lại màn hình (bỏ qua lần mở đầu vì truy vấn đã tự tải).
 * Dùng cho các danh sách có thể đổi ở phía máy chủ khi người học đang ở màn khác:
 * bài tập giáo viên vừa giao, học liệu vừa duyệt, khóa học mới...
 */
export const useRefetchOnFocus = (refetch: () => unknown) => {
  const firstFocus = useRef(true);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refetchRef.current();
    }, []),
  );
};
