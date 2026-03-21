export const MEASUREMENT_UNITS = {
  weight: ['kg', 'grams', 'mg', 'tonnes'] as const,
  volume: ['liters', 'ml', 'gallons'] as const,
  length: ['meters', 'cm', 'mm', 'feet'] as const,
  temperature: ['celsius', 'fahrenheit'] as const,
  concentration: ['ppm', 'mg/L', 'g/L', '%'] as const,
  time: ['hours', 'minutes', 'days'] as const,
  area: ['acres', 'hectares', 'sq_meters'] as const,
  currency: ['INR'] as const,
} as const;

export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_CURRENCY_SYMBOL = '₹';
