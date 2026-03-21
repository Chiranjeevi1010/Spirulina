import api from './api';
import type { ApiResponse, PaginatedResponse, Pond, WaterParameter, CreatePondRequest, CreateWaterParameterRequest } from '@spirulina/shared';

export const pondsApi = {
  list: async (params?: { page?: number; limit?: number; status?: string; healthStatus?: string; search?: string }): Promise<PaginatedResponse<Pond>> => {
    const res = await api.get<PaginatedResponse<Pond>>('/ponds', { params });
    return res.data;
  },

  getById: async (id: number): Promise<Pond> => {
    const res = await api.get<ApiResponse<Pond>>(`/ponds/${id}`);
    return res.data.data!;
  },

  create: async (data: CreatePondRequest): Promise<Pond> => {
    const res = await api.post<ApiResponse<Pond>>('/ponds', data);
    return res.data.data!;
  },

  update: async (id: number, data: Partial<CreatePondRequest>): Promise<Pond> => {
    const res = await api.put<ApiResponse<Pond>>(`/ponds/${id}`, data);
    return res.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/ponds/${id}`);
  },

  overview: async (): Promise<Pond[]> => {
    const res = await api.get<ApiResponse<Pond[]>>('/ponds/overview');
    return res.data.data!;
  },

  // Water Parameters
  getWaterParameters: async (pondId: number, params?: { page?: number; limit?: number; startDate?: string; endDate?: string }): Promise<PaginatedResponse<WaterParameter>> => {
    const res = await api.get<PaginatedResponse<WaterParameter>>(`/water-parameters/${pondId}/readings`, { params });
    return res.data;
  },

  createWaterParameter: async (pondId: number, data: CreateWaterParameterRequest): Promise<WaterParameter> => {
    const res = await api.post<ApiResponse<WaterParameter>>(`/water-parameters/${pondId}/readings`, data);
    return res.data.data!;
  },

  updateWaterParameter: async (pondId: number, id: number, data: Partial<CreateWaterParameterRequest>): Promise<WaterParameter> => {
    const res = await api.put<ApiResponse<WaterParameter>>(`/water-parameters/${pondId}/readings/${id}`, data);
    return res.data.data!;
  },

  deleteWaterParameter: async (pondId: number, id: number): Promise<void> => {
    await api.delete(`/water-parameters/${pondId}/readings/${id}`);
  },

  getLatestReading: async (pondId: number): Promise<WaterParameter | null> => {
    try {
      const res = await api.get<ApiResponse<WaterParameter>>(`/water-parameters/${pondId}/readings/latest`);
      return res.data.data ?? null;
    } catch {
      return null;
    }
  },

  getTrends: async (pondId: number, parameter: string, startDate?: string, endDate?: string) => {
    const res = await api.get(`/water-parameters/${pondId}/readings/trends`, {
      params: { parameter, startDate, endDate },
    });
    return res.data.data;
  },
};
