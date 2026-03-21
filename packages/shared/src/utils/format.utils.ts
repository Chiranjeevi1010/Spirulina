import { DEFAULT_CURRENCY_SYMBOL } from '../constants/units.constants';

/**
 * Format number with commas (Indian numbering system)
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency (INR)
 */
export function formatCurrency(value: number): string {
  return `${DEFAULT_CURRENCY_SYMBOL}${formatNumber(value, 2)}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format weight (kg)
 */
export function formatWeight(valueKg: number, decimals: number = 2): string {
  if (valueKg >= 1000) {
    return `${(valueKg / 1000).toFixed(1)} tonnes`;
  }
  if (valueKg < 1) {
    return `${(valueKg * 1000).toFixed(0)} g`;
  }
  return `${valueKg.toFixed(decimals)} kg`;
}

/**
 * Format volume (liters)
 */
export function formatVolume(valueLiters: number): string {
  if (valueLiters >= 1000) {
    return `${formatNumber(valueLiters / 1000, 1)} KL`;
  }
  return `${formatNumber(valueLiters, 0)} L`;
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number = 50): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
