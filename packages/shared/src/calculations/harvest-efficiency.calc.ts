/**
 * Calculate expected dry yield from wet harvest
 */
export function calculateExpectedDryYield(
  wetHarvestKg: number,
  solidsPercentage: number,
): number {
  return wetHarvestKg * (solidsPercentage / 100);
}

/**
 * Calculate wet-to-dry conversion ratio
 */
export function calculateWetToDryRatio(
  powderOutputKg: number,
  wetInputKg: number,
): number {
  if (wetInputKg <= 0) return 0;
  return powderOutputKg / wetInputKg;
}

/**
 * Calculate drying efficiency percentage
 */
export function calculateDryingEfficiency(
  powderOutputKg: number,
  wetInputKg: number,
  solidsPercentage: number,
): number {
  const expectedDry = calculateExpectedDryYield(wetInputKg, solidsPercentage);
  if (expectedDry <= 0) return 0;
  return (powderOutputKg / expectedDry) * 100;
}

/**
 * Estimate biomass concentration (g/L) from Secchi disk depth or OD
 */
export function estimateBiomassConcentration(
  secchiDepthCm: number,
): number {
  // Rough empirical relationship: biomass (g/L) ~ 0.5 / secchi depth (cm)
  // Lower Secchi = denser culture
  if (secchiDepthCm <= 0) return 0;
  return Math.round((50 / secchiDepthCm) * 100) / 100;
}
