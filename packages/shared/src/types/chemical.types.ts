import { ChemicalCategory, ChemicalUnit, PaginationQuery, DateRangeQuery } from './common.types';

export interface Chemical {
  id: number;
  name: string;
  category: ChemicalCategory;
  unit: ChemicalUnit;
  currentStock: number;
  minimumStock: number;
  costPerUnit?: number;
  supplier?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChemicalRequest {
  name: string;
  category: ChemicalCategory;
  unit?: ChemicalUnit;
  currentStock?: number;
  minimumStock?: number;
  costPerUnit?: number;
  supplier?: string;
  notes?: string;
}

export interface ChemicalUsage {
  id: number;
  chemicalId: number;
  pondId: number;
  usageDate: string;
  quantityUsed: number;
  unit: string;
  purpose?: string;
  aiRecommended: boolean;
  recommendedQty?: number;
  recordedBy?: number;
  notes?: string;
  createdAt: string;
}

export interface CreateChemicalUsageRequest {
  chemicalId: number;
  pondId: number;
  usageDate: string;
  quantityUsed: number;
  unit: string;
  purpose?: string;
  aiRecommended?: boolean;
  recommendedQty?: number;
  notes?: string;
}

export interface ChemicalFilters extends PaginationQuery {
  category?: ChemicalCategory;
  lowStock?: boolean;
  search?: string;
}

export interface ChemicalUsageFilters extends PaginationQuery, DateRangeQuery {
  chemicalId?: number;
  pondId?: number;
}

export interface DosingCalculation {
  chemicalName: string;
  currentPpm: number;
  targetPpm: number;
  pondVolumeLiters: number;
  purityFraction: number;
  requiredKg: number;
  notes?: string;
}
