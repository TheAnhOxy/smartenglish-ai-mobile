/**
 * Token & Cookie Storage Helper for SmartEnglish Mobile
 * Lưu trữ token trên Cookie (Web / Mobile Web) và LocalStorage theo chuẩn FE Admin / Teacher.
 */

export const ACCESS_TOKEN_KEY = 'se_user_token';
export const REFRESH_TOKEN_KEY = 'se_user_refresh_token';
export const USER_PROFILE_KEY = 'se_user_profile';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function saveAuthTokens(accessToken: string, refreshToken?: string, user?: any) {
  // 1. Lưu vào Cookie (phục vụ web/browser và request cookie)
  if (accessToken) {
    setCookie('accessToken', accessToken, 7 * 86400); // 7 ngày
    setCookie(ACCESS_TOKEN_KEY, accessToken, 7 * 86400);
  }
  if (refreshToken) {
    setCookie('refreshToken', refreshToken, 30 * 86400); // 30 ngày
    setCookie(REFRESH_TOKEN_KEY, refreshToken, 30 * 86400);
  }

  // 2. Lưu vào LocalStorage (chuẩn đồng bộ tương tự FE Admin / Giáo viên)
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (accessToken) window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      if (user) window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.warn('[tokenStorage] localStorage write error:', e);
  }
}

export function getStoredAccessToken(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) return token;
    }
  } catch (_) {}

  // Fallback đọc từ Cookie
  return getCookie('accessToken') || getCookie(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const rt = window.localStorage.getItem(REFRESH_TOKEN_KEY);
      if (rt) return rt;
    }
  } catch (_) {}

  return getCookie('refreshToken') || getCookie(REFRESH_TOKEN_KEY);
}

export function getStoredUserProfile(): any | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(USER_PROFILE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (_) {}
  return null;
}

export function clearAuthTokens() {
  removeCookie('accessToken');
  removeCookie(ACCESS_TOKEN_KEY);
  removeCookie('refreshToken');
  removeCookie(REFRESH_TOKEN_KEY);

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.localStorage.removeItem(USER_PROFILE_KEY);
    }
  } catch (_) {}
}
