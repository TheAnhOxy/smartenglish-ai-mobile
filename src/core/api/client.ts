import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { MOCK_USERS, MOCK_USER_STATS, MOCK_CLASSES, MOCK_ASSIGNMENTS, MOCK_NOTIFICATIONS, MOCK_DECKS } from '../data/mockData';

// Create base Axios instance
export const apiClient = axios.create({
  baseURL: 'https://api.smartenglish.ai/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Setup Mock Adapter with realistic random delay (300-900ms)
export const mockAdapter = new MockAdapter(apiClient, { delayResponse: 500 });

// Configure mock endpoints
mockAdapter.onPost('/auth/login').reply((config: any) => {
  const { email } = JSON.parse(config.data || '{}');
  const user = Object.values(MOCK_USERS).find((u) => u.email === email);

  if (user) {
    return [
      200,
      {
        access_token: `mock_jwt_token_for_${user.role}`,
        refresh_token: `mock_refresh_token_for_${user.role}`,
        user
      }
    ];
  }
  return [401, { message: 'Email hoặc mật khẩu không chính xác' }];
});

mockAdapter.onGet('/auth/me').reply((config: any) => {
  const authHeader = config.headers?.Authorization ? String(config.headers.Authorization) : '';
  if (authHeader.includes('teacher')) {
    return [200, { user: MOCK_USERS.teacher, stats: MOCK_USER_STATS[MOCK_USERS.teacher.id] }];
  } else if (authHeader.includes('admin')) {
    return [200, { user: MOCK_USERS.admin, stats: MOCK_USER_STATS[MOCK_USERS.admin.id] }];
  }
  return [200, { user: MOCK_USERS.student, stats: MOCK_USER_STATS[MOCK_USERS.student.id] }];
});

mockAdapter.onGet('/teacher/classes').reply(() => {
  return [200, { classes: MOCK_CLASSES }];
});

mockAdapter.onPost('/teacher/classes/join').reply((config: any) => {
  const { join_code } = JSON.parse(config.data || '{}');
  const foundClass = MOCK_CLASSES.find((c) => c.join_code === join_code);

  if (!join_code) {
    return [400, { message: 'Vui lòng nhập mã lớp' }];
  }
  if (!foundClass) {
    return [404, { message: 'Mã lớp không đúng, kiểm tra lại với giáo viên' }];
  }
  if (foundClass.status === 'archived') {
    return [400, { message: 'Lớp học này đã kết thúc' }];
  }
  return [200, { message: 'Tham gia lớp học thành công', class: foundClass }];
});

mockAdapter.onGet(/\/teacher\/classes\/.*\/assignments/).reply(() => {
  return [200, { assignments: MOCK_ASSIGNMENTS }];
});

mockAdapter.onGet('/notifications').reply(() => {
  return [200, { notifications: MOCK_NOTIFICATIONS }];
});

mockAdapter.onGet('/learning/decks').reply(() => {
  return [200, { decks: MOCK_DECKS }];
});
