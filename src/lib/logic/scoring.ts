/**
 * Attention Score Calculation Logic
 * 
 * This module implements the "Brain" of VRT3X - the heuristic
 * algorithm that ranks facilities by operational stress level.
 * 
 * PRINCIPLE: We don't predict failures; we rank units by "Stress Level"
 * to help COOs decide where to look first.
 * 
 * SAFE HARBOR RULE: Never use words like "Negligence," "Error," or "Fault."
 * Replace with: "Attention Priority," "Operational Drift," or "Documentation Gap."
 */

import type { 
  Facility, 
  StaffingRecord, 
  IncidentSignal, 
  AcuityLevel,
  AttentionScoreResult 
} from '@/types/snf';

/**
 * Safe Harbor Filter - Sanitizes text to avoid legal liability language
 */
function applySafeHarborFilter(text: string): string {
  const replacements: Record<string, string> = {
    'negligence': 'Attention Priority',
    'error': 'Operational Drift',
    'fault': 'Documentation Gap',
    'failure': 'Operational Drift',
    'mistake': 'Documentation Gap',
    'blame': 'Attention Priority',
    'wrong': 'Operational Drift',
  };

  let sanitized = text;
  for (const [forbidden, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(forbidden, 'gi');
    sanitized = sanitized.replace(regex, replacement);
  }

  return sanitized;
}

/**
 * Calculate staffing gap severity
 */
function calculateStaffingGap(records: StaffingRecord[]): number {
  if (records.length === 0) return 0;

  let totalGap = 0;
  let totalScheduled = 0;

  for (const record of records) {
    const gap = Math.max(0, record.scheduled - record.actual);
    totalGap += gap;
    totalScheduled += record.scheduled;
  }

  if (totalScheduled === 0) return 0;
  
  // Return gap percentage (0-1 scale)
  return totalGap / totalScheduled;
}

/**
 * Calculate acuity mismatch severity
 */
function calculateAcuityMismatch(
  observed: AcuityLevel,
  billing: AcuityLevel
): number {
  const acuityValues: Record<AcuityLevel, number> = {
    'LOW': 1,
    'STANDARD': 2,
    'HIGH': 3,
    'CRITICAL': 4,
  };

  const observedValue = acuityValues[observed];
  const billingValue = acuityValues[billing];
  
  // If observed is higher than billing, there's a mismatch
  const mismatch = Math.max(0, observedValue - billingValue);
  
  // Normalize to 0-1 scale (max mismatch is 3, so divide by 3)
  return mismatch / 3;
}

/**
 * Detect incident signals from facility data
 */
function detectIncidentSignals(facility: Facility): IncidentSignal[] {
  const signals: IncidentSignal[] = [];
  const now = new Date();

  // Staffing gap signals
  const rnGap = calculateStaffingGap(facility.staffingDetails.rn);
  const lpnGap = calculateStaffingGap(facility.staffingDetails.lpn);
  const cnaGap = calculateStaffingGap(facility.staffingDetails.cna);

  if (rnGap > 0.15) {
    signals.push({
      id: `staffing-rn-${facility.id}-${now.getTime()}`,
      type: 'staffing',
      description: applySafeHarborFilter(`RN coverage gap detected: ${(rnGap * 100).toFixed(1)}% below scheduled`),
      severity: Math.min(100, rnGap * 200), // Scale to 0-100
      detectedAt: now,
      metadata: { role: 'RN', gapPercentage: rnGap },
    });
  }

  if (lpnGap > 0.15) {
    signals.push({
      id: `staffing-lpn-${facility.id}-${now.getTime()}`,
      type: 'staffing',
      description: applySafeHarborFilter(`LPN coverage gap detected: ${(lpnGap * 100).toFixed(1)}% below scheduled`),
      severity: Math.min(100, lpnGap * 180),
      detectedAt: now,
      metadata: { role: 'LPN', gapPercentage: lpnGap },
    });
  }

  if (cnaGap > 0.15) {
    signals.push({
      id: `staffing-cna-${facility.id}-${now.getTime()}`,
      type: 'staffing',
      description: applySafeHarborFilter(`CNA coverage gap detected: ${(cnaGap * 100).toFixed(1)}% below scheduled`),
      severity: Math.min(100, cnaGap * 150),
      detectedAt: now,
      metadata: { role: 'CNA', gapPercentage: cnaGap },
    });
  }

  // Acuity drift signal
  const acuityMismatch = calculateAcuityMismatch(
    facility.revenueDetails.observedAcuity,
    facility.revenueDetails.billingStatus
  );

  if (acuityMismatch > 0.1) {
    signals.push({
      id: `acuity-${facility.id}-${now.getTime()}`,
      type: 'acuity',
      description: applySafeHarborFilter(
        `Acuity drift detected: Observed ${facility.revenueDetails.observedAcuity} vs Billed ${facility.revenueDetails.billingStatus}`
      ),
      severity: Math.min(100, acuityMismatch * 100),
      detectedAt: now,
      metadata: { 
        observed: facility.revenueDetails.observedAcuity,
        billing: facility.revenueDetails.billingStatus,
        mismatch: acuityMismatch,
      },
    });
  }

  // Communication gap signal (if defensibility data is missing)
  if (!facility.defensibility.agencyCallsDocumented && 
      !facility.defensibility.floatPoolOffered && 
      !facility.defensibility.donNotified) {
    signals.push({
      id: `communication-${facility.id}-${now.getTime()}`,
      type: 'communication',
      description: applySafeHarborFilter('Documentation gap: No mitigation actions documented'),
      severity: 40,
      detectedAt: now,
      metadata: { missingActions: true },
    });
  }

  // Staffing trend signal (if declining)
  if (facility.staffingTrend.length >= 3) {
    const recent = facility.staffingTrend.slice(-3);
    const trend = (recent[recent.length - 1] - recent[0]) / recent.length;
    
    if (trend < -0.05) {
      signals.push({
        id: `trend-${facility.id}-${now.getTime()}`,
        type: 'staffing',
        description: applySafeHarborFilter('Operational drift: Staffing trend declining over 3-day period'),
        severity: Math.min(100, Math.abs(trend) * 200),
        detectedAt: now,
        metadata: { trend, recentValues: recent },
      });
    }
  }

  return signals;
}

/**
 * Calculate the primary attention score for a facility
 * 
 * @param facility - Facility data to score
 * @returns AttentionScoreResult with score, confidence, and signals
 */
export function calculateAttentionScore(facility: Facility): AttentionScoreResult {
  // Detect all incident signals
  const stressSignals = detectIncidentSignals(facility);

  // Determine confidence level based on data completeness
  let confidence: 'high' | 'medium' | 'low' = 'high';
  
  // Check for missing data
  const hasStaffingData = 
    facility.staffingDetails.rn.length > 0 ||
    facility.staffingDetails.lpn.length > 0 ||
    facility.staffingDetails.cna.length > 0;
  
  const hasAcuityData = 
    facility.revenueDetails.observedAcuity !== undefined &&
    facility.revenueDetails.billingStatus !== undefined;

  if (!hasStaffingData && !hasAcuityData) {
    confidence = 'low';
  } else if (!hasStaffingData || !hasAcuityData) {
    confidence = 'medium';
  }

  // Calculate base score from signals
  let score = 0;

  if (stressSignals.length === 0) {
    // No signals = low attention needed
    score = 20;
  } else {
    // Weight signals by severity and type
    for (const signal of stressSignals) {
      let weight = 1.0;
      
      // Critical staffing gaps get higher weight
      if (signal.type === 'staffing' && signal.severity > 70) {
        weight = 1.5;
      }
      
      // Acuity drift is important but less urgent
      if (signal.type === 'acuity') {
        weight = 0.8;
      }
      
      score += signal.severity * weight;
    }

    // Average and cap at 100
    score = Math.min(100, score / stressSignals.length);
    
    // Boost score if multiple signal types present
    const uniqueTypes = new Set(stressSignals.map(s => s.type));
    if (uniqueTypes.size > 1) {
      score = Math.min(100, score * 1.1);
    }
  }

  // Determine primary signal
  const primarySignal = stressSignals.length > 0
    ? stressSignals.reduce((prev, curr) => 
        curr.severity > prev.severity ? curr : prev
      )
    : null;

  const primarySignalDescription = primarySignal
    ? primarySignal.description
    : 'Stable Operations';

  const primarySignalCategory = primarySignal
    ? primarySignal.type
    : 'compliance';

  return {
    score: Math.round(score),
    confidence,
    stressSignals,
    primarySignal: primarySignalDescription,
    stressCategory: primarySignalCategory,
  };
}

/**
 * Get score category for UI display
 */
export function getScoreCategory(score: number): 'critical' | 'warning' | 'stable' {
  if (score >= 80) return 'critical';
  if (score >= 50) return 'warning';
  return 'stable';
}

/**
 * Revenue Leakage Alert - Generated when acuity/billing mismatch detected
 */
export interface RevenueLeakageAlert {
  /** Room or resident identifier */
  roomNumber: string;
  /** Estimated daily leakage amount */
  dailyLeakage: number;
  /** Alert message with actionable recommendation */
  alertMessage: string;
  /** Observed acuity level */
  observedAcuity: AcuityLevel;
  /** Current billing status */
  billingStatus: AcuityLevel;
  /** Severity of the mismatch */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Detect Revenue Leakage - Cross-references Acuity levels with billing cycles
 * 
 * LOGIC: If observed clinical acuity is higher than current billing status,
 * the facility is under-billing and losing NTA (Non-Therapy Ancillary) reimbursement.
 * 
 * @param facility - Facility data containing acuity and billing information
 * @param roomNumber - Optional room/resident identifier (defaults to estimated)
 * @returns Array of RevenueLeakageAlert objects for each detected mismatch
 */
export function detectRevenueLeakage(
  facility: Facility,
  roomNumber?: string
): RevenueLeakageAlert[] {
  const alerts: RevenueLeakageAlert[] = [];

  // Get acuity values for comparison
  const acuityValues: Record<AcuityLevel, number> = {
    'LOW': 1,
    'STANDARD': 2,
    'HIGH': 3,
    'CRITICAL': 4,
  };

  const observedValue = acuityValues[facility.revenueDetails.observedAcuity];
  const billingValue = acuityValues[facility.revenueDetails.billingStatus];

  // Revenue leakage occurs when observed acuity > billing status
  const mismatch = observedValue - billingValue;

  if (mismatch > 0) {
    // Calculate severity based on mismatch level
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let dailyLeakage = 250; // Base leakage amount

    if (mismatch === 1) {
      severity = 'medium';
      dailyLeakage = 250; // STANDARD -> HIGH: $250/day
    } else if (mismatch === 2) {
      severity = 'high';
      dailyLeakage = 500; // STANDARD -> CRITICAL or LOW -> HIGH: $500/day
    } else if (mismatch >= 3) {
      severity = 'critical';
      dailyLeakage = 750; // LOW -> CRITICAL: $750/day
    }

    // Generate room number if not provided
    // Use facility ID and a room pattern, or estimate from facility data
    const estimatedRoom = roomNumber || 
      `Room ${400 + parseInt(facility.id.replace(/\D/g, '').slice(-2) || '2')}`;

    // Generate alert message
    const alertMessage = applySafeHarborFilter(
      `Estimated $${dailyLeakage}/day leakage found. Update MDS for ${estimatedRoom} to capture NTA reimbursement.`
    );

    alerts.push({
      roomNumber: estimatedRoom,
      dailyLeakage,
      alertMessage,
      observedAcuity: facility.revenueDetails.observedAcuity,
      billingStatus: facility.revenueDetails.billingStatus,
      severity,
    });
  }

  return alerts;
}

/**
 * Revenue Leak Calculation Result
 */
export interface RevenueLeakResult {
  /** Whether a revenue leak was detected */
  detected: boolean;
  /** Potential uncaptured PDPM opportunity in USD per day */
  dailyOpportunity: number;
  /** Percentage gap between scheduled and actual hours */
  staffingGapPercentage: number;
  /** Description of the revenue leak */
  description: string;
}

/**
 * Calculate Revenue Leak - Detects under-billing opportunities
 * 
 * LOGIC: If census is high but actual staffing hours are < scheduled by more than 10%,
 * the facility is likely under-billing for the complexity of care they're providing.
 * 
 * @param staffingRecords - Array of staffing records (RN, LPN, CNA)
 * @param census - Current resident census count
 * @returns RevenueLeakResult with detection status and opportunity amount
 */
export function calculateRevenueLeak(
  staffingRecords: StaffingRecord[],
  census?: number
): RevenueLeakResult {
  // Default result - no leak detected
  const defaultResult: RevenueLeakResult = {
    detected: false,
    dailyOpportunity: 0,
    staffingGapPercentage: 0,
    description: 'No revenue leak detected - staffing aligns with census',
  };

  // Need census to calculate revenue opportunity
  if (!census || census === 0) {
    return {
      ...defaultResult,
      description: 'Census data unavailable - cannot calculate revenue opportunity',
    };
  }

  // Need staffing records to analyze
  if (!staffingRecords || staffingRecords.length === 0) {
    return {
      ...defaultResult,
      description: 'No staffing data available - cannot calculate revenue opportunity',
    };
  }

  // Calculate total scheduled and actual hours across all roles
  let totalScheduled = 0;
  let totalActual = 0;

  for (const record of staffingRecords) {
    totalScheduled += record.scheduled;
    totalActual += record.actual;
  }

  // Check if we have valid data
  if (totalScheduled === 0) {
    return {
      ...defaultResult,
      description: 'No scheduled hours found - cannot calculate revenue opportunity',
    };
  }

  // Calculate staffing gap percentage
  const gap = totalScheduled - totalActual;
  const gapPercentage = (gap / totalScheduled) * 100;

  // Revenue leak detected if actual hours are < scheduled by more than 10%
  if (gapPercentage > 10) {
    // Calculate potential uncaptured PDPM opportunity
    // $180 per resident per day when under-staffed indicates under-billing
    const dailyOpportunity = census * 180;

    return {
      detected: true,
      dailyOpportunity,
      staffingGapPercentage: gapPercentage,
      description: `Under-billing detected: ${gapPercentage.toFixed(1)}% staffing gap with ${census} residents. Potential PDPM opportunity: $${dailyOpportunity.toLocaleString()}/day`,
    };
  }

  // No significant gap - no revenue leak
  return {
    ...defaultResult,
    staffingGapPercentage: gapPercentage,
    description: `Staffing gap (${gapPercentage.toFixed(1)}%) is within acceptable range (<10%)`,
  };
}

