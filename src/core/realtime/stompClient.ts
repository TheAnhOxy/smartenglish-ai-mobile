import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { useEffect, useState } from 'react';
import { apiClient } from '@/src/core/api/client';
import { getStoredAccessToken } from '@/src/core/storage/tokenStorage';
import { useAuthStore } from '@/src/core/flows/authStore';

/**
 * Kết nối WebSocket/STOMP dùng chung tới social-service (endpoint thuần /ws-chat-raw qua API Gateway),
 * giống Web Portal. Tự kết nối lại khi rớt mạng; các màn hình đăng ký kênh qua `subscribeTopic`.
 */
type Listener = (body: unknown) => void;

const listeners = new Map<string, Set<Listener>>();
const subscriptions = new Map<string, StompSubscription>();
const statusListeners = new Set<(connected: boolean) => void>();
let client: Client | null = null;
let connected = false;

const currentToken = (): string | null => {
  const token = useAuthStore.getState().accessToken || getStoredAccessToken();
  return token ? token.replace(/^Bearer\s+/i, '') : null;
};

const wsUrl = (token: string) => {
  const base = String(apiClient.defaults.baseURL || '').replace(/\/+$/, '').replace(/^http/i, 'ws');
  return `${base}/ws-chat-raw?token=${encodeURIComponent(token)}`;
};

const setConnected = (value: boolean) => {
  connected = value;
  statusListeners.forEach((fn) => fn(value));
};

const parse = (message: IMessage): unknown => {
  try {
    return JSON.parse(message.body);
  } catch {
    return message.body;
  }
};

const attach = (topic: string) => {
  if (!client || !connected || subscriptions.has(topic)) return;
  subscriptions.set(
    topic,
    client.subscribe(topic, (message) => {
      const body = parse(message);
      listeners.get(topic)?.forEach((fn) => fn(body));
    }),
  );
};

const ensureClient = () => {
  const token = currentToken();
  if (!token) return;
  if (client?.active) return;

  client = new Client({
    brokerURL: wsUrl(token),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    // React Native: tránh lỗi cắt khung STOMP ở ký tự NULL
    forceBinaryWSFrames: true,
    appendMissingNULLonIncoming: true,
    beforeConnect: (c) => {
      // Token có thể đã được làm mới kể từ lần kết nối trước
      const fresh = currentToken();
      if (fresh) {
        c.brokerURL = wsUrl(fresh);
        c.connectHeaders = { Authorization: `Bearer ${fresh}` };
      }
    },
    onConnect: () => {
      subscriptions.clear();
      setConnected(true);
      listeners.forEach((_set, topic) => attach(topic));
    },
    onWebSocketClose: () => setConnected(false),
    onStompError: () => setConnected(false),
  });
  client.activate();
};

/** Đăng ký nhận sự kiện của một kênh; trả về hàm hủy đăng ký. */
export const subscribeTopic = (topic: string, listener: Listener): (() => void) => {
  if (!listeners.has(topic)) listeners.set(topic, new Set());
  listeners.get(topic)!.add(listener);
  ensureClient();
  attach(topic);
  return () => {
    const set = listeners.get(topic);
    set?.delete(listener);
    if (set && set.size === 0) {
      listeners.delete(topic);
      subscriptions.get(topic)?.unsubscribe();
      subscriptions.delete(topic);
    }
  };
};

/** Gửi một khung tới server (vd: /app/chat.typing). Trả về false khi chưa kết nối để bên gọi dùng REST. */
export const publishStomp = (destination: string, body: unknown): boolean => {
  if (!client || !connected) return false;
  try {
    client.publish({ destination, body: JSON.stringify(body) });
    return true;
  } catch {
    return false;
  }
};

/** Ngắt kết nối khi đăng xuất. */
export const disconnectStomp = () => {
  subscriptions.clear();
  setConnected(false);
  void client?.deactivate();
  client = null;
};

/** Trạng thái kết nối WebSocket, dùng để giãn lịch hỏi REST dự phòng khi đã có realtime. */
export const useStompConnected = (): boolean => {
  const [value, setValue] = useState(connected);
  useEffect(() => {
    statusListeners.add(setValue);
    setValue(connected);
    return () => {
      statusListeners.delete(setValue);
    };
  }, []);
  return value;
};

// Đăng xuất (mất token) → đóng kết nối để không giữ socket của tài khoản cũ
useAuthStore.subscribe((state, prev) => {
  if (prev.accessToken && !state.accessToken) disconnectStomp();
});

// Chỉ bản dev: xem nhanh trạng thái kết nối khi gỡ lỗi trên web
if (__DEV__ && typeof window !== 'undefined') {
  (window as unknown as { __stompStatus?: () => unknown }).__stompStatus = () => ({
    connected,
    topics: Array.from(listeners.keys()),
    subscribed: Array.from(subscriptions.keys()),
  });
}
