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

// WhatsApp API
export const whatsappApi = {
  getConfig: async () => {
    const res = await api.get<ApiResponse<Record<string, unknown>>>('/whatsapp/config');
    return res.data.data;
  },
  updateConfig: async (data: Record<string, unknown>) => {
    const res = await api.put<ApiResponse<unknown>>('/whatsapp/config', data);
    return res.data;
  },
  getLog: async (params?: Record<string, unknown>) => {
    const res = await api.get<PaginatedResponse<unknown>>('/whatsapp/log', { params });
    return res.data;
  },
  getLogByOrder: async (orderId: number) => {
    const res = await api.get<ApiResponse<unknown[]>>(`/whatsapp/log/order/${orderId}`);
    return res.data.data;
  },
  sendTest: async (phone: string) => {
    const res = await api.post<ApiResponse<{ success: boolean; messageId?: string; error?: string }>>('/whatsapp/test', { phone });
    return res.data.data;
  },
};

// Extracted Leads API
export const extractedLeadsApi = {
  list: async (params?: Record<string, unknown>) => {
    const res = await api.get<PaginatedResponse<unknown>>('/extracted-leads', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<ApiResponse<unknown>>(`/extracted-leads/${id}`);
    return res.data.data;
  },
  review: async (id: number, data: { status: string; notes?: string }) => {
    const res = await api.patch<ApiResponse<unknown>>(`/extracted-leads/${id}/review`, data);
    return res.data.data;
  },
  bulkReview: async (data: { ids: number[]; status: string }) => {
    const res = await api.post<ApiResponse<unknown>>('/extracted-leads/bulk-review', data);
    return res.data.data;
  },
  getStats: async () => {
    const res = await api.get<ApiResponse<unknown>>('/extracted-leads/stats');
    return res.data.data;
  },
  getHistory: async () => {
    const res = await api.get<ApiResponse<unknown[]>>('/extracted-leads/history');
    return res.data.data;
  },
  trigger: async () => {
    const res = await api.post<ApiResponse<{ count: number }>>('/extracted-leads/trigger');
    return res.data.data;
  },
};

// Email API
export const emailApi = {
  send: async (data: Record<string, unknown>) => {
    const res = await api.post<ApiResponse<unknown>>('/email/send', data);
    return res.data.data;
  },
  bulkSend: async (data: { leadIds: number[]; templateId: number }) => {
    const res = await api.post<ApiResponse<unknown>>('/email/bulk-send', data);
    return res.data.data;
  },
  getLog: async (params?: Record<string, unknown>) => {
    const res = await api.get<PaginatedResponse<unknown>>('/email/log', { params });
    return res.data;
  },
  getStats: async () => {
    const res = await api.get<ApiResponse<unknown>>('/email/stats');
    return res.data.data;
  },
  getConfig: async () => {
    const res = await api.get<ApiResponse<unknown>>('/email/config');
    return res.data.data;
  },
  updateConfig: async (data: Record<string, unknown>) => {
    const res = await api.put<ApiResponse<unknown>>('/email/config', data);
    return res.data;
  },
  testConnection: async () => {
    const res = await api.post<ApiResponse<{ success: boolean; error?: string }>>('/email/test-connection');
    return res.data.data;
  },
  listTemplates: async () => {
    const res = await api.get<ApiResponse<unknown[]>>('/email/templates');
    return res.data.data;
  },
  getTemplate: async (id: number) => {
    const res = await api.get<ApiResponse<unknown>>(`/email/templates/${id}`);
    return res.data.data;
  },
  createTemplate: async (data: Record<string, unknown>) => {
    const res = await api.post<ApiResponse<unknown>>('/email/templates', data);
    return res.data.data;
  },
  updateTemplate: async (id: number, data: Record<string, unknown>) => {
    const res = await api.put<ApiResponse<unknown>>(`/email/templates/${id}`, data);
    return res.data.data;
  },
  deleteTemplate: async (id: number): Promise<void> => {
    await api.delete(`/email/templates/${id}`);
  },
};

// Call Tracker API
export const callTrackerApi = {
  ...createCrudApi('/call-tracker'),
  getStats: async (params?: Record<string, unknown>) => {
    const res = await api.get<ApiResponse<unknown>>('/call-tracker/stats', { params });
    return res.data.data;
  },
  getDailyTarget: async () => {
    const res = await api.get<ApiResponse<unknown>>('/call-tracker/daily-target');
    return res.data.data;
  },
  getFollowUps: async (params?: Record<string, unknown>) => {
    const res = await api.get<ApiResponse<unknown[]>>('/call-tracker/follow-ups', { params });
    return res.data.data;
  },
  getAnalytics: async (params?: Record<string, unknown>) => {
    const res = await api.get<ApiResponse<unknown>>('/call-tracker/analytics', { params });
    return res.data.data;
  },
  completeFollowUp: async (id: number) => {
    const res = await api.patch<ApiResponse<unknown>>(`/call-tracker/${id}/complete-follow-up`);
    return res.data.data;
  },
};

// CRM Dashboard API
export const crmDashboardApi = {
  getSummary: async () => {
    const res = await api.get<ApiResponse<unknown>>('/crm-dashboard/summary');
    return res.data.data;
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
