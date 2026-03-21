import { HealthStatus } from './common.types';

export interface DashboardKPIs {
  productionToday: { wetKg: number; dryKg: number };
  salesToday: { revenue: number; orders: number };
  activePonds: number;
  totalPonds: number;
  avgRiskScore: number;
  overallHealth: HealthStatus;
  revenueThisMonth: number;
  expensesThisMonth: number;
  stockLevels: {
    wetStockKg: number;
    dryStockKg: number;
    powderKg: number;
  };
  harvestEfficiencyPct: number;
  alertsCount: { critical: number; warning: number; info: number };
}

export interface ProductionReport {
  period: { start: string; end: string };
  totalWetHarvestKg: number;
  totalDryOutputKg: number;
  avgEfficiency: number;
  avgCostPerKg: number;
  dailyData: {
    date: string;
    wetKg: number;
    dryKg: number;
    efficiency: number;
  }[];
  byPond: {
    pondId: number;
    pondName: string;
    totalWetKg: number;
    totalDryKg: number;
    efficiency: number;
  }[];
}

export interface SalesReport {
  period: { start: string; end: string };
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  byCustomerType: {
    type: string;
    revenue: number;
    orders: number;
  }[];
  topCustomers: {
    customerId: number;
    customerName: string;
    revenue: number;
    orders: number;
  }[];
  paymentSummary: {
    paid: number;
    unpaid: number;
    overdue: number;
  };
}

export interface ExpenseReport {
  period: { start: string; end: string };
  totalExpenses: number;
  byCategory: {
    categoryName: string;
    amount: number;
    percentage: number;
  }[];
  costPerKg: {
    wet: number;
    dry: number;
  };
  monthlyTrend: {
    month: string;
    amount: number;
  }[];
}

export interface ReportExportRequest {
  reportType: 'production' | 'sales' | 'expenses' | 'inventory' | 'pond_health';
  format: 'pdf' | 'excel';
  startDate: string;
  endDate: string;
  filters?: Record<string, unknown>;
}
