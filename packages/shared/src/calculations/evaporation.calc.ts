/**
 * Estimate daily evaporation percentage based on temperature and depth
 * Simplified model - in production, incorporate wind speed and humidity
 */
export function calculateEvaporationPct(
  temperatureC: number,
  depthM: number,
  windSpeedKmh: number = 10,
): number {
  if (depthM <= 0) return 0;
  // Simplified evaporation model
  const evapPct = (temperatureC * 0.15 + windSpeedKmh * 0.05) / (depthM * 100);
  return Math.max(0, Math.min(evapPct * 100, 10)); // Cap at 10% per day
}

/**
 * Calculate water loss in liters from depth drop
 */
export function calculateWaterLossFromDepthDrop(
  lengthM: number,
  widthM: number,
  depthDropM: number,
): number {
  return lengthM * widthM * depthDropM * 1000;
}

/**
 * Calculate required water top-up volume in liters
 */
export function calculateTopUpVolume(
  lengthM: number,
  widthM: number,
  currentDepthM: number,
  targetDepthM: number,
): number {
  if (currentDepthM >= targetDepthM) return 0;
  return lengthM * widthM * (targetDepthM - currentDepthM) * 1000;
}
