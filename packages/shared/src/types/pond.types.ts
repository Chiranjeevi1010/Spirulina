import {
  PondStatus,
  PondType,
  HealthStatus,
  ReadingTime,
  FoamLevel,
  PaginationQuery,
  DateRangeQuery,
} from './common.types';

export interface Pond {
  id: number;
  name: string;
  code: string;
  lengthM: number;
  widthM: number;
  depthM: number;
  volumeLiters: number;
  pondType: PondType;
  location?: string;
  status: PondStatus;
  healthStatus: HealthStatus;
  dateCommissioned?: string;
  notes?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePondRequest {
  name: string;
  code: string;
  lengthM: number;
  widthM: number;
  depthM: number;
  pondType?: PondType;
  location?: string;
  status?: PondStatus;
  dateCommissioned?: string;
  notes?: string;
}

export interface UpdatePondRequest extends Partial<CreatePondRequest> {}

export interface PondFilters extends PaginationQuery {
  status?: PondStatus;
  healthStatus?: HealthStatus;
  search?: string;
}

// === Water Parameters ===
export interface WaterParameter {
  id: number;
  pondId: number;
  readingDate: string;
  readingTime: ReadingTime;

  temperatureC?: number;
  ph?: number;
  dissolvedOxygen?: number;
  salinityPpt?: number;
  alkalinity?: number;
  carbonateCo3?: number;
  bicarbonateHco3?: number;

  totalHardness?: number;
  calciumCa?: number;
  magnesiumMg?: number;
  sodiumNa?: number;
  potassiumK?: number;

  totalAmmonia?: number;
  ammoniaNh3?: number;
  nitriteNo2?: number;
  nitrateNo3?: number;

  foamLevel?: FoamLevel;
  paddleWheelRpm?: number;
  harvestPercentage?: number;

  ammoniaRisk: HealthStatus;
  doRisk: HealthStatus;
  hardnessRisk: HealthStatus;
  overallRisk: HealthStatus;

  recordedBy?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWaterParameterRequest {
  readingDate: string;
  readingTime: ReadingTime;
  temperatureC?: number;
  ph?: number;
  dissolvedOxygen?: number;
  salinityPpt?: number;
  alkalinity?: number;
  carbonateCo3?: number;
  bicarbonateHco3?: number;
  totalHardness?: number;
  calciumCa?: number;
  magnesiumMg?: number;
  sodiumNa?: number;
  potassiumK?: number;
  totalAmmonia?: number;
  ammoniaNh3?: number;
  nitriteNo2?: number;
  nitrateNo3?: number;
  foamLevel?: FoamLevel;
  paddleWheelRpm?: number;
  harvestPercentage?: number;
  notes?: string;
}

export interface WaterParameterFilters extends PaginationQuery, DateRangeQuery {
  readingTime?: ReadingTime;
}

export interface ParameterTrend {
  date: string;
  value: number;
  risk: HealthStatus;
}

export interface PondHealthSummary {
  pondId: number;
  pondName: string;
  healthStatus: HealthStatus;
  latestReading?: WaterParameter;
  risks: {
    ammonia: HealthStatus;
    dissolvedOxygen: HealthStatus;
    hardness: HealthStatus;
    magnesium: HealthStatus;
  };
  recommendations: string[];
}
