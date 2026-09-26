import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';

import Constants from 'expo-constants';
import { getStoredAccessToken } from '../storage/tokenStorage';

const getGatewayUrl = () => {
  const rawEnv = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_GATEWAY_URL;
  const envUrl = rawEnv ? rawEnv.trim() : '';

  // 1. Nếu chạy trên Web browser của máy tính
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:8080`;
      }
    }
    if (envUrl && !envUrl.includes('refurbish-doorframe')) {
      return envUrl.replace(/\/$/, '');
    }
    return 'http://localhost:8080';
  }

  // 2. Nếu có biến môi trường chỉ định rõ (và không phải link ngrok cũ bị offline)
  if (envUrl && !envUrl.includes('refurbish-doorframe')) {
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

  // 4. Fallback cho Android Emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080';
  }

  // 5. Fallback mặc định cho thiết bị thật trên Wi-Fi LAN
  return 'http://192.168.1.25:8080';
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
  (error) => {
    const fullUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
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
