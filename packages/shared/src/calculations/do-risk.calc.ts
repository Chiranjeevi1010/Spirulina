import { HealthStatus } from '../types/common.types';

/**
 * Assess dissolved oxygen risk level
 * Spirulina needs adequate DO for healthy growth
 */
export function assessDORisk(dissolvedOxygenMgL: number): HealthStatus {
  if (dissolvedOxygenMgL < 3.0) return 'RED'; // Crash imminent
  if (dissolvedOxygenMgL < 5.0) return 'YELLOW'; // Warning
  return 'GREEN';
}

/**
 * Suggest paddle wheel RPM adjustment based on DO level
 */
export function suggestPaddleWheelAdjustment(
  currentDO: number,
  currentRPM: number,
): { suggestedRPM: number; action: string } {
  if (currentDO < 3.0) {
    return {
      suggestedRPM: Math.min(currentRPM * 1.5, 100),
      action: 'INCREASE IMMEDIATELY - DO critically low',
    };
  }
  if (currentDO < 5.0) {
    return {
      suggestedRPM: Math.min(currentRPM * 1.2, 100),
      action: 'Increase aeration - DO below optimal',
    };
  }
  if (currentDO > 15.0) {
    return {
      suggestedRPM: Math.max(currentRPM * 0.9, 10),
      action: 'Slightly reduce - DO is high (supersaturated)',
    };
  }
  return {
    suggestedRPM: currentRPM,
    action: 'No change needed - DO is optimal',
  };
}
