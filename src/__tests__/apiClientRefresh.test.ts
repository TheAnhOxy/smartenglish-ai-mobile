import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/src/core/api/client';
import { saveAuthTokens, clearAuthTokens, getStoredAccessToken, getStoredRefreshToken } from '@/src/core/storage/tokenStorage';
import { useAuthStore } from '@/src/core/flows/authStore';

describe('Phase 12 Mobile – API Client 401 & Token Refresh Hardening', () => {
  let mock: MockAdapter;
  let rawAxiosMock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    rawAxiosMock = new MockAdapter(axios);
    clearAuthTokens();
    useAuthStore.getState().logout();
  });

  afterEach(() => {
    mock.restore();
    rawAxiosMock.restore();
  });

  it('1. Normal API call with valid token succeeds without triggering refresh', async () => {
    saveAuthTokens('valid_access_token', 'valid_refresh_token');
    useAuthStore.getState().setAuthUser(
      { id: '101', email: 'test@smartenglish.com', role: 'student', plan: 'free' } as any,
      'valid_access_token',
      'valid_refresh_token'
    );

    mock.onGet('/api/v1/users/me').reply(200, {
      status: 200,
      data: { id: 101, email: 'test@smartenglish.com', role: 'STUDENT' },
    });

    const res = await apiClient.get('/api/v1/users/me');
    expect(res.status).toBe(200);
    expect(res.data.data.id).toBe(101);
  });

  it('2. API call returning 401 automatically calls /api/v1/auth/refresh and replays original request', async () => {
    saveAuthTokens('expired_access_token', 'refresh_token_abc');
    useAuthStore.getState().setAuthUser(
      { id: '101', email: 'test@smartenglish.com', role: 'student', plan: 'free' } as any,
      'expired_access_token',
      'refresh_token_abc'
    );

    // First request gets 401
    mock.onGet('/api/v1/learning/progress').replyOnce(401, {
      status: 401,
      message: 'Token expired',
    });

    // Refresh endpoint responds with new token
    rawAxiosMock.onPost(/.*\/api\/v1\/auth\/refresh/).reply(200, {
      status: 200,
      data: {
        accessToken: 'new_fresh_token_xyz',
        refreshToken: 'rotated_refresh_token_def',
      },
    });

    // Replayed request succeeds with 200
    mock.onGet('/api/v1/learning/progress').reply(200, {
      status: 200,
      data: { xp: 150, streak: 3 },
    });

    const res = await apiClient.get('/api/v1/learning/progress');
    expect(res.status).toBe(200);
    expect(res.data.data.xp).toBe(150);

    // Verify storage and authStore were updated with fresh token
    expect(getStoredAccessToken()).toBe('new_fresh_token_xyz');
    expect(getStoredRefreshToken()).toBe('rotated_refresh_token_def');
    expect(useAuthStore.getState().accessToken).toBe('new_fresh_token_xyz');
  });

  it('3. When refresh token is expired/rejected (401), clears session and logs out user', async () => {
    saveAuthTokens('expired_access_token', 'expired_refresh_token');
    useAuthStore.getState().setAuthUser(
      { id: '101', email: 'test@smartenglish.com', role: 'student', plan: 'free' } as any,
      'expired_access_token',
      'expired_refresh_token'
    );

    mock.onGet('/api/v1/learning/progress').replyOnce(401, {
      status: 401,
      message: 'Token expired',
    });

    // Refresh endpoint fails with 401
    rawAxiosMock.onPost(/.*\/api\/v1\/auth\/refresh/).reply(401, {
      status: 401,
      message: 'Refresh token invalid or expired',
    });

    await expect(apiClient.get('/api/v1/learning/progress')).rejects.toThrow();

    // Verify session was cleared completely
    expect(getStoredAccessToken()).toBeNull();
    expect(getStoredRefreshToken()).toBeNull();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });
});
