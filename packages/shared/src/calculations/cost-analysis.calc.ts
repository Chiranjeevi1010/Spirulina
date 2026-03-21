/**
 * Calculate cost per kg of wet spirulina
 */
export function calculateCostPerKgWet(
  totalExpenses: number,
  totalWetOutputKg: number,
): number {
  if (totalWetOutputKg <= 0) return 0;
  return Math.round((totalExpenses / totalWetOutputKg) * 100) / 100;
}

/**
 * Calculate cost per kg of dry spirulina powder
 */
export function calculateCostPerKgDry(
  totalExpenses: number,
  totalDryOutputKg: number,
): number {
  if (totalDryOutputKg <= 0) return 0;
  return Math.round((totalExpenses / totalDryOutputKg) * 100) / 100;
}

/**
 * Calculate break-even selling price per kg
 * Includes desired profit margin
 */
export function calculateBreakEvenPrice(
  costPerKg: number,
  desiredMarginPct: number = 20,
): number {
  return Math.round((costPerKg / (1 - desiredMarginPct / 100)) * 100) / 100;
}

/**
 * Calculate profit margin percentage
 */
export function calculateMarginPct(
  sellingPrice: number,
  costPrice: number,
): number {
  if (sellingPrice <= 0) return 0;
  return Math.round(((sellingPrice - costPrice) / sellingPrice) * 10000) / 100;
}
