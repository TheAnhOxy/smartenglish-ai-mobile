import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { fetchLatestUnreadNotificationsApi } from '../data/notificationApi';
import { presentLocalNotificationAsync } from './pushNotificationService';
import { refreshEntitlements } from '@/src/core/flows/refreshEntitlements';
import type { QueryClient } from '@tanstack/react-query';

const POLL_INTERVAL_MS = 5000;

/** Thông báo về lớp học: giáo viên giao bài, nhắc hạn, chấm điểm, thay đổi lớp. */
const CLASS_TYPES = ['homework_assigned', 'homework_reminder', 'teacher_feedback', 'grade', 'class'];
/** Thông báo về gói: thanh toán thành công, hủy gói, hoàn tiền. */
const PLAN_TYPE_PREFIXES = ['payment', 'refunded'];

/**
 * Thông báo mới báo hiệu dữ liệu phía máy chủ đã đổi: tải lại ngay phần liên quan
 * thay vì đợi người học mở lại màn hình.
 */
export const syncDataForNotifications = (queryClient: QueryClient, types: string[]) => {
  if (types.some((t) => CLASS_TYPES.includes(t))) {
    queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
    queryClient.invalidateQueries({ queryKey: ['class-detail'] });
    queryClient.invalidateQueries({ queryKey: ['my-classes'] });
  }
  if (types.some((t) => PLAN_TYPE_PREFIXES.some((p) => t.startsWith(p)))) {
    // Cấp lại token và tải lại hồ sơ để mở khóa hoặc khóa các chức năng Premium ngay
    refreshEntitlements();
  }
};

/**
 * Nhận thông báo gần realtime trên mobile bằng polling (cùng cách với tin nhắn chat).
 * - Chỉ chạy khi app đang mở (AppState = active); khi app ở nền, remote push của Expo đảm nhiệm.
 * - Lần đầu chỉ ghi nhận danh sách hiện có, không bắn banner cho thông báo cũ.
 * - Có thông báo chưa đọc mới → cập nhật cache ['notifications'] + hiện banner trong app.
 */
export const useNotificationRealtimeSync = (userId?: string | number | null) => {
  const queryClient = useQueryClient();
  const seenIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!userId) return;
    seenIdsRef.current = null;

    let timer: ReturnType<typeof setInterval> | null = null;
    let inFlight = false;

    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const latest = await fetchLatestUnreadNotificationsApi();
        const seen = seenIdsRef.current;

        if (seen === null) {
          seenIdsRef.current = new Set(latest.map((n) => n.id));
          return;
        }

        const fresh = latest.filter((n) => n.id && !seen.has(n.id));
        if (fresh.length === 0) return;

        fresh.forEach((n) => seen.add(n.id));
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        syncDataForNotifications(queryClient, fresh.map((n) => String(n.notification_type ?? '').toLowerCase()));

        // Thông báo mới nhất hiện đầy đủ; nhiều thông báo dồn lại thì gộp thành 1 banner
        const [first] = fresh;
        if (fresh.length === 1) {
          await presentLocalNotificationAsync(first.title, first.body, { targetLink: first.target_link ?? '' });
        } else {
          await presentLocalNotificationAsync('Bạn có thông báo mới', `${fresh.length} thông báo chưa đọc`);
        }
      } catch {
        // Lỗi mạng tạm thời: bỏ qua, lượt polling sau sẽ thử lại
      } finally {
        inFlight = false;
      }
    };

    const start = () => {
      if (timer) return;
      poll();
      timer = setInterval(poll, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    if (AppState.currentState === 'active') start();
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        // Quay lại app: làm mới danh sách ngay (thông báo khi ở nền đã có remote push hiển thị)
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        start();
      } else {
        stop();
      }
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [userId, queryClient]);
};
