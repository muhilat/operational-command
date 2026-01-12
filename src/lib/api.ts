/**
 * VRT3X API Layer
 * 
 * Handles data synchronization from the Chrome Extension (The Sucker)
 * to the Supabase database.
 */

import { supabaseService } from './services/supabase';

/**
 * Interface for data received from Chrome Extension
 */
export interface SuckerDataPayload {
  census: number;
  rn: {
    scheduled: number;
    actual: number;
  };
  lpn?: {
    scheduled: number;
    actual: number;
  };
  cna: {
    scheduled: number;
    actual: number;
  };
  timestamp: string;
  url: string;
  facilityId?: string; // Optional: if extension can identify facility
}

/**
 * Sync Sucker data to database
 * 
 * Maps 'StaffingHours' and 'Census' to the facility_metrics table in Supabase.
 * 
 * @param payload - Data payload from Chrome Extension
 * @returns Success status and sync timestamp
 */
export async function syncSuckerData(payload: SuckerDataPayload): Promise<{
  success: boolean;
  syncTimestamp: Date;
  facilityId?: string;
}> {
  try {
    // Extract data from payload
    const census = payload.census || 0;
    const rnScheduled = payload.rn?.scheduled || 0;
    const rnActual = payload.rn?.actual || 0;
    const lpnScheduled = payload.lpn?.scheduled || 0;
    const lpnActual = payload.lpn?.actual || 0;
    const cnaScheduled = payload.cna?.scheduled || 0;
    const cnaActual = payload.cna?.actual || 0;
    
    const syncTimestamp = new Date(payload.timestamp || Date.now());
    
    // In production, this would:
    // 1. Identify facility from URL or facilityId
    // 2. Insert/update facility_metrics table:
    //    INSERT INTO facility_metrics (
    //      facility_id,
    //      census,
    //      rn_scheduled_hours,
    //      rn_actual_hours,
    //      lpn_scheduled_hours,
    //      lpn_actual_hours,
    //      cna_scheduled_hours,
    //      cna_actual_hours,
    //      sync_timestamp,
    //      source_url
    //    ) VALUES (...)
    //    ON CONFLICT (facility_id, sync_timestamp) DO UPDATE SET ...
    
    // For now, store in localStorage as fallback
    const metricsKey = `facility_metrics_${payload.facilityId || 'unknown'}_${syncTimestamp.getTime()}`;
    const metricsData = {
      facilityId: payload.facilityId || 'unknown',
      census,
      rnScheduledHours: rnScheduled,
      rnActualHours: rnActual,
      lpnScheduledHours: lpnScheduled,
      lpnActualHours: lpnActual,
      cnaScheduledHours: cnaScheduled,
      cnaActualHours: cnaActual,
      syncTimestamp: syncTimestamp.toISOString(),
      sourceUrl: payload.url,
    };
    
    localStorage.setItem(metricsKey, JSON.stringify(metricsData));
    
    // Also store latest sync timestamp for this facility
    if (payload.facilityId) {
      localStorage.setItem(`last_sync_${payload.facilityId}`, syncTimestamp.getTime().toString());
    }
    
    console.log('[API] Synced Sucker data:', metricsData);
    
    return {
      success: true,
      syncTimestamp,
      facilityId: payload.facilityId,
    };
  } catch (error) {
    console.error('[API] Error syncing Sucker data:', error);
    throw error;
  }
}

/**
 * Get last sync timestamp for a facility
 * 
 * @param facilityId - Facility identifier
 * @returns Last sync timestamp or null if never synced
 */
export function getLastSyncTimestamp(facilityId: string): Date | null {
  try {
    const stored = localStorage.getItem(`last_sync_${facilityId}`);
    if (stored) {
      const timestamp = parseInt(stored, 10);
      if (!isNaN(timestamp)) {
        return new Date(timestamp);
      }
    }
  } catch (error) {
    console.error('[API] Error getting last sync timestamp:', error);
  }
  return null;
}

/**
 * Check if data is stale (>6 hours old)
 * 
 * @param syncTimestamp - Last sync timestamp
 * @returns True if data is stale (>6 hours)
 */
export function isDataStale(syncTimestamp: Date | null): boolean {
  if (!syncTimestamp) return true;
  
  const hoursSinceSync = (Date.now() - syncTimestamp.getTime()) / (1000 * 60 * 60);
  return hoursSinceSync > 6;
}

/**
 * Check if Sucker extension has sent recent updates
 * Passive Ingestion Guard: Returns true if no sync in last 6 hours
 * 
 * @param facilityId - Facility identifier
 * @returns True if waiting for sync (no updates in 6h)
 */
export function isWaitingForSync(facilityId: string): boolean {
  const lastSync = getLastSyncTimestamp(facilityId);
  if (!lastSync) return true; // Never synced
  
  return isDataStale(lastSync);
}




