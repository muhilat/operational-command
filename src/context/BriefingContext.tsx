/**
 * Briefing Context - Single Source of Truth (SSoT)
 * 
 * Canonical data state for all facilities.
 * All components (Sidebar, Brief, Detail) must pull from this context.
 * No local calculations allowed.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { FacilityData } from '@/data/facilityData';
import { calculateAttentionScore, getIntensityLabel } from '@/lib/logic/scoring';
import { calculateRevenueLeak } from '@/lib/logic/scoring';
import { supabase } from '@/lib/supabase';

export interface CanonicalFacility {
  id: string;
  name: string;
  syncTimestamp: Date; // Single source of truth for sync time
  revenueDelta: number; // Single source of truth for revenue ($/day)
  intensity: 'Low' | 'Elevated' | 'Critical';
  stressCategory: 'staffing' | 'acuity' | 'compliance' | 'communication';
  headline: string;
  observation: string;
  stateObservation: string; // Narrative state observation (e.g., "40 residents but only 2 CNAs visible")
  confidence: 'High' | 'Med' | 'Low'; // Confidence based on data completeness
  evidence: {
    staffingGap?: number;
    trendDelta?: string;
    acuityMismatch?: boolean;
    revenueLeak?: number;
  };
  rawData: FacilityData; // Keep raw data for drilldown
}

interface BriefingContextValue {
  facilities: CanonicalFacility[];
  loading: boolean;
  error: string | null;
  updateSyncTimestamp: (facilityId: string, timestamp: Date) => void;
  updateRevenueDelta: (facilityId: string, delta: number) => void;
  refresh: () => Promise<void>;
}

const BriefingContext = createContext<BriefingContextValue | undefined>(undefined);

export function useBriefingContext() {
  const context = useContext(BriefingContext);
  if (!context) {
    throw new Error('useBriefingContext must be used within BriefingProvider');
  }
  return context;
}

interface BriefingProviderProps {
  children: ReactNode;
}

/**
 * Central Signal Dictionary
 * Fixed names, fixed observation text, single calculation model
 */
/**
 * Domain-Specific Signal Dictionary
 * Fixed names, fixed observation text, single calculation model
 * Each signal type handles its domain-specific calculation
 */
