import { ExpenseStatus, PaginationQuery, DateRangeQuery } from './common.types';

export interface ExpenseCategory {
  id: number;
  name: string;
  parentId?: number;
  description?: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  categoryId: number;
  category?: ExpenseCategory;
  expenseDate: string;
  description: string;
  amount: number;
  quantity?: number;
  unit?: string;
  unitCost?: number;
  vendor?: string;
  receiptUrl?: string;
  pondId?: number;
  isRecurring: boolean;
  recurrenceInterval?: string;
  recordedBy?: number;
  approvedBy?: number;
  status: ExpenseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  categoryId: number;
  expenseDate: string;
  description: string;
  amount: number;
  quantity?: number;
  unit?: string;
  unitCost?: number;
  vendor?: string;
  receiptUrl?: string;
  pondId?: number;
  isRecurring?: boolean;
  recurrenceInterval?: string;
}

export interface ExpenseFilters extends PaginationQuery, DateRangeQuery {
  categoryId?: number;
  status?: ExpenseStatus;
  pondId?: number;
}

export interface CostAnalysis {
  totalExpenses: number;
  costPerKgWet: number;
  costPerKgDry: number;
  breakEvenPricePerKg: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
}
