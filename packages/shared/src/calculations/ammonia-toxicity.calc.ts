import { HealthStatus } from '../types/common.types';

/**
 * Calculate the un-ionized (toxic) fraction of ammonia
 * using the Henderson-Hasselbalch relationship.
 *
 * At high pH (>9.0), a larger fraction of total ammonia
 * exists in the toxic un-ionized form (NH3).
 */
export function calculateUnionizedAmmoniaFraction(
  ph: number,
  temperatureC: number,
): number {
  // pKa of ammonia at given temperature
  const pKa = 0.09018 + 2729.92 / (temperatureC + 273.15);
  const fraction = 1 / (1 + Math.pow(10, pKa - ph));
  return fraction;
}

/**
 * Calculate toxic ammonia concentration (un-ionized NH3)
 */
export function calculateToxicAmmonia(
  totalAmmoniaMgL: number,
  ph: number,
  temperatureC: number,
): number {
  const fraction = calculateUnionizedAmmoniaFraction(ph, temperatureC);
  return totalAmmoniaMgL * fraction;
}

/**
 * Assess ammonia risk for Spirulina cultivation
 * At pH 9.8 (typical for spirulina), a much larger fraction
 * of ammonia is in toxic form
 */
export function assessAmmoniaRisk(
  totalAmmoniaMgL: number,
  ph: number,
  temperatureC: number = 30,
): HealthStatus {
  const toxicAmmonia = calculateToxicAmmonia(totalAmmoniaMgL, ph, temperatureC);

  // Toxic NH3 thresholds for Spirulina
  if (toxicAmmonia > 0.05) return 'RED'; // Severely toxic
  if (toxicAmmonia > 0.02) return 'YELLOW'; // Approaching toxic

  // Also check raw ammonia levels
  if (ph >= 9.8 && totalAmmoniaMgL > 0.5) return 'RED';
  if (ph >= 9.5 && totalAmmoniaMgL > 0.3) return 'YELLOW';

  return 'GREEN';
}
