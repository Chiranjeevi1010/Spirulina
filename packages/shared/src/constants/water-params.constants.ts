import { HealthStatus } from '../types/common.types';

export interface ParameterRange {
  min: number;
  max: number;
  unit: string;
  label: string;
  warningLow?: number;
  warningHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export const WATER_PARAMETER_RANGES: Record<string, ParameterRange> = {
  temperature: {
    min: 25,
    max: 38,
    unit: '°C',
    label: 'Temperature',
    warningLow: 20,
    warningHigh: 40,
    criticalLow: 15,
    criticalHigh: 42,
  },
  ph: {
    min: 9.0,
    max: 10.5,
    unit: '',
    label: 'pH',
    warningLow: 8.5,
    warningHigh: 11.0,
    criticalLow: 8.0,
    criticalHigh: 11.5,
  },
  dissolvedOxygen: {
    min: 5.0,
    max: 20.0,
    unit: 'mg/L',
    label: 'Dissolved Oxygen',
    warningLow: 5.0,
    criticalLow: 3.0,
  },
  salinity: {
    min: 10,
    max: 30,
    unit: 'ppt',
    label: 'Salinity',
    warningHigh: 35,
    criticalHigh: 40,
  },
  alkalinity: {
    min: 2000,
    max: 5000,
    unit: 'mg/L',
    label: 'Alkalinity',
    warningLow: 1500,
    criticalLow: 1000,
  },
  carbonate: {
    min: 500,
    max: 2500,
    unit: 'mg/L',
    label: 'Carbonate (CO3)',
  },
  bicarbonate: {
    min: 1000,
    max: 5000,
    unit: 'mg/L',
    label: 'Bicarbonate (HCO3)',
  },
  totalHardness: {
    min: 500,
    max: 2500,
    unit: 'mg/L',
    label: 'Total Hardness',
    warningHigh: 2500,
    criticalHigh: 3000,
  },
  calcium: {
    min: 20,
    max: 100,
    unit: 'ppm',
    label: 'Calcium (Ca)',
    warningHigh: 150,
    criticalHigh: 200,
  },
  magnesium: {
    min: 150,
    max: 300,
    unit: 'ppm',
    label: 'Magnesium (Mg)',
    warningHigh: 350,
    criticalHigh: 400,
  },
  ammonia: {
    min: 0,
    max: 0.3,
    unit: 'mg/L',
    label: 'Ammonia (NH3)',
    warningHigh: 0.3,
    criticalHigh: 0.5,
  },
  nitrite: {
    min: 0,
    max: 0.5,
    unit: 'mg/L',
    label: 'Nitrite (NO2)',
    warningHigh: 0.5,
    criticalHigh: 1.0,
  },
  nitrate: {
    min: 0,
    max: 50,
    unit: 'mg/L',
    label: 'Nitrate (NO3)',
    warningHigh: 50,
    criticalHigh: 100,
  },
};

export const OPTIMAL_MG_RANGE = { min: 250, max: 300 }; // ppm

export function getParameterStatus(
  paramKey: string,
  value: number,
): HealthStatus {
  const range = WATER_PARAMETER_RANGES[paramKey];
  if (!range) return 'GREEN';

  if (
    (range.criticalLow !== undefined && value < range.criticalLow) ||
    (range.criticalHigh !== undefined && value > range.criticalHigh)
  ) {
    return 'RED';
  }

  if (
    (range.warningLow !== undefined && value < range.warningLow) ||
    (range.warningHigh !== undefined && value > range.warningHigh)
  ) {
    return 'YELLOW';
  }

  if (value < range.min || value > range.max) {
    return 'YELLOW';
  }

  return 'GREEN';
}
