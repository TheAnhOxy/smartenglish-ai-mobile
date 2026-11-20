import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/src/core/api/client';
import { queryClient } from '@/src/core/api/queryClient';
import { saveAuthTokens, getStoredAccessToken, getStoredRefreshToken } from '@/src/core/storage/tokenStorage';
import { useAuthStore } from '@/src/core/flows/authStore';

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('Đăng xuất dọn sạch phiên', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    saveAuthTokens('access_old', 'refresh_old');
    useAuthStore.getState().setAuthUser(
      { id: '44', email: 'gv@smartenglish.vn', role: 'teacher', plan: 'free' } as never,
      'access_old',
      'refresh_old',
    );
    apiClient.defaults.headers.common['Authorization'] = 'Bearer access_old';
    queryClient.setQueryData(['user-stats'], { xp: 450 });
  });

  afterEach(() => mock.restore());

  it('thu hồi refresh token trên server, bỏ header token cũ và xoá cache', async () => {
    mock.onPost('/api/v1/auth/logout').reply(200, { status: 200 });

    useAuthStore.getState().logout();
    await flush();

    expect(mock.history.post).toHaveLength(1);
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ refreshToken: 'refresh_old' });
    expect(mock.history.post[0].headers?.Authorization).toBeUndefined();
    expect(apiClient.defaults.headers.common['Authorization']).toBeUndefined();
    expect(getStoredAccessToken()).toBeNull();
    expect(getStoredRefreshToken()).toBeNull();
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(queryClient.getQueryData(['user-stats'])).toBeUndefined();
  });

  it('server lỗi vẫn đăng xuất ở máy', async () => {
    mock.onPost('/api/v1/auth/logout').networkError();

    useAuthStore.getState().logout();
    await flush();

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(getStoredRefreshToken()).toBeNull();
  });
});
