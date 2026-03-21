/**
 * Calculate pond volume in liters from dimensions in meters
 */
export function calculatePondVolume(lengthM: number, widthM: number, depthM: number): number {
  return lengthM * widthM * depthM * 1000;
}

/**
 * Calculate surface area in square meters
 */
export function calculateSurfaceArea(lengthM: number, widthM: number): number {
  return lengthM * widthM;
}
