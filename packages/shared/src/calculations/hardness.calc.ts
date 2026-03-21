import { HealthStatus } from '../types/common.types';

/**
 * Calculate effective hardness after evaporation loss
 * As water evaporates, minerals concentrate
 */
export function calculateEffectiveHardness(
  currentHardness: number,
  evaporationPctLoss: number,
): number {
  if (evaporationPctLoss >= 100) return Infinity;
  return currentHardness * (1 / (1 - evaporationPctLoss / 100));
}

/**
 * Assess hardness risk level
 */
export function assessHardnessRisk(totalHardness: number): HealthStatus {
  if (totalHardness > 3000) return 'RED';
  if (totalHardness > 2500) return 'YELLOW';
  return 'GREEN';
}

/**
 * Calculate required partial drain percentage to reduce hardness
 * from current level to target level
 */
export function calculatePartialDrainPct(
  currentHardness: number,
  targetHardness: number,
): number {
  if (currentHardness <= targetHardness) return 0;
  // After draining X% and refilling with freshwater (hardness ~0):
  // newHardness = currentHardness * (1 - X/100)
  // X = (1 - target/current) * 100
  const drainPct = (1 - targetHardness / currentHardness) * 100;
  return Math.max(0, Math.min(drainPct, 80)); // Safety cap at 80%
}

/**
 * Calculate dilution needed to reduce Mg from current to target
 */
export function calculateMgDilution(
  currentMg: number,
  targetMg: number,
  currentVolumeLiters: number,
): { drainLiters: number; drainPct: number } {
  if (currentMg <= targetMg) return { drainLiters: 0, drainPct: 0 };
  const drainPct = (1 - targetMg / currentMg) * 100;
  const drainLiters = currentVolumeLiters * (drainPct / 100);
  return {
    drainLiters: Math.round(drainLiters),
    drainPct: Math.round(drainPct * 10) / 10,
  };
}
