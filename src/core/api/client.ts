import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';

import Constants from 'expo-constants';
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  saveAuthTokens,
  clearAuthTokens,
} from '../storage/tokenStorage';

const getGatewayUrl = () => {
  const rawEnv = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_GATEWAY_URL;
  const envUrl = rawEnv ? rawEnv.trim() : '';

  // 1. Nếu chạy trên Web browser của máy tính
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      // Khi test trên localhost / 127.0.0.1, luôn gọi thẳng gateway local http://localhost:8080 để tránh CORS của ngrok
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8080';
      }
      if (hostname) {
        return `http://${hostname}:8080`;
      }
    }
    if (envUrl && !envUrl.includes('ngrok')) {
      return envUrl.replace(/\/$/, '');
    }
    return 'http://localhost:8080';
  }

  // 2. Nếu có biến môi trường chỉ định rõ
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  // 3. Tự động lấy IP máy tính đang chạy Expo server từ hostUri nếu là IPv4 hợp lệ
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    const isIpV4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
    if (isIpV4 && host !== '127.0.0.1') {
      return `http://${host}:8080`;
    }
  }

  // 4. Mặc định cho thiết bị Android (qua adb reverse 8080) hoặc LAN
  if (Platform.OS === 'android') {
    return 'http://127.0.0.1:8080';
  }

  // 5. Fallback mặc định
  return 'http://192.168.1.22:8080';
};

export const SERVICE_URLS = {
  GATEWAY: getGatewayUrl(),
  AUTH: getGatewayUrl(),
  CONTENT: getGatewayUrl(),
  LEARNING: getGatewayUrl(),
  AI_PRACTICE: getGatewayUrl(),
  PAYMENT: getGatewayUrl(),
};

// Create primary Axios instance routing 100% through API Gateway (Port 8080)
export const apiClient: AxiosInstance = axios.create({
  baseURL: getGatewayUrl(),
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // Route all requests through API Gateway (Port 8080)
    config.baseURL = getGatewayUrl();
    config.headers = config.headers || {};
    (config.headers as any)['ngrok-skip-browser-warning'] = 'true';

    // Attach Authorization token from Zustand auth store or Cookie/LocalStorage tokenStorage
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useAuthStore } = require('@/src/core/flows/authStore');
      let accessToken: string | null = useAuthStore.getState().accessToken;
      if (!accessToken) {
        accessToken = getStoredAccessToken();
      }
      if (accessToken) {
        config.headers = config.headers || {};
        (config.headers as any)['Authorization'] = accessToken.startsWith('Bearer ')
          ? accessToken
          : `Bearer ${accessToken}`;
      }
    } catch (_) {
      // Ignore any errors (e.g. during the login request itself)
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object') {
      const errStatus = body.status || body.statusCode || body.code;
      if (typeof errStatus === 'number' && errStatus >= 400) {
        const error: any = new Error(body.message || `Backend error: status ${errStatus}`);
        error.response = { status: errStatus, data: body };
        console.warn(`[API Business Error ${errStatus} ${response.config?.url}]:`, body.message);
        return Promise.reject(error);
      }
      if (body.success === false) {
        const error: any = new Error(body.message || 'Operation failed');
        error.response = { status: 400, data: body };
        console.warn(`[API Business Error ${response.config?.url}]:`, body.message);
        return Promise.reject(error);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const fullUrl = `${originalRequest?.baseURL || ''}${originalRequest?.url || ''}`;

    // Handle 401 Unauthorized with token refresh & request replay
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(`${getGatewayUrl()}/api/v1/auth/refresh`, {
          refreshToken,
        });
        const data = refreshResponse.data?.data || refreshResponse.data;
        const newAccessToken = data?.accessToken || data?.access_token;
        const newRefreshToken = data?.refreshToken || data?.refresh_token || refreshToken;

        if (newAccessToken) {
          saveAuthTokens(newAccessToken, newRefreshToken);
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { useAuthStore } = require('@/src/core/flows/authStore');
            const currentUser = useAuthStore.getState().currentUser;
            if (currentUser) {
              useAuthStore.getState().setAuthUser(currentUser, newAccessToken, newRefreshToken);
            }
          } catch (_) {}

          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          processQueue(new Error('Invalid token refresh response'), null);
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        try {
          clearAuthTokens();
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { useAuthStore } = require('@/src/core/flows/authStore');
          useAuthStore.getState().logout();
        } catch (_) {}
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      console.warn(`[API Error ${error.response.status} ${fullUrl}]:`, error.response.data);
    } else {
      console.warn(`[API Network Error ${fullUrl}]:`, error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Returns the currently logged-in user's id as a string.
 * Falls back to empty string if not authenticated.
 */
export const getCurrentUserId = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useAuthStore } = require('@/src/core/flows/authStore');
    const uid = useAuthStore.getState().currentUser?.id;
    return uid ? String(uid) : '';
  } catch {
    return '';
  }
};