const SIGNAL_DICTIONARY = {
  'skeleton-crew': {
    name: 'Skeleton Crew Signal',
    observation: (gap: number) => `Observation: Staffing hours deviate from census requirements. RN actual hours are ${gap} below scheduled.`,
    stateObservation: (facility: FacilityData) => {
      // State-based: Observe the discrepancy, don't calculate perfect metrics
      const census = facility.census || 0;
      const rnScheduled = facility.staffingDetails?.rn?.[0]?.scheduled || 0;
      const rnActual = facility.staffingDetails?.rn?.[0]?.actual || 0;
      const cnaScheduled = facility.staffingDetails?.cna?.[0]?.scheduled || 0;
      const cnaActual = facility.staffingDetails?.cna?.[0]?.actual || 0;
      
      // If we can't calculate, generate a state observation
      if (census === 0 || (rnScheduled === 0 && cnaScheduled === 0)) {
        return 'Observation: Staffing roster appears inconsistent with census requirements. Verification suggested.';
      }
      
      // State observation: "40 residents but only 2 CNAs visible"
      if (census > 0 && cnaActual < census / 10) {
        return `Observation: Census shows ${census} residents but staffing roster shows ${cnaActual} CNA${cnaActual !== 1 ? 's' : ''} visible. State of stress detected.`;
      }
      
      if (rnScheduled > 0 && rnActual < rnScheduled * 0.8) {
        return `Observation: RN scheduled hours (${rnScheduled}h) exceed actual hours (${rnActual}h). Staffing roster appears inconsistent.`;
      }
      
      return 'Observation: Staffing levels align with scheduled requirements.';
    },
    calculation: (facility: FacilityData) => {
      // Safe-access pattern: Use optional chaining and nullish coalescing
      const rnGap = (facility.staffingDetails?.rn?.[0]?.scheduled || 0) - (facility.staffingDetails?.rn?.[0]?.actual || 0);
      return rnGap > 0 ? { detected: true, gap: rnGap } : { detected: false, gap: 0 };
    },
  },
  'acuity-mismatch': {
    name: 'Acuity Mismatch',
    observation: (observed: string, billing: string) => `Observation: Observed clinical acuity (${observed}) differs from billing status (${billing}).`,
    stateObservation: (facility: FacilityData) => {
      const observed = facility.revenueDetails?.observedAcuity || 'STANDARD';
      const billing = facility.revenueDetails?.billingStatus || 'STANDARD';
      
      if (observed !== billing) {
        return `Observation: Observed clinical acuity (${observed}) differs from billing status (${billing}). Capture opportunity identified.`;
      }
      
      return 'Observation: Acuity levels align with billing status.';
    },
    calculation: (facility: FacilityData) => {
      // Safe-access pattern for billing calculations
      const observed = facility.revenueDetails?.observedAcuity || 'STANDARD';
      const billing = facility.revenueDetails?.billingStatus || 'STANDARD';
      const mismatch = observed !== billing;
      return { detected: mismatch, observed, billing };
    },
  },
  'safety-incident': {
    name: 'Safety Incident',
    observation: (incidentCount: number) => `Observation: ${incidentCount} safety incident${incidentCount !== 1 ? 's' : ''} detected requiring leadership attention.`,
    stateObservation: (facility: FacilityData) => {
      const incidentCount = facility.incidentSignals?.filter(s => s.type === 'compliance' || s.type === 'safety').length || 0;
      
      if (incidentCount > 0) {
        return `Observation: ${incidentCount} safety incident${incidentCount !== 1 ? 's' : ''} detected requiring leadership attention.`;
      }
      
      return 'Observation: Compliance signals within expected parameters.';
    },
    calculation: (facility: FacilityData) => {
      // Safe-access pattern for safety/compliance calculations
      const incidentCount = facility.incidentSignals?.filter(s => s.type === 'compliance' || s.type === 'safety').length || 0;
      return { detected: incidentCount > 0, incidentCount };
    },
  },
};

/**
 * Calculate Confidence Level based on data completeness
 * High: All required fields present
 * Med: Some fields missing but core data available
 * Low: Critical fields missing or incomplete
 */
function calculateConfidence(facility: FacilityData): 'High' | 'Med' | 'Low' {
  const hasCensus = (facility.census ?? 0) > 0;
  const hasRnData = (facility.staffingDetails?.rn?.length ?? 0) > 0;
  const hasCnaData = (facility.staffingDetails?.cna?.length ?? 0) > 0;
  const hasAcuity = !!facility.revenueDetails?.observedAcuity;
  const hasBilling = !!facility.revenueDetails?.billingStatus;
  
  // High confidence: Core data present
  if (hasCensus && (hasRnData || hasCnaData) && hasAcuity && hasBilling) {
    return 'High';
  }
  
  // Med confidence: Some core data present
  if (hasCensus && (hasRnData || hasCnaData)) {
    return 'Med';
  }
  
  // Low confidence: Critical fields missing
  return 'Low';
}

/**
 * Standardized Revenue Calculation
 * $250/day fixed rate for staffing gaps > 10%
 */
function calculateStandardizedRevenue(
  facility: FacilityData,
  census: number
): number {
  const allStaffingRecords = [
    ...facility.staffingDetails.rn.map(r => ({ role: 'RN' as const, scheduled: r.scheduled, actual: r.actual, period: new Date() })),
    ...facility.staffingDetails.lpn.map(r => ({ role: 'LPN' as const, scheduled: r.scheduled, actual: r.actual, period: new Date() })),
    ...facility.staffingDetails.cna.map(r => ({ role: 'CNA' as const, scheduled: r.scheduled, actual: r.actual, period: new Date() })),
  ];
  
  const revenueLeakResult = calculateRevenueLeak(
    allStaffingRecords,
    census,
    facility.revenueDetails.observedAcuity
  );
  
  // Standardize: If detected, use $250/day (not variable amounts)
  if (revenueLeakResult.detected) {
    return 250 * census; // Fixed $250/resident/day
  }
  
  return 0;
}

