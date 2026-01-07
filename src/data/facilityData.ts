// Mock facility data for VRT3X
// NOTE: This interface is kept for backward compatibility.
// In production, use the Facility type from @/types/snf
import type { Facility, IncidentSignal } from '@/types/snf';

export interface FacilityData {
  id: string;
  name: string;
  attentionScore: number;
  confidence?: 'high' | 'medium' | 'low';
  primaryStressSignal: string;
  stressCategory: 'staffing' | 'acuity' | 'compliance' | 'communication';
  staffingTrend: number[]; // 7-day scheduled vs actual ratio (1 = perfect, <1 = understaffed)
  uncapturedRevenue: number; // daily potential in dollars
  actionStatus: 'defense-memo-needed' | 'audit-ready' | 'under-review' | 'escalated';
  // Drill-down data
  staffingDetails: {
    rn: { scheduled: number; actual: number }[];
    lpn: { scheduled: number; actual: number }[];
    cna: { scheduled: number; actual: number }[];
    alerts: string[];
  };
  revenueDetails: {
    observedAcuity: 'LOW' | 'STANDARD' | 'HIGH' | 'CRITICAL';
    billingStatus: 'LOW' | 'STANDARD' | 'HIGH' | 'CRITICAL';
    dailyMismatch: number;
    recommendation: string;
  };
  defensibility: {
    agencyCallsDocumented: boolean;
    floatPoolOffered: boolean;
    donNotified: boolean;
    lastMemoDate: string | null;
  };
  incidentSignals?: IncidentSignal[];
}

