import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { fetchLatestUnreadNotificationsApi } from '../data/notificationApi';
import { presentLocalNotificationAsync } from './pushNotificationService';

const POLL_INTERVAL_MS = 5000;

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