/**
 * Convert raw facility data to canonical format
 * Error-proofed with try-catch to prevent total app crash
 */
function createCanonicalFacility(facilityData: FacilityData, index: number): CanonicalFacility {
  try {
    // SSoT: Deterministic sync timestamp per facility (in production, from API)
    // Use facility ID hash to create consistent timestamp per facility
    const facilityHash = facilityData.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hoursAgo = (facilityHash % 7); // Deterministic 0-6 hours ago based on facility ID
    const syncTimestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    
    // Convert to Facility format for scoring (safe-access pattern)
    const facility: any = {
      ...facilityData,
      staffingDetails: {
        rn: facilityData.staffingDetails?.rn?.map(r => ({ ...r, role: 'RN' as const, period: new Date() })) || [],
        lpn: facilityData.staffingDetails?.lpn?.map(r => ({ ...r, role: 'LPN' as const, period: new Date() })) || [],
        cna: facilityData.staffingDetails?.cna?.map(r => ({ ...r, role: 'CNA' as const, period: new Date() })) || [],
        alerts: facilityData.staffingDetails?.alerts || [],
      },
    };
    
    // Calculate attention score and intensity (standardized - UI only cares about intensity, not why)
    const scoreResult = calculateAttentionScore(facility);
    const intensity = getIntensityLabel(scoreResult.score); // Low, Elevated, Critical - domain-agnostic
    
    // Calculate confidence level based on data completeness
    const confidence = calculateConfidence(facilityData);
    
    // Generate headline, observation, and STATE OBSERVATION using signal dictionary
    let headline = '';
    let observation = '';
    let stateObservation = '';
    const evidence: CanonicalFacility['evidence'] = {};
    
    // Domain-specific signal detection based on stress category
    if (scoreResult.stressCategory === 'staffing') {
      // Staffing domain: Generate state observation (not just calculation)
      const skeletonCrewResult = SIGNAL_DICTIONARY['skeleton-crew'].calculation(facilityData);
      const staffingGap = skeletonCrewResult.gap ?? 0; // Safe-access pattern
      
      // Generate STATE OBSERVATION (narrative, not calculation)
      stateObservation = SIGNAL_DICTIONARY['skeleton-crew'].stateObservation(facilityData);
      
      if (skeletonCrewResult.detected && staffingGap > 0) {
        headline = `${facilityData.name}: ${SIGNAL_DICTIONARY['skeleton-crew'].name}`;
        observation = SIGNAL_DICTIONARY['skeleton-crew'].observation(staffingGap);
        evidence.staffingGap = staffingGap;
      } else {
        headline = `${facilityData.name}: Staffing Observation`;
        observation = 'Observation: Staffing levels align with scheduled requirements.';
      }
      
      // Calculate trend delta (safe-access pattern)
      const trend = facilityData.staffingTrend;
      if (trend && Array.isArray(trend) && trend.length >= 2) {
        const first = trend[0];
        const last = trend[trend.length - 1];
        if (first && first > 0) {
          const delta = ((last - first) / first) * 100;
          if (delta < -10) evidence.trendDelta = `↓ ${Math.abs(delta).toFixed(0)}%`;
          else if (delta > 10) evidence.trendDelta = `↑ ${delta.toFixed(0)}%`;
          else evidence.trendDelta = '→ stable';
        }
      }
    } else if (scoreResult.stressCategory === 'acuity') {
      // Billing domain: Generate state observation
      const acuityResult = SIGNAL_DICTIONARY['acuity-mismatch'].calculation(facilityData);
      headline = `${facilityData.name}: ${SIGNAL_DICTIONARY['acuity-mismatch'].name}`;
      
      // Generate STATE OBSERVATION
      stateObservation = SIGNAL_DICTIONARY['acuity-mismatch'].stateObservation(facilityData);
      
      if (acuityResult.detected) {
        observation = SIGNAL_DICTIONARY['acuity-mismatch'].observation(acuityResult.observed, acuityResult.billing);
        evidence.acuityMismatch = true;
      } else {
        observation = 'Observation: Acuity levels align with billing status.';
      }
    } else if (scoreResult.stressCategory === 'compliance') {
      // Safety domain: Generate state observation
      const safetyResult = SIGNAL_DICTIONARY['safety-incident'].calculation(facilityData);
      
      // Generate STATE OBSERVATION
      stateObservation = SIGNAL_DICTIONARY['safety-incident'].stateObservation(facilityData);
      
      if (safetyResult.detected && safetyResult.incidentCount > 0) {
        headline = `${facilityData.name}: ${SIGNAL_DICTIONARY['safety-incident'].name}`;
        observation = SIGNAL_DICTIONARY['safety-incident'].observation(safetyResult.incidentCount);
      } else {
        headline = `${facilityData.name}: Compliance Observation`;
        observation = 'Observation: Compliance signals within expected parameters.';
      }
    } else {
      // Communication or other category
      headline = `${facilityData.name}: Operational Signal`;
      observation = scoreResult.primarySignal || 'Observation: Operational signals within expected parameters.';
      stateObservation = 'Observation: Operational signals within expected parameters.';
    }
    
    // Calculate standardized revenue delta (safe-access pattern)
    const census = facilityData.census || Math.round(
      (facilityData.staffingDetails?.cna?.reduce((sum, r) => sum + (r?.scheduled || 0), 0) || 0) / 1.8
    );
    const revenueDelta = calculateStandardizedRevenue(facilityData, census);
    if (revenueDelta > 0) {
      evidence.revenueLeak = revenueDelta;
    }
    
    return {
      id: facilityData.id,
      name: facilityData.name,
      syncTimestamp,
      revenueDelta,
      intensity, // Standardized intensity label (Low, Elevated, Critical) - UI doesn't care why
      stressCategory: scoreResult.stressCategory,
      headline,
      observation,
      stateObservation, // Narrative state observation (e.g., "40 residents but only 2 CNAs visible")
      confidence, // High/Med/Low based on data completeness
      evidence,
      rawData: facilityData,
    };
  } catch (error) {
    // Error-proofing: Return safe fallback facility to prevent total app crash
    console.error(`[BriefingContext] Error creating canonical facility for ${facilityData.id}:`, error);
    
    return {
      id: facilityData.id,
      name: facilityData.name || 'Unknown Facility',
      syncTimestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago (stale)
      revenueDelta: 0,
      intensity: 'Elevated' as const, // Elevated due to calculation error
      stressCategory: 'compliance' as const,
      headline: `${facilityData.name || 'Facility'}: Calculation Error`,
      observation: 'Observation: Sync required. Data processing error detected.',
      stateObservation: 'Observation: Staffing roster appears inconsistent with census requirements. Verification suggested.',
      confidence: 'Low' as const, // Low confidence due to error
      evidence: {},
      rawData: facilityData,
    };
  }
}

