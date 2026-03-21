import api from './api';
import type { ApiResponse } from '@spirulina/shared';

export interface DashboardKPIs {
  totalActivePonds: number;
  pondsByHealth: Array<{ healthStatus: string; count: number }>;
  totalHarvestThisMonth: number;
  harvestCountThisMonth: number;
  totalProductionThisMonth: number;
  totalRevenueThisMonth: number;
  totalExpensesThisMonth: number;
  pendingOrders: number;
  lowStockChemicals: number;
  activeLeads: number;
  expiringBatches: number;
}

export interface RecentActivity {
  id: number;
  type: string;
  description: string;
  date: string;
  createdAt: string;
}

export const dashboardApi = {
  getKPIs: async (): Promise<DashboardKPIs> => {
    const res = await api.get<ApiResponse<DashboardKPIs>>('/dashboard/kpis');
    return res.data.data!;
  },

  getRecentActivities: async (): Promise<RecentActivity[]> => {
    const res = await api.get<ApiResponse<RecentActivity[]>>('/dashboard/recent-activities');
    return res.data.data!;
  },
};
