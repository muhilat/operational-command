/**
 * Liability Defense Memo Generation API
 * 
 * Generates defense memos with SHA-256 hashes for audit trail.
 * Implements "The Shield" - every operational failure must be paired
 * with documented mitigation efforts.
 */

import { supabase } from '@/lib/supabase';
import type { CanonicalFacility } from '@/context/BriefingContext';

export interface MemoObservation {
  facilityName: string;
  census?: number;
  staffingGap?: number;
  acuityMismatch?: boolean;
  revenueDelta?: number;
  timestamp: string;
  syncTimestamp?: string;
}

export interface GeneratedMemo {
  id: string;
  facilityId: string;
  facilityName: string;
  hash: string;
  observations: MemoObservation[];
  createdAt: Date;
}

/**
 * Generate SHA-256 hash (browser-compatible)
 */
async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a liability defense memo with SHA-256 hash
 * 
 * @param facility - Canonical facility from BriefingContext
 * @param userId - Optional user ID who generated the memo
 * @returns Generated memo with hash
 */
export async function generateMemo(
  facility: CanonicalFacility,
  userId?: string
): Promise<GeneratedMemo> {
  try {
    // Create observations (OBSERVATIONAL ONLY - no prescriptive language)
    const observations: MemoObservation[] = [
      {
        facilityName: facility.name,
        census: facility.rawData.census,
        staffingGap: facility.evidence.staffingGap,
        acuityMismatch: facility.evidence.acuityMismatch,
        revenueDelta: facility.revenueDelta,
        timestamp: new Date().toISOString(),
        syncTimestamp: facility.syncTimestamp.toISOString(),
      },
    ];

    // Generate SHA-256 hash from observations
    const memoContent = JSON.stringify(observations, null, 2);
    const hash = await generateHash(memoContent);

    // Save to database
    const { data: memo, error } = await supabase
      .from('liability_memos')
      .insert({
        facility_id: facility.id,
        facility_name: facility.name,
        observations,
        hash,
        created_by: userId || 'system',
      })
      .select()
      .single();

    if (error) {
      console.error('[generateMemo] Database error:', error);
      throw new Error(`Failed to save memo: ${error.message}`);
    }

    if (!memo) {
      throw new Error('Memo was not created');
    }

    return {
      id: memo.id,
      facilityId: memo.facility_id,
      facilityName: memo.facility_name,
      hash: memo.hash,
      observations: memo.observations as MemoObservation[],
      createdAt: new Date(memo.created_at),
    };
  } catch (error) {
    console.error('[generateMemo] Error:', error);
    throw error;
  }
}

/**
 * Fetch memo history from database
 * 
 * @param limit - Maximum number of memos to fetch
 * @returns Array of memos ordered by creation date (newest first)
 */
export async function fetchMemoHistory(limit: number = 20): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('liability_memos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[fetchMemoHistory] Database error:', error);
      throw error;
    }

    return data ?? [];
  } catch (error) {
    console.error('[fetchMemoHistory] Error:', error);
    // Fallback to empty array on error
    return [];
  }
}

/**
 * Get memos for a specific facility
 * 
 * @param facilityId - Facility ID
 * @returns Array of memos for the facility
 */
export async function fetchMemosForFacility(facilityId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('liability_memos')
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[fetchMemosForFacility] Database error:', error);
      throw error;
    }

    return data ?? [];
  } catch (error) {
    console.error('[fetchMemosForFacility] Error:', error);
    return [];
  }
}