export function BriefingProvider({ children }: BriefingProviderProps) {
  const [canonicalFacilities, setCanonicalFacilities] = useState<CanonicalFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Transform Supabase row to FacilityData format
  const transformSupabaseToFacilityData = (supabaseRow: any): FacilityData => {
    const staffing = supabaseRow.staffing || {};
    const billing = supabaseRow.billing || {};
    const safety = supabaseRow.safety || {};
    const documentation = supabaseRow.documentation || {};
    
    // Calculate staffing gap
    const gap = staffing.gap || (staffing.budgeted - staffing.scheduled) || 0;
    
    // Build staffing details array format expected by FacilityData
    // Create default arrays based on gap if detailed data not available
    const defaultRn = gap > 0 ? [{ scheduled: 6, actual: 6 - gap }] : [{ scheduled: 6, actual: 6 }];
    const defaultCna = [{ scheduled: 12, actual: 12 }];
    
    return {
      id: supabaseRow.id,
      name: supabaseRow.name,
      attentionScore: 0, // Will be calculated by createCanonicalFacility
      primaryStressSignal: gap > 0 ? 'Staffing Gap Detected' : 'Operational Signal',
      stressCategory: (gap > 0 ? 'staffing' : (billing.acuity !== billing.status ? 'acuity' : 'compliance')) as 'staffing' | 'acuity' | 'compliance' | 'communication',
      staffingTrend: [1.0, 0.95, 0.90, 0.85, 0.80, 0.75, gap > 0 ? 0.70 : 0.75], // Default trend
      uncapturedRevenue: gap > 0 ? (gap * (staffing.hourly_rate || 45) * (staffing.hours_affected || 8)) : 0,
      actionStatus: gap > 0 ? 'defense-memo-needed' : 'audit-ready',
      census: supabaseRow.census || 0,
      staffingDetails: {
        rn: defaultRn,
        lpn: [],
        cna: defaultCna,
        alerts: gap > 0 ? [`Staffing gap of ${gap} positions detected`] : [],
      },
      revenueDetails: {
        observedAcuity: (billing.acuity || 'STANDARD') as 'LOW' | 'STANDARD' | 'HIGH' | 'CRITICAL',
        billingStatus: (billing.status || 'STANDARD') as 'LOW' | 'STANDARD' | 'HIGH' | 'CRITICAL',
        dailyMismatch: gap > 0 ? (gap * (staffing.hourly_rate || 45) * (staffing.hours_affected || 8)) : 0,
      },
      defensibility: {
        agencyCallsDocumented: documentation.agency_calls_documented !== false,
        floatPoolOffered: documentation.float_pool_offered === true,
        donNotified: documentation.don_notified === true,
        lastMemoDate: documentation.last_memo_date || null,
      },
    };
  };
  
  // Fetch facilities from Supabase
  useEffect(() => {
    let mounted = true;
    
    async function fetchFacilities() {
      if (!mounted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: supabaseError } = await supabase
          .from('facilities')
          .select('*')
          .order('name', { ascending: true });
        
        if (!mounted) return;
        
        if (supabaseError) {
          console.error('❌ BriefingContext: Supabase fetch error:', supabaseError);
          throw supabaseError;
        }
        
        // Transform Supabase data to FacilityData format
        const transformedFacilities = (data || []).map(transformSupabaseToFacilityData);
        
        // Convert to canonical format
        const canonical = transformedFacilities.map((facility, index) => createCanonicalFacility(facility, index));
        
        if (mounted) {
          setCanonicalFacilities(canonical);
        }
      } catch (err) {
        console.error('❌ BriefingContext: Error fetching facilities:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setCanonicalFacilities([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    const loadFacilities = async () => {
      if (!mounted) return;
      await fetchFacilities();
    };
    
    loadFacilities();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  const updateSyncTimestamp = (facilityId: string, timestamp: Date) => {
    setCanonicalFacilities(prev =>
      prev.map(f => f.id === facilityId ? { ...f, syncTimestamp: timestamp } : f)
    );
  };
  
  const updateRevenueDelta = (facilityId: string, delta: number) => {
    setCanonicalFacilities(prev =>
      prev.map(f => f.id === facilityId ? { ...f, revenueDelta: delta } : f)
    );
  };
  
  // Refresh function - can be called after successful data ingestion
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('facilities')
        .select('*')
        .order('name', { ascending: true });
      
      if (supabaseError) {
        console.error('❌ BriefingContext: Supabase fetch error:', supabaseError);
        throw supabaseError;
      }
      
      // Transform Supabase data to FacilityData format
      const transformedFacilities = (data || []).map(transformSupabaseToFacilityData);
      
      // Convert to canonical format
      const canonical = transformedFacilities.map((facility, index) => createCanonicalFacility(facility, index));
      
      setCanonicalFacilities(canonical);
    } catch (err) {
      console.error('❌ BriefingContext: Error refreshing facilities:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCanonicalFacilities([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return (
    <BriefingContext.Provider
      value={{
        facilities: canonicalFacilities,
        loading,
        error,
        updateSyncTimestamp,
        updateRevenueDelta,
        refresh,
      }}
    >
      {children}
    </BriefingContext.Provider>
  );
}

