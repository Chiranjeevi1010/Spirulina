import { HarvestMethod, DryerType, PaginationQuery, DateRangeQuery } from './common.types';

export interface Harvest {
  id: number;
  pondId: number;
  harvestDate: string;
  wetHarvestKg: number;
  solidsPercentage?: number;
  dryYieldPercentage?: number;
  harvestMethod: HarvestMethod;
  notes?: string;
  recordedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHarvestRequest {
  pondId: number;
  harvestDate: string;
  wetHarvestKg: number;
  solidsPercentage?: number;
  dryYieldPercentage?: number;
  harvestMethod?: HarvestMethod;
  notes?: string;
}

export interface Production {
  id: number;
  harvestId?: number;
  productionDate: string;
  wetInputKg: number;
  dryerType: DryerType;
  dryingTimeHours?: number;
  finalMoisturePct?: number;
  powderOutputKg: number;
  wetToDryRatio?: number;
  efficiencyPct?: number;
  costPerKgDry?: number;
  batchId?: number;
  notes?: string;
  recordedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductionRequest {
  harvestId?: number;
  productionDate: string;
  wetInputKg: number;
  dryerType: DryerType;
  dryingTimeHours?: number;
  finalMoisturePct?: number;
  powderOutputKg: number;
  batchId?: number;
  notes?: string;
}

export interface HarvestFilters extends PaginationQuery, DateRangeQuery {
  pondId?: number;
}

export interface ProductionFilters extends PaginationQuery, DateRangeQuery {
  dryerType?: DryerType;
}

export interface EfficiencyMetrics {
  totalWetHarvestKg: number;
  totalPowderOutputKg: number;
  avgWetToDryRatio: number;
  avgEfficiencyPct: number;
  avgCostPerKgDry: number;
}
