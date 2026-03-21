// === API Response Types ===
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

// === Query Types ===
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

// === Enums ===
export type PondStatus = 'active' | 'inactive' | 'maintenance' | 'seeding';
export type PondType = 'open_raceway' | 'closed_tank' | 'tubular';
export type HealthStatus = 'RED' | 'YELLOW' | 'GREEN';
export type ReadingTime = 'morning' | 'noon' | 'evening';
export type FoamLevel = 'none' | 'low' | 'medium' | 'high';

export type HarvestMethod = 'filtration' | 'centrifuge' | 'screen';
export type DryerType = 'solar' | 'tray' | 'spray' | 'drum';

export type ChemicalCategory = 'nutrient' | 'mineral' | 'trace_element' | 'buffer';
export type ChemicalUnit = 'kg' | 'liters' | 'grams';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export type CustomerType =
  | 'shrimp_farmer'
  | 'fish_farmer'
  | 'nutraceutical'
  | 'retail'
  | 'export';

export type LeadSource =
  | 'referral'
  | 'website'
  | 'trade_show'
  | 'cold_call'
  | 'social_media';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export type ProductType = 'wet_spirulina' | 'dry_powder' | 'capsules' | 'tablets';
export type StockType = 'wet_stock' | 'dry_stock' | 'powder';
export type BatchStatus = 'available' | 'reserved' | 'sold' | 'expired' | 'recalled';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType =
  | 'ammonia_spike'
  | 'do_crash'
  | 'hardness_high'
  | 'mineral_overload'
  | 'over_harvest'
  | 'mg_accumulation'
  | 'low_stock';

export type AIProvider = 'claude' | 'openai';
export type AIContextType = 'pond_health' | 'dosing' | 'general' | 'risk_report';

export type UserRole = 'admin' | 'manager' | 'lab_technician' | 'sales_team';

// === Permission Types ===
export type PermissionAction = 'read' | 'write' | 'delete' | 'approve' | 'export';

export type PermissionResource =
  | 'ponds'
  | 'water_params'
  | 'harvest'
  | 'chemicals'
  | 'expenses'
  | 'customers'
  | 'leads'
  | 'orders'
  | 'inventory'
  | 'marketing'
  | 'ai'
  | 'reports'
  | 'settings'
  | 'users';

export type Permissions = Partial<Record<PermissionResource, PermissionAction[]>>;
