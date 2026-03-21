import { StockType, BatchStatus, PaginationQuery, DateRangeQuery } from './common.types';

export interface InventoryItem {
  id: number;
  productType: StockType;
  currentQuantity: number;
  unit: string;
  location?: string;
  lastUpdated: string;
  createdAt: string;
}

export interface Batch {
  id: number;
  batchNumber: string;
  productType: string;
  quantity: number;
  unit: string;
  productionDate: string;
  expiryDate: string;
  status: BatchStatus;
  sourcePondId?: number;
  moistureContent?: number;
  proteinContent?: number;
  notes?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchRequest {
  productType: string;
  quantity: number;
  unit: string;
  productionDate: string;
  expiryDate: string;
  sourcePondId?: number;
  moistureContent?: number;
  proteinContent?: number;
  notes?: string;
}

export interface BatchTest {
  id: number;
  batchId: number;
  testDate: string;
  testType: string;
  parameter: string;
  value?: number;
  unit?: string;
  resultStatus: 'pass' | 'fail' | 'pending';
  labName?: string;
  certificateUrl?: string;
  testedBy?: number;
  createdAt: string;
}

export interface CreateBatchTestRequest {
  testDate: string;
  testType: string;
  parameter: string;
  value?: number;
  unit?: string;
  resultStatus?: 'pass' | 'fail' | 'pending';
  labName?: string;
  certificateUrl?: string;
}

export interface BatchFilters extends PaginationQuery, DateRangeQuery {
  productType?: string;
  status?: BatchStatus;
  sourcePondId?: number;
}

export interface BatchTraceability {
  batch: Batch;
  pond?: { id: number; name: string; code: string };
  harvest?: { id: number; harvestDate: string; wetHarvestKg: number };
  production?: { id: number; productionDate: string; powderOutputKg: number };
  orders?: { id: number; orderNumber: string; customerName: string }[];
  tests: BatchTest[];
}
