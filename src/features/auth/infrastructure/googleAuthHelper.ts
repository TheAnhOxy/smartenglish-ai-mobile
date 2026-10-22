import { Platform } from 'react-native';

export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '1010786013752-ans58nt3rqesc9r5icv0m828f4ifi1ii.apps.googleusercontent.com';

export const GOOGLE_CLIENT_ID = GOOGLE_WEB_CLIENT_ID;

export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  '1010786013752-3gfea8tf36uci0kbhljv2ml3ebtnn7cb.apps.googleusercontent.com';

/**
 * Tải script Google Identity Services (GSI) chính thức trên nền tảng Web.
 * Giúp khắc phục hoàn toàn lỗi Cross-Origin-Opener-Policy (COOP) và window.closed call trên trình duyệt Chrome/Edge.
 */
export const loadGoogleGsiScript = (): Promise<void> => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return Promise.resolve();
  }

  if ((window as any).google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('google-gsi-client');
    if (existing) {
      if ((window as any).google?.accounts?.oauth2) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve());
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Không thể tải Google Identity Services SDK. Vui lòng kiểm tra kết nối mạng.'));
    document.body.appendChild(script);
  });
};

/**
 * Kích hoạt popup đăng nhập Google chuẩn trên Web bằng Google Identity Services.
 * Trả về access_token được backend chấp nhận qua Google UserInfo endpoint.
 */
export const signInWithGoogleWeb = async (
  onSuccess: (token: string) => void,
  onError: (msg: string) => void
): Promise<void> => {
  try {
    const google = (typeof window !== 'undefined' ? (window as any).google : null);

    if (!google?.accounts?.oauth2) {
      await loadGoogleGsiScript();
    }

    const readyGoogle = (window as any).google;
    if (!readyGoogle?.accounts?.oauth2) {
      onError('Google SDK chưa được tải xong. Vui lòng tải lại trang và thử lại.');
      return;
    }

    const tokenClient = readyGoogle.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile openid',
      callback: (response: any) => {
        if (response?.access_token) {
          onSuccess(response.access_token);
        } else if (response?.error) {
          if (response.error === 'popup_closed_by_user') {
            onError('Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.');
          } else {
            onError(`Đăng nhập Google thất bại: ${response.error_description || response.error}`);
          }
        }
      },
      error_callback: (error: any) => {
        console.error('Google GSI Client Error:', error);
        if (error?.type === 'popup_closed') {
          // Người dùng hoặc trình duyệt đóng cửa sổ popup
          onError('Cửa sổ đăng nhập Google đã đóng. Nếu bạn thấy màn hình lỗi trong popup trước khi đóng, vui lòng chụp lại màn hình đó.');
        } else if (error?.type === 'popup_blocked') {
          onError('Trình duyệt đã chặn Pop-up. Vui lòng nhấn vào biểu tượng ổ khóa hoặc pop-up trên thanh địa chỉ URL để cho phép.');
        } else {
          onError(`Lỗi Google: ${error?.message || 'Không thể kết nối dịch vụ Google'}`);
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch (err: any) {
    console.error('Google Sign In Web Exception:', err);
    onError(err.message || 'Đã xảy ra sự cố khi đăng nhập Google.');
  }
};
