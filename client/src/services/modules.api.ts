import api from './api';
import type { ApiResponse, PaginatedResponse } from '@spirulina/shared';

// Generic CRUD API factory
function createCrudApi<T>(basePath: string) {
  return {
    list: async (params?: Record<string, unknown>): Promise<PaginatedResponse<T>> => {
      const res = await api.get<PaginatedResponse<T>>(basePath, { params });
      return res.data;
    },
    getById: async (id: number): Promise<T> => {
      const res = await api.get<ApiResponse<T>>(`${basePath}/${id}`);
      return res.data.data!;
    },
    create: async (data: Record<string, unknown>): Promise<T> => {
      const res = await api.post<ApiResponse<T>>(basePath, data);
      return res.data.data!;
    },
    update: async (id: number, data: Record<string, unknown>): Promise<T> => {
      const res = await api.put<ApiResponse<T>>(`${basePath}/${id}`, data);
      return res.data.data!;
    },
    delete: async (id: number): Promise<void> => {
      await api.delete(`${basePath}/${id}`);
    },
  };
}

// Harvest API
export const harvestApi = {
  ...createCrudApi('/harvest'),
  getStats: async (params?: { startDate?: string; endDate?: string }) => {
    const res = await api.get<ApiResponse<unknown>>('/harvest/stats', { params });
    return res.data.data;
  },
  getByPond: async (pondId: number) => {
    const res = await api.get<ApiResponse<unknown[]>>(`/harvest/pond/${pondId}`);
    return res.data.data;
  },
};

// Production API
export const productionApi = {
  ...createCrudApi('/production'),
  getStats: async (params?: { startDate?: string; endDate?: string }) => {
    const res = await api.get<ApiResponse<unknown>>('/production/stats', { params });
    return res.data.data;
  },
};

// Chemicals API
export const chemicalsApi = {
  ...createCrudApi('/chemicals'),
  logUsage: async (data: Record<string, unknown>) => {
    const res = await api.post<ApiResponse<unknown>>('/chemicals/usage', data);
    return res.data.data;
  },
  getUsageLog: async (params?: Record<string, unknown>) => {
    const res = await api.get<PaginatedResponse<unknown>>('/chemicals/usage', { params });
    return res.data;
  },
  updateUsage: async (id: number, data: Record<string, unknown>) => {
    const res = await api.put<ApiResponse<unknown>>(`/chemicals/usage/${id}`, data);
    return res.data.data;
  },
  getLowStock: async () => {
    const res = await api.get<ApiResponse<unknown[]>>('/chemicals/low-stock');
    return res.data.data;
  },
};

// Expenses API
export const expensesApi = {
  ...createCrudApi('/expenses'),
  getCategories: async () => {
    const res = await api.get<ApiResponse<unknown[]>>('/expenses/categories');
    return res.data.data;
  },
  getSummary: async (params?: { startDate?: string; endDate?: string }) => {
    const res = await api.get<ApiResponse<unknown>>('/expenses/summary', { params });
    return res.data.data;
  },
  approve: async (id: number) => {
    const res = await api.patch<ApiResponse<unknown>>(`/expenses/${id}/approve`);
    return res.data.data;
  },
  reject: async (id: number) => {
    const res = await api.patch<ApiResponse<unknown>>(`/expenses/${id}/reject`);
    return res.data.data;
  },
};

// Customers API
export const customersApi = {
  ...createCrudApi('/customers'),
  getOrderHistory: async (id: number) => {
    const res = await api.get<ApiResponse<unknown[]>>(`/customers/${id}/orders`);
    return res.data.data;
  },
};

// Leads API
export const leadsApi = {
  ...createCrudApi('/leads'),
  getPipeline: async () => {
    const res = await api.get<ApiResponse<unknown[]>>('/leads/pipeline');
    return res.data.data;
  },
  updateStatus: async (id: number, status: string) => {
    const res = await api.patch<ApiResponse<unknown>>(`/leads/${id}/status`, { status });
    return res.data.data;
  },
  convert: async (id: number) => {
    const res = await api.post<ApiResponse<unknown>>(`/leads/${id}/convert`);
    return res.data.data;
  },
};

// Orders API
export const ordersApi = {
  ...createCrudApi('/orders'),
  getRevenueSummary: async (params?: { startDate?: string; endDate?: string }) => {
    const res = await api.get<ApiResponse<unknown>>('/orders/summary', { params });
    return res.data.data;
  },
  updateStatus: async (id: number, status: string) => {
    const res = await api.patch<ApiResponse<unknown>>(`/orders/${id}/status`, { status });
    return res.data.data;
  },
  updatePayment: async (id: number, paymentReceived: number) => {
    const res = await api.patch<ApiResponse<unknown>>(`/orders/${id}/payment`, { paymentReceived });
    return res.data.data;
  },
};

// Inventory API
export const inventoryApi = {
  list: async () => {
    const res = await api.get<ApiResponse<unknown[]>>('/inventory');
    return res.data.data;
  },
  updateQuantity: async (id: number, quantity: number) => {
    const res = await api.patch<ApiResponse<unknown>>(`/inventory/${id}`, { quantity });
    return res.data.data;
  },
};

