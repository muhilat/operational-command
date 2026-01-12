/**
 * Defensive Guards Utility
 * 
 * Provides safe-access patterns for all metrics to prevent crashes.
 * Philosophy: "If data is missing, return AMBER state, don't crash."
 */

/**
 * Safe access to staffing gap with fallback
 */
export function getStaffingGap(
  scheduled: number | undefined | null,
  actual: number | undefined | null
): number {
  if (scheduled === undefined || scheduled === null) return 0;
  if (actual === undefined || actual === null) return 0;
  return Math.max(0, scheduled - actual);
}

/**
 * Safe access to revenue delta with fallback
 */
export function getRevenueDelta(
  revenue: number | undefined | null
): number {
  if (revenue === undefined || revenue === null) return 0;
  return Math.max(0, revenue);
}

/**
 * Safe access to census with fallback calculation
 */
export function getCensus(
  census: number | undefined | null,
  cnaScheduledHours: number = 0
): number {
  if (census !== undefined && census !== null && census > 0) {
    return census;
  }
  // Fallback: Estimate from CNA hours (1.8 hours per resident per day)
  return Math.round(cnaScheduledHours / 1.8) || 0;
}

/**
 * Safe access to intensity with AMBER fallback
 */
export function getIntensitySafely(
  intensity: 'Low' | 'Elevated' | 'Critical' | undefined | null
): 'Low' | 'Elevated' | 'Critical' {
  if (intensity === 'Low' || intensity === 'Elevated' || intensity === 'Critical') {
    return intensity;
  }
  // AMBER state: Missing data = Elevated (requires attention)
  return 'Elevated';
}

/**
 * AMBER State Helper
 * Returns standardized AMBER state object for degraded data
 */
export interface AmberState {
  status: 'AMBER';
  label: 'Attention Degraded';
  subtext: 'Sync Required';
  intensity: 'Elevated';
}

export function getAmberState(): AmberState {
  return {
    status: 'AMBER',
    label: 'Attention Degraded',
    subtext: 'Sync Required',
    intensity: 'Elevated',
  };
}

/**
 * Safe access to facility metrics with AMBER fallback
 */
export function getFacilityMetricsSafely(facility: {
  staffingDetails?: {
    rn?: Array<{ scheduled?: number; actual?: number }>;
    lpn?: Array<{ scheduled?: number; actual?: number }>;
    cna?: Array<{ scheduled?: number; actual?: number }>;
  };
  revenueDetails?: {
    observedAcuity?: string;
    billingStatus?: string;
    dailyMismatch?: number;
  };
  intensity?: 'Low' | 'Elevated' | 'Critical';
}): {
  staffingGap: number;
  revenueDelta: number;
  intensity: 'Low' | 'Elevated' | 'Critical';
  isAmber: boolean;
} {
  // Safe staffing gap calculation
  const rnGap = getStaffingGap(
    facility.staffingDetails?.rn?.[0]?.scheduled,
    facility.staffingDetails?.rn?.[0]?.actual
  );
  
  // Safe revenue delta
  const revenueDelta = getRevenueDelta(facility.revenueDetails?.dailyMismatch);
  
  // Safe intensity
  const intensity = getIntensitySafely(facility.intensity);
  
  // Determine if AMBER state (missing critical data)
  const isAmber = 
    facility.staffingDetails === undefined ||
    facility.revenueDetails === undefined ||
    intensity === 'Elevated' && (rnGap === 0 && revenueDelta === 0);
  
  return {
    staffingGap: rnGap,
    revenueDelta,
    intensity,
    isAmber,
  };
}




