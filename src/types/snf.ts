/**
 * Domain Types for VRT3X
 * 
 * These interfaces define the core data structures for the operational
 * intelligence platform. All business logic operates on these types.
 */

/**
 * Acuity Level - Represents the clinical complexity of residents
 */
export type AcuityLevel = 'LOW' | 'STANDARD' | 'HIGH' | 'CRITICAL';

/**
 * Staffing Record - Captures scheduled vs actual hours for a specific role and time period
 */
export interface StaffingRecord {
  /** Role identifier: 'RN', 'LPN', 'CNA' */
  role: 'RN' | 'LPN' | 'CNA';
  /** Scheduled hours for this period */
  scheduled: number;
  /** Actual hours worked (may be less than scheduled due to gaps) */
  actual: number;
  /** Date/time period this record represents */
  period: Date;
  /** Optional: Shift identifier if applicable */
  shift?: 'day' | 'evening' | 'night';
}

/**
 * Incident Signal - Represents a detected operational stress indicator
 */
export interface IncidentSignal {
  /** Unique identifier for this signal */
  id: string;
  /** Type of stress signal */
  type: 'staffing' | 'acuity' | 'compliance' | 'communication';
  /** Human-readable description */
  description: string;
  /** Severity level (0-100) */
  severity: number;
  /** When this signal was detected */
  detectedAt: Date;
  /** Optional: Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Facility - Core entity representing a Skilled Nursing Facility
 */
export interface Facility {
  /** Unique facility identifier */
  id: string;
  /** Facility name */
  name: string;
  /** Current attention score (0-100) */
  attentionScore: number;
  /** Confidence level of the score calculation */
  confidence: 'high' | 'medium' | 'low';
  /** Primary stress signal currently active */
  primaryStressSignal: string;
  /** Category of primary stress */
  stressCategory: 'staffing' | 'acuity' | 'compliance' | 'communication';
  /** 7-day staffing trend (ratio of actual/scheduled, 1.0 = perfect) */
  staffingTrend: number[];
  /** Daily uncaptured revenue potential in USD */
  uncapturedRevenue: number;
  /** Current resident census count */
  census?: number;
  /** Current action status */
  actionStatus: 'defense-memo-needed' | 'audit-ready' | 'under-review' | 'escalated';
  /** Detailed staffing records (72-hour window) */
  staffingDetails: {
    rn: StaffingRecord[];
    lpn: StaffingRecord[];
    cna: StaffingRecord[];
    alerts: string[];
  };
  /** Revenue and acuity analysis */
  revenueDetails: {
    observedAcuity: AcuityLevel;
    billingStatus: AcuityLevel;
    dailyMismatch: number;
    // Removed: recommendation field (legal safe-harbor - no prescriptive language)
  };
  /** Defensibility audit trail */
  defensibility: {
    agencyCallsDocumented: boolean;
    floatPoolOffered: boolean;
    donNotified: boolean;
    lastMemoDate: string | null;
  };
  /** List of active incident signals */
  incidentSignals: IncidentSignal[];
}

/**
 * Mitigation Event - Records a "Good Faith Effort" action taken
 * 
 * This is the core of "The Shield" - every operational failure must
 * be paired with documented mitigation efforts.
 */
export interface MitigationEvent {
  /** Unique event identifier (database primary key) */
  id: string;
  /** User who initiated the mitigation */
  userId: string;
  /** Facility this event relates to */
  facilityId: string;
  /** Type of mitigation action */
  type: 'agency-call' | 'float-pool-offer' | 'don-notification' | 'defense-memo' | 'other';
  /** Human-readable description of action taken */
  actionTaken: string;
  /** Evidence payload (JSON) - can include screenshots, logs, etc. */
  evidencePayload: Record<string, unknown>;
  /** Timestamp when action was taken */
  timestamp: Date;
  /** Optional: Reference to related incident signal */
  incidentSignalId?: string;
  /** Optional: Audit reference ID for PDF generation */
  auditReferenceId?: string;
}

/**
 * Attention Score Result - Output of the scoring algorithm
 */
export interface AttentionScoreResult {
  /** Calculated score (0-100) */
  score: number;
  /** Confidence level of the calculation */
  confidence: 'high' | 'medium' | 'low';
  /** List of stress signals detected */
  stressSignals: IncidentSignal[];
  /** Primary stress signal description */
  primarySignal: string;
  /** Category of primary stress */
  stressCategory: 'staffing' | 'acuity' | 'compliance' | 'communication';
}