// Batches API
export const batchesApi = {
  ...createCrudApi('/batches'),
  getExpiring: async (days?: number) => {
    const res = await api.get<ApiResponse<unknown[]>>('/batches/expiring', { params: { days } });
    return res.data.data;
  },
  addTest: async (id: number, data: Record<string, unknown>) => {
    const res = await api.post<ApiResponse<unknown>>(`/batches/${id}/tests`, data);
    return res.data.data;
  },
  getTests: async (id: number) => {
    const res = await api.get<ApiResponse<unknown[]>>(`/batches/${id}/tests`);
    return res.data.data;
  },
};

// AI API
export const aiApi = {
  // Agentic Farm Summary
  getFarmSummary: async (provider?: string) => {
    const res = await api.get<ApiResponse<{ summary: string; snapshot: Record<string, unknown>; generatedAt: string }>>('/ai/farm-summary', {
      params: provider ? { provider } : undefined,
    });
    return res.data.data;
  },
  getFarmSnapshot: async () => {
    const res = await api.get<ApiResponse<Record<string, unknown>>>('/ai/farm-snapshot');
    return res.data.data;
  },
  // Conversations
  getConversations: async () => {
    const res = await api.get<ApiResponse<unknown[]>>('/ai/conversations');
    return res.data.data;
  },
  createConversation: async (data: Record<string, unknown>) => {
    const res = await api.post<ApiResponse<unknown>>('/ai/conversations', data);
    return res.data.data;
  },
  chat: async (id: number, message: string) => {
    const res = await api.post<ApiResponse<unknown>>(`/ai/conversations/${id}/chat`, { message });
    return res.data.data;
  },
  // Alerts
  getAlerts: async (params?: Record<string, unknown>) => {
    const res = await api.get<ApiResponse<unknown[]>>('/ai/alerts', { params });
    return res.data.data;
  },
  getUnreadCount: async () => {
    const res = await api.get<ApiResponse<{ count: number }>>('/ai/alerts/unread-count');
    return res.data.data;
  },
  markRead: async (id: number) => {
    const res = await api.patch<ApiResponse<unknown>>(`/ai/alerts/${id}/read`);
    return res.data.data;
  },
  resolveAlert: async (id: number) => {
    const res = await api.patch<ApiResponse<unknown>>(`/ai/alerts/${id}/resolve`);
    return res.data.data;
  },
};

// Reports API
export const reportsApi = {
  getProductionReport: async (startDate: string, endDate: string) => {
    const res = await api.get<ApiResponse<unknown>>('/reports/production', { params: { startDate, endDate } });
    return res.data.data;
  },
  getSalesReport: async (startDate: string, endDate: string) => {
    const res = await api.get<ApiResponse<unknown>>('/reports/sales', { params: { startDate, endDate } });
    return res.data.data;
  },
  getExpenseReport: async (startDate: string, endDate: string) => {
    const res = await api.get<ApiResponse<unknown>>('/reports/expenses', { params: { startDate, endDate } });
    return res.data.data;
  },
};

// Settings API
export const settingsApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<unknown[]>>('/settings');
    return res.data.data;
  },
  upsert: async (data: { category: string; key: string; value: unknown; description?: string }) => {
    const res = await api.put<ApiResponse<unknown>>('/settings', data);
    return res.data.data;
  },
};

// Marketing API
export const marketingApi = {
  listDemoFarms: async (params?: Record<string, unknown>) => {
    const res = await api.get<PaginatedResponse<unknown>>('/marketing/demo-farms', { params });
    return res.data;
  },
  getDemoFarm: async (id: number) => {
    const res = await api.get<ApiResponse<unknown>>(`/marketing/demo-farms/${id}`);
    return res.data.data;
  },
  createDemoFarm: async (data: Record<string, unknown>) => {
    const res = await api.post<ApiResponse<unknown>>('/marketing/demo-farms', data);
    return res.data.data;
  },
  updateDemoFarm: async (id: number, data: Record<string, unknown>) => {
    const res = await api.put<ApiResponse<unknown>>(`/marketing/demo-farms/${id}`, data);
    return res.data.data;
  },
  deleteDemoFarm: async (id: number): Promise<void> => {
    await api.delete(`/marketing/demo-farms/${id}`);
  },
  listTestimonials: async (params?: Record<string, unknown>) => {
    const res = await api.get<PaginatedResponse<unknown>>('/marketing/testimonials', { params });
    return res.data;
  },
  createTestimonial: async (data: Record<string, unknown>) => {
    const res = await api.post<ApiResponse<unknown>>('/marketing/testimonials', data);
    return res.data.data;
  },
  updateTestimonial: async (id: number, data: Record<string, unknown>) => {
    const res = await api.put<ApiResponse<unknown>>(`/marketing/testimonials/${id}`, data);
    return res.data.data;
  },
  deleteTestimonial: async (id: number): Promise<void> => {
    await api.delete(`/marketing/testimonials/${id}`);
  },
};

// Users API
export const usersApi = {
  list: async (params?: Record<string, unknown>) => {
    const res = await api.get<PaginatedResponse<unknown>>('/users', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<ApiResponse<unknown>>(`/users/${id}`);
    return res.data.data;
  },
  create: async (data: Record<string, unknown>) => {
    const res = await api.post<ApiResponse<unknown>>('/users', data);
    return res.data.data;
  },
  update: async (id: number, data: Record<string, unknown>) => {
    const res = await api.put<ApiResponse<unknown>>(`/users/${id}`, data);
    return res.data.data;
  },
  getRoles: async () => {
    const res = await api.get<ApiResponse<unknown[]>>('/users/roles');
    return res.data.data;
  },
};
