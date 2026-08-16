import { apiClient } from '@/src/core/api/client';
import { User } from '@/src/core/types/schema';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export const loginApi = async (email: string, password_hash: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', { email, password_hash });
  return response.data;
};

export const fetchCurrentUserApi = async (): Promise<{ user: User }> => {
  const response = await apiClient.get<{ user: User }>('/auth/me');
  return response.data;
};
