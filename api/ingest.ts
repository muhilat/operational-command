/**
 * VRT3X Data Ingestion API Endpoint
 * 
 * Accepts FACILITY_DATA_CAPTURED payload from the extension.
 * Maps data to facility_metrics table and flags state observations.
 * 
 * Authentication: X-API-Key header required
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiKey = process.env.VRT3X_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Extract facility ID from URL or identify facility
 * Supports multiple methods: direct ID, URL extraction, or name lookup
 */
async function extractFacilityId(url: string, payload: any): Promise<string | null> {
  // If facility_id is provided in payload, use it
  if (payload.facility_id && payload.facility_id !== 'unknown') {
    return payload.facility_id;
  }

  // Try to extract from URL patterns
  // Example: https://pointclickcare.com/facility/12345/staffing
  const urlMatch = url.match(/facility[\/=]([a-zA-Z0-9-]+)/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Fallback: try to find facility by name in facilities table
  if (payload.facilityName) {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('id')
        .ilike('name', `%${payload.facilityName}%`)
        .limit(1)
        .single();

      if (!error && data) {
        return data.id;
      }
    } catch (error) {
      console.error('[Ingest API] Error looking up facility by name:', error);
    }
  }

  return null;
}

/**
 * Calculate state observations and flag CRITICAL if gap exceeds threshold
 */
function calculateStateObservations(data: {
  rn?: { scheduled: number; actual: number };
  cna?: { scheduled: number; actual: number };
  staffing?: { budgeted: number; scheduled: number; actual: number; gap: number };
}): {
  isCritical: boolean;
  rnGap: number;
  cnaGap: number;
  criticalReason?: string;
} {
  const CRITICAL_THRESHOLD = 2; // 2 hours gap triggers CRITICAL

  // Calculate gaps from various data sources
  let rnGap = 0;
  let cnaGap = 0;

  // Method 1: Use role-specific data
  if (data.rn) {
    rnGap = (data.rn.scheduled || 0) - (data.rn.actual || 0);
  }
  if (data.cna) {
    cnaGap = (data.cna.scheduled || 0) - (data.cna.actual || 0);
  }

  // Method 2: Fallback to staffing object
  if (rnGap === 0 && data.staffing) {
    rnGap = (data.staffing.scheduled || data.staffing.budgeted || 0) - (data.staffing.actual || 0);
  }

  const isCritical = rnGap > CRITICAL_THRESHOLD || cnaGap > CRITICAL_THRESHOLD;

  let criticalReason: string | undefined;
  if (isCritical) {
    const reasons: string[] = [];
    if (rnGap > CRITICAL_THRESHOLD) {
      reasons.push(`RN gap of ${rnGap.toFixed(1)} hours`);
    }
    if (cnaGap > CRITICAL_THRESHOLD) {
      reasons.push(`CNA gap of ${cnaGap.toFixed(1)} hours`);
    }
    criticalReason = reasons.join(', ');
  }

  return {
    isCritical,
    rnGap,
    cnaGap,
    criticalReason,
  };
}

/**
 * Update facility record with critical flag if needed
 */
async function updateFacilityCriticalFlag(
  facilityId: string,
  isCritical: boolean,
  criticalReason?: string
): Promise<void> {
  try {
    // Update facilities table with critical state
    const { error } = await supabase
      .from('facilities')
      .update({
        critical_state: isCritical,
        critical_reason: criticalReason || null,
        last_critical_update: isCritical ? new Date().toISOString() : null,
      })
      .eq('id', facilityId);

    if (error) {
      console.error('[Ingest API] Error updating facility critical flag:', error);
      // Don't throw - this is non-critical
    }
  } catch (error) {
    console.error('[Ingest API] Error in updateFacilityCriticalFlag:', error);
    // Don't throw - this is non-critical
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check X-API-Key authentication
  const apiKeyHeader = req.headers['x-api-key'];
  if (!apiKeyHeader || apiKeyHeader !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing X-API-Key' });
  }

  try {
    const payload = req.body;

    // Validate payload structure
    // Accept multiple formats: new format (facilityName + staffing) or old format (rn/cna)
    const hasRequiredFields = 
      payload && 
      (payload.facilityName || payload.facility_id) &&
      (payload.census !== undefined || payload.staffing || payload.rn || payload.cna);

    if (!hasRequiredFields) {
      return res.status(400).json({
        error: 'Invalid payload: missing required fields. Need facilityName/facility_id and staffing data (census, rn, cna, or staffing object)',
      });
    }

    // Extract facility ID
    const facilityId = await extractFacilityId(payload.url || '', payload);
    if (!facilityId) {
      return res.status(400).json({
        error: 'Unable to determine facility_id. Please include facility_id in payload or ensure facilityName matches a facility in the database.',
      });
    }

    // Calculate state observations
    const stateObservations = calculateStateObservations({
      rn: payload.rn,
      cna: payload.cna,
      staffing: payload.staffing,
    });

    // Map to facility_metrics table structure
    // Support multiple payload formats (new format with staffing object or old format with rn/cna)
    const rnScheduled = payload.rn?.scheduled || payload.staffing?.scheduled || payload.staffing?.budgeted || 0;
    const rnActual = payload.rn?.actual || payload.staffing?.actual || 0;
    const cnaScheduled = payload.cna?.scheduled || 0;
    const cnaActual = payload.cna?.actual || 0;
    const lpnScheduled = payload.lpn?.scheduled || 0;
    const lpnActual = payload.lpn?.actual || 0;

    const metricsData = {
      facility_id: facilityId,
      census: payload.census || 0,
      rn_scheduled_hours: rnScheduled,
      rn_actual_hours: rnActual,
      lpn_scheduled_hours: lpnScheduled,
      lpn_actual_hours: lpnActual,
      cna_scheduled_hours: cnaScheduled,
      cna_actual_hours: cnaActual,
      sync_timestamp: payload.timestamp || payload.captureTimestamp || new Date().toISOString(),
      source_url: payload.url || '',
    };

    // Insert or update facility_metrics
    const { data: existingMetric, error: fetchError } = await supabase
      .from('facility_metrics')
      .select('id')
      .eq('facility_id', facilityId)
      .order('sync_timestamp', { ascending: false })
      .limit(1)
      .single();

    let result;
    if (existingMetric && !fetchError) {
      // Update existing record
      const { data, error } = await supabase
        .from('facility_metrics')
        .update(metricsData)
        .eq('id', existingMetric.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('facility_metrics')
        .insert(metricsData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Update facility critical flag if needed
    await updateFacilityCriticalFlag(
      facilityId,
      stateObservations.isCritical,
      stateObservations.criticalReason
    );

    // Update facilities table last_sync timestamp
    await supabase
      .from('facilities')
      .update({
        last_sync: new Date().toISOString(),
      })
      .eq('id', facilityId);

    // Return success response
    return res.status(200).json({
      success: true,
      facility_id: facilityId,
      metrics_id: result.id,
      state_observation: {
        is_critical: stateObservations.isCritical,
        rn_gap: stateObservations.rnGap,
        cna_gap: stateObservations.cnaGap,
        critical_reason: stateObservations.criticalReason,
      },
      sync_timestamp: result.sync_timestamp,
    });
  } catch (error: any) {
    console.error('[Ingest API] Error processing ingestion:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Unknown error',
    });
  }
}

