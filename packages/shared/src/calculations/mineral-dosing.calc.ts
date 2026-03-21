/**
 * Calculate mineral dosing required to reach target concentration
 *
 * @param currentPpm - Current concentration in ppm (mg/L)
 * @param targetPpm - Target concentration in ppm (mg/L)
 * @param volumeLiters - Pond volume in liters
 * @param purityFraction - Purity of the chemical (0-1, e.g., 0.99 for 99% pure)
 * @returns Required quantity in kg
 */
export function calculateDosingKg(
  currentPpm: number,
  targetPpm: number,
  volumeLiters: number,
  purityFraction: number = 1.0,
): number {
  if (targetPpm <= currentPpm) return 0;
  if (purityFraction <= 0 || purityFraction > 1) purityFraction = 1;

  // ppm = mg/L, so difference in mg/L * liters = mg needed
  // Convert mg to kg: divide by 1,000,000
  const dosageKg = ((targetPpm - currentPpm) * volumeLiters) / (purityFraction * 1_000_000);
  return Math.round(dosageKg * 1000) / 1000; // Round to 3 decimal places (grams)
}

/**
 * Calculate dosing for common Spirulina chemicals per 100,000 liters
 */
export function calculateDosingPer100KL(
  currentPpm: number,
  targetPpm: number,
  purityFraction: number = 1.0,
): number {
  return calculateDosingKg(currentPpm, targetPpm, 100_000, purityFraction);
}

/**
 * Common dosing targets for Spirulina cultivation
 */
export const DOSING_TARGETS = {
  sodium_bicarbonate: { targetPpm: 16000, purity: 0.99, label: 'Sodium Bicarbonate (NaHCO3)' },
  urea: { targetPpm: 200, purity: 0.46, label: 'Urea (CO(NH2)2)' }, // 46% nitrogen content
  dap: { targetPpm: 100, purity: 0.46, label: 'DAP (Diammonium Phosphate)' },
  magnesium_sulfate: { targetPpm: 300, purity: 0.10, label: 'Magnesium Sulfate (MgSO4)' }, // ~10% Mg
  iron_sulfate: { targetPpm: 2, purity: 0.20, label: 'Iron Sulfate (FeSO4)' }, // ~20% Fe
} as const;

/**
 * Check if a dosage would cause over-dosing
 */
export function isOverDose(
  currentPpm: number,
  addedPpm: number,
  maxSafePpm: number,
): boolean {
  return currentPpm + addedPpm > maxSafePpm;
}

/**
 * Calculate ppm increase from adding a quantity of chemical
 */
export function calculatePpmIncrease(
  quantityKg: number,
  volumeLiters: number,
  purityFraction: number = 1.0,
): number {
  if (volumeLiters <= 0) return 0;
  return (quantityKg * purityFraction * 1_000_000) / volumeLiters;
}