export const facilities: FacilityData[] = [
  // HIGH STRESS - Top 3 (Red)
  {
    id: 'fac-001',
    name: 'Oakhaven Manor',
    attentionScore: 94,
    primaryStressSignal: 'Critical RN Gap (Weekend)',
    stressCategory: 'staffing',
    staffingTrend: [0.92, 0.88, 0.75, 0.68, 0.71, 0.65, 0.58],
    uncapturedRevenue: 1850,
    actionStatus: 'defense-memo-needed',
    staffingDetails: {
      rn: [
        { scheduled: 24, actual: 22 },
        { scheduled: 24, actual: 18 },
        { scheduled: 24, actual: 12 },
      ],
      lpn: [
        { scheduled: 32, actual: 30 },
        { scheduled: 32, actual: 28 },
        { scheduled: 32, actual: 24 },
      ],
      cna: [
        { scheduled: 48, actual: 44 },
        { scheduled: 48, actual: 40 },
        { scheduled: 48, actual: 36 },
      ],
      alerts: ['Alert: 12-hour RN gap detected on Saturday Night Shift', 'CNA coverage below 75% threshold for 3 consecutive days'],
    },
    revenueDetails: {
      observedAcuity: 'HIGH',
      billingStatus: 'STANDARD',
      dailyMismatch: 1850,
      recommendation: 'Mismatch detected. Estimated $1,850/day in uncaptured NTA reimbursement. Recommend MDS Review.',
    },
    defensibility: {
      agencyCallsDocumented: true,
      floatPoolOffered: false,
      donNotified: false,
      lastMemoDate: null,
    },
  },
  {
    id: 'fac-002',
    name: 'Riverside Gardens',
    attentionScore: 87,
    primaryStressSignal: 'Acuity Drift (+22%)',
    stressCategory: 'acuity',
    staffingTrend: [0.95, 0.91, 0.87, 0.82, 0.78, 0.73, 0.70],
    uncapturedRevenue: 2340,
    actionStatus: 'escalated',
    staffingDetails: {
      rn: [
        { scheduled: 20, actual: 18 },
        { scheduled: 20, actual: 16 },
        { scheduled: 20, actual: 15 },
      ],
      lpn: [
        { scheduled: 28, actual: 26 },
        { scheduled: 28, actual: 24 },
        { scheduled: 28, actual: 22 },
      ],
      cna: [
        { scheduled: 44, actual: 40 },
        { scheduled: 44, actual: 38 },
        { scheduled: 44, actual: 35 },
      ],
      alerts: ['Acuity increase not reflected in staffing matrix', 'LPN-to-resident ratio below state minimum'],
    },
    revenueDetails: {
      observedAcuity: 'CRITICAL',
      billingStatus: 'HIGH',
      dailyMismatch: 2340,
      recommendation: 'Significant acuity drift. Estimated $2,340/day potential. Immediate MDS reassessment required.',
    },
    defensibility: {
      agencyCallsDocumented: true,
      floatPoolOffered: true,
      donNotified: true,
      lastMemoDate: '2024-01-02',
    },
  },
  {
    id: 'fac-003',
    name: 'Sunset Ridge Care',
    attentionScore: 82,
    primaryStressSignal: 'Silence Gap (72hrs)',
    stressCategory: 'communication',
    staffingTrend: [0.98, 0.94, 0.89, 0.85, 0.80, 0.76, 0.74],
    uncapturedRevenue: 920,
    actionStatus: 'defense-memo-needed',
    staffingDetails: {
      rn: [
        { scheduled: 22, actual: 20 },
        { scheduled: 22, actual: 19 },
        { scheduled: 22, actual: 17 },
      ],
      lpn: [
        { scheduled: 30, actual: 28 },
        { scheduled: 30, actual: 26 },
        { scheduled: 30, actual: 25 },
      ],
      cna: [
        { scheduled: 46, actual: 42 },
        { scheduled: 46, actual: 40 },
        { scheduled: 46, actual: 38 },
      ],
      alerts: ['No staffing updates received in 72 hours', 'System sync failure detected'],
    },
    revenueDetails: {
      observedAcuity: 'HIGH',
      billingStatus: 'STANDARD',
      dailyMismatch: 920,
      recommendation: 'Data gap preventing accurate assessment. Immediate facility contact required.',
    },
    defensibility: {
      agencyCallsDocumented: false,
      floatPoolOffered: false,
      donNotified: false,
      lastMemoDate: null,
    },
  },
  // MEDIUM STRESS - Middle range (Yellow)
  {
    id: 'fac-004',
    name: 'Willowbrook Center',
    attentionScore: 71,
    primaryStressSignal: 'Weekend Coverage Gap',
    stressCategory: 'staffing',
    staffingTrend: [0.96, 0.94, 0.92, 0.88, 0.85, 0.82, 0.80],
    uncapturedRevenue: 650,
    actionStatus: 'under-review',
    staffingDetails: {
      rn: [{ scheduled: 20, actual: 18 }, { scheduled: 20, actual: 17 }, { scheduled: 20, actual: 16 }],
      lpn: [{ scheduled: 26, actual: 24 }, { scheduled: 26, actual: 24 }, { scheduled: 26, actual: 22 }],
      cna: [{ scheduled: 40, actual: 38 }, { scheduled: 40, actual: 36 }, { scheduled: 40, actual: 34 }],
      alerts: ['Weekend RN coverage trending below target'],
    },
    revenueDetails: {
      observedAcuity: 'STANDARD',
      billingStatus: 'LOW',
      dailyMismatch: 650,
      recommendation: 'Minor billing discrepancy. Schedule routine MDS review.',
    },
    defensibility: { agencyCallsDocumented: true, floatPoolOffered: true, donNotified: false, lastMemoDate: '2024-01-05' },
  },
  {
    id: 'fac-005',
    name: 'Meadowview Health',
    attentionScore: 65,
    primaryStressSignal: 'CNA Turnover Spike',
    stressCategory: 'staffing',
    staffingTrend: [0.98, 0.95, 0.92, 0.90, 0.87, 0.85, 0.83],
    uncapturedRevenue: 420,
    actionStatus: 'under-review',
    staffingDetails: {
      rn: [{ scheduled: 18, actual: 17 }, { scheduled: 18, actual: 17 }, { scheduled: 18, actual: 16 }],
      lpn: [{ scheduled: 24, actual: 23 }, { scheduled: 24, actual: 22 }, { scheduled: 24, actual: 22 }],
      cna: [{ scheduled: 38, actual: 34 }, { scheduled: 38, actual: 32 }, { scheduled: 38, actual: 30 }],
      alerts: ['CNA turnover rate elevated this month'],
    },
    revenueDetails: {
      observedAcuity: 'STANDARD',
      billingStatus: 'STANDARD',
      dailyMismatch: 420,
      recommendation: 'Stable billing alignment. Monitor for changes.',
    },
    defensibility: { agencyCallsDocumented: true, floatPoolOffered: false, donNotified: true, lastMemoDate: '2024-01-04' },
  },
  {
    id: 'fac-006',
    name: 'Pinecrest Nursing',
    attentionScore: 58,
    primaryStressSignal: 'MDS Review Overdue',
    stressCategory: 'compliance',
    staffingTrend: [0.97, 0.96, 0.94, 0.93, 0.91, 0.90, 0.88],
    uncapturedRevenue: 780,
    actionStatus: 'under-review',
    staffingDetails: {
      rn: [{ scheduled: 22, actual: 21 }, { scheduled: 22, actual: 20 }, { scheduled: 22, actual: 20 }],
      lpn: [{ scheduled: 28, actual: 27 }, { scheduled: 28, actual: 26 }, { scheduled: 28, actual: 26 }],
      cna: [{ scheduled: 42, actual: 40 }, { scheduled: 42, actual: 39 }, { scheduled: 42, actual: 38 }],
      alerts: ['Quarterly MDS reviews due for 8 residents'],
    },
    revenueDetails: {
      observedAcuity: 'HIGH',
      billingStatus: 'STANDARD',
      dailyMismatch: 780,
      recommendation: 'Pending MDS reviews may unlock additional reimbursement.',
    },
    defensibility: { agencyCallsDocumented: true, floatPoolOffered: true, donNotified: true, lastMemoDate: '2024-01-03' },
  },
  {
    id: 'fac-007',
    name: 'Lakeside Manor',
    attentionScore: 52,
    primaryStressSignal: 'Agency Reliance +15%',
    stressCategory: 'staffing',
    staffingTrend: [0.99, 0.97, 0.95, 0.94, 0.92, 0.91, 0.89],
    uncapturedRevenue: 320,
    actionStatus: 'audit-ready',
    staffingDetails: {
      rn: [{ scheduled: 20, actual: 19 }, { scheduled: 20, actual: 19 }, { scheduled: 20, actual: 18 }],
      lpn: [{ scheduled: 26, actual: 25 }, { scheduled: 26, actual: 25 }, { scheduled: 26, actual: 24 }],
      cna: [{ scheduled: 40, actual: 38 }, { scheduled: 40, actual: 38 }, { scheduled: 40, actual: 37 }],
      alerts: ['Agency staff usage above regional average'],
    },
    revenueDetails: {
      observedAcuity: 'STANDARD',
      billingStatus: 'STANDARD',
      dailyMismatch: 320,
      recommendation: 'Billing aligned. Focus on reducing agency dependency.',
    },
    defensibility: { agencyCallsDocumented: true, floatPoolOffered: true, donNotified: true, lastMemoDate: '2024-01-06' },
  },
  // STABLE - Bottom facilities (Grey)
  {
    id: 'fac-008',
    name: 'Greenfield Care',
    attentionScore: 45,
    primaryStressSignal: 'Minor Documentation Lag',
    stressCategory: 'compliance',
    staffingTrend: [0.98, 0.97, 0.96, 0.96, 0.95, 0.94, 0.93],
    uncapturedRevenue: 180,
    actionStatus: 'audit-ready',
    staffingDetails: {
      rn: [{ scheduled: 18, actual: 18 }, { scheduled: 18, actual: 17 }, { scheduled: 18, actual: 17 }],
      lpn: [{ scheduled: 24, actual: 24 }, { scheduled: 24, actual: 23 }, { scheduled: 24, actual: 23 }],
      cna: [{ scheduled: 36, actual: 35 }, { scheduled: 36, actual: 35 }, { scheduled: 36, actual: 34 }],
      alerts: [],
    },
    revenueDetails: {
      observedAcuity: 'STANDARD',
      billingStatus: 'STANDARD',
      dailyMismatch: 180,
      recommendation: 'Minor optimization opportunity. Low priority.',
    },
    defensibility: { agencyCallsDocumented: true, floatPoolOffered: true, donNotified: true, lastMemoDate: '2024-01-05' },
  },
  {
    id: 'fac-009',
    name: 'Heritage Hills',
    attentionScore: 38,
    primaryStressSignal: 'Stable Operations',
    stressCategory: 'compliance',
    staffingTrend: [0.99, 0.98, 0.98, 0.97, 0.97, 0.96, 0.96],
    uncapturedRevenue: 95,
    actionStatus: 'audit-ready',
    staffingDetails: {
      rn: [{ scheduled: 20, actual: 20 }, { scheduled: 20, actual: 19 }, { scheduled: 20, actual: 19 }],
      lpn: [{ scheduled: 26, actual: 26 }, { scheduled: 26, actual: 25 }, { scheduled: 26, actual: 25 }],
      cna: [{ scheduled: 40, actual: 39 }, { scheduled: 40, actual: 39 }, { scheduled: 40, actual: 38 }],
      alerts: [],
    },
    revenueDetails: {
      observedAcuity: 'STANDARD',
      billingStatus: 'STANDARD',
      dailyMismatch: 95,
      recommendation: 'Fully optimized. No action required.',
    },
    defensibility: { agencyCallsDocumented: true, floatPoolOffered: true, donNotified: true, lastMemoDate: '2024-01-06' },
  },
  {
    id: 'fac-010',
    name: 'Valley View SNF',
    attentionScore: 32,
    primaryStressSignal: 'Stable Operations',
    stressCategory: 'compliance',
    staffingTrend: [1.0, 0.99, 0.99, 0.98, 0.98, 0.97, 0.97],
    uncapturedRevenue: 50,
    actionStatus: 'audit-ready',
    staffingDetails: {
      rn: [{ scheduled: 22, actual: 22 }, { scheduled: 22, actual: 21 }, { scheduled: 22, actual: 21 }],
      lpn: [{ scheduled: 28, actual: 28 }, { scheduled: 28, actual: 27 }, { scheduled: 28, actual: 27 }],
      cna: [{ scheduled: 44, actual: 43 }, { scheduled: 44, actual: 43 }, { scheduled: 44, actual: 42 }],
      alerts: [],
    },
    revenueDetails: {
      observedAcuity: 'STANDARD',
      billingStatus: 'STANDARD',
      dailyMismatch: 50,
      recommendation: 'Exemplary operations. Consider as model facility.',
    },
    defensibility: { agencyCallsDocumented: true, floatPoolOffered: true, donNotified: true, lastMemoDate: '2024-01-06' },
  },
  {
    id: 'fac-011',
    name: 'Cedar Grove Health',
    attentionScore: 28,
    primaryStressSignal: 'Stable Operations',
    stressCategory: 'compliance',
    staffingTrend: [1.0, 1.0, 0.99, 0.99, 0.98, 0.98, 0.97],
    uncapturedRevenue: 0,
    actionStatus: 'audit-ready',
    staffingDetails: {
      rn: [{ scheduled: 20, actual: 20 }, { scheduled: 20, actual: 20 }, { scheduled: 20, actual: 19 }],
      lpn: [{ scheduled: 26, actual: 26 }, { scheduled: 26, actual: 26 }, { scheduled: 26, actual: 25 }],
      cna: [{ scheduled: 40, actual: 40 }, { scheduled: 40, actual: 39 }, { scheduled: 40, actual: 39 }],
      alerts: [],
    },
    revenueDetails: {
      observedAcuity: 'STANDARD',
      billingStatus: 'STANDARD',
      dailyMismatch: 0,
      recommendation: 'Perfect billing alignment. No action required.',
    },
    defensibility: { agencyCallsDocumented: true, floatPoolOffered: true, donNotified: true, lastMemoDate: '2024-01-06' },
  },
  {
    id: 'fac-012',
    name: 'Mountainview Care',
    attentionScore: 24,
    primaryStressSignal: 'Optimal Performance',
    stressCategory: 'compliance',
    staffingTrend: [1.0, 1.0, 1.0, 0.99, 0.99, 0.98, 0.98],
    uncapturedRevenue: 0,
    actionStatus: 'audit-ready',
    staffingDetails: {
      rn: [{ scheduled: 24, actual: 24 }, { scheduled: 24, actual: 24 }, { scheduled: 24, actual: 23 }],
      lpn: [{ scheduled: 30, actual: 30 }, { scheduled: 30, actual: 30 }, { scheduled: 30, actual: 29 }],
      cna: [{ scheduled: 46, actual: 46 }, { scheduled: 46, actual: 45 }, { scheduled: 46, actual: 45 }],
      alerts: [],
    },
    revenueDetails: {
      observedAcuity: 'STANDARD',
      billingStatus: 'STANDARD',
      dailyMismatch: 0,
      recommendation: 'Top performer in region.',
    },
    defensibility: { agencyCallsDocumented: true, floatPoolOffered: true, donNotified: true, lastMemoDate: '2024-01-06' },
  },
  {
    id: 'fac-013',
    name: 'Brookside Nursing',
    attentionScore: 68,
    primaryStressSignal: 'LPN Shortage (Nights)',
    stressCategory: 'staffing',
    staffingTrend: [0.97, 0.94, 0.91, 0.88, 0.86, 0.84, 0.82],
    uncapturedRevenue: 540,
    actionStatus: 'under-review',
    staffingDetails: {
      rn: [{ scheduled: 18, actual: 17 }, { scheduled: 18, actual: 17 }, { scheduled: 18, actual: 16 }],
      lpn: [{ scheduled: 24, actual: 20 }, { scheduled: 24, actual: 19 }, { scheduled: 24, actual: 18 }],
      cna: [{ scheduled: 38, actual: 36 }, { scheduled: 38, actual: 34 }, { scheduled: 38, actual: 33 }],
      alerts: ['Night shift LPN coverage below threshold'],
    },
    revenueDetails: {
      observedAcuity: 'STANDARD',
      billingStatus: 'LOW',
      dailyMismatch: 540,
      recommendation: 'Moderate billing gap. Schedule MDS review.',
    },
    defensibility: { agencyCallsDocumented: true, floatPoolOffered: false, donNotified: true, lastMemoDate: '2024-01-04' },
  },
  {
    id: 'fac-014',
    name: 'Elmwood Terrace',
    attentionScore: 41,
    primaryStressSignal: 'Stable Operations',
    stressCategory: 'compliance',
    staffingTrend: [0.99, 0.98, 0.97, 0.97, 0.96, 0.95, 0.94],
    uncapturedRevenue: 120,
    actionStatus: 'audit-ready',
    staffingDetails: {
      rn: [{ scheduled: 20, actual: 20 }, { scheduled: 20, actual: 19 }, { scheduled: 20, actual: 19 }],
      lpn: [{ scheduled: 26, actual: 25 }, { scheduled: 26, actual: 25 }, { scheduled: 26, actual: 25 }],
      cna: [{ scheduled: 40, actual: 39 }, { scheduled: 40, actual: 39 }, { scheduled: 40, actual: 38 }],
      alerts: [],
    },
    revenueDetails: {
      observedAcuity: 'STANDARD',
      billingStatus: 'STANDARD',
      dailyMismatch: 120,
      recommendation: 'Minor optimization available. Low priority.',
    },
    defensibility: { agencyCallsDocumented: true, floatPoolOffered: true, donNotified: true, lastMemoDate: '2024-01-05' },
  },
  {
    id: 'fac-015',
    name: 'Sunrise Health Center',
    attentionScore: 19,
    primaryStressSignal: 'Optimal Performance',
    stressCategory: 'compliance',
    staffingTrend: [1.0, 1.0, 1.0, 1.0, 0.99, 0.99, 0.99],
    uncapturedRevenue: 0,
    actionStatus: 'audit-ready',
    staffingDetails: {
      rn: [{ scheduled: 22, actual: 22 }, { scheduled: 22, actual: 22 }, { scheduled: 22, actual: 22 }],
      lpn: [{ scheduled: 28, actual: 28 }, { scheduled: 28, actual: 28 }, { scheduled: 28, actual: 28 }],
      cna: [{ scheduled: 44, actual: 44 }, { scheduled: 44, actual: 44 }, { scheduled: 44, actual: 43 }],
      alerts: [],
    },
    revenueDetails: {
      observedAcuity: 'STANDARD',
      billingStatus: 'STANDARD',
      dailyMismatch: 0,
      recommendation: 'Regional benchmark facility.',
    },
    defensibility: { agencyCallsDocumented: true, floatPoolOffered: true, donNotified: true, lastMemoDate: '2024-01-06' },
  },
];

export const getFacilityById = (id: string): FacilityData | undefined => {
  return facilities.find(f => f.id === id);
};

// Re-export getScoreCategory from scoring logic for backward compatibility
export { getScoreCategory } from '@/lib/logic/scoring';

export const getActionStatusLabel = (status: FacilityData['actionStatus']): string => {
  const labels: Record<FacilityData['actionStatus'], string> = {
    'defense-memo-needed': 'Defense Memo Needed',
    'audit-ready': 'Audit Ready',
    'under-review': 'Under Review',
    'escalated': 'Escalated',
  };
  return labels[status];
};
