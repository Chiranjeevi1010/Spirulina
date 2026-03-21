import api from './api';
import type { LoginRequest, LoginResponse, ApiResponse, User, Role } from '@spirulina/shared';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return res.data.data!;
  },

  refresh: async (refreshToken: string) => {
    const res = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      '/auth/refresh',
      { refreshToken },
    );
    return res.data.data!;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken });
  },

  getMe: async (): Promise<User & { role: Role }> => {
    const res = await api.get<ApiResponse<User & { role: Role }>>('/auth/me');
    return res.data.data!;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await api.put<ApiResponse<void>>('/auth/change-password', data);
    return res.data;
  },
};
