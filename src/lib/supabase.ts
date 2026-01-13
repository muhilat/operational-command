/**
 * Supabase Client
 * 
 * Real Supabase client for VRT3X production use.
 * This replaces the mock service in src/lib/services/supabase.ts
 * 
 * Setup:
 * 1. Create a .env file in the root directory
 * 2. Add your Supabase credentials:
 *    VITE_SUPABASE_URL=https://your-project.supabase.co
 *    VITE_SUPABASE_ANON_KEY=your-anon-key
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.warn('[Supabase] VITE_SUPABASE_URL is not set. Using mock service.');
}

if (!supabaseAnonKey) {
  console.warn('[Supabase] VITE_SUPABASE_ANON_KEY is not set. Using mock service.');
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Type-safe database types (generate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID)
export type Database = {
  public: {
    Tables: {
      mitigation_events: {
        Row: {
          id: string;
          user_id: string;
          facility_id: string;
          type: 'agency-call' | 'float-pool-offer' | 'don-notification' | 'defense-memo' | 'other';
          action_taken: string;
          evidence_payload: Record<string, unknown>;
          timestamp: string;
          incident_signal_id?: string;
          audit_reference_id?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          facility_id: string;
          type: 'agency-call' | 'float-pool-offer' | 'don-notification' | 'defense-memo' | 'other';
          action_taken: string;
          evidence_payload?: Record<string, unknown>;
          timestamp?: string;
          incident_signal_id?: string;
          audit_reference_id?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          facility_id?: string;
          type?: 'agency-call' | 'float-pool-offer' | 'don-notification' | 'defense-memo' | 'other';
          action_taken?: string;
          evidence_payload?: Record<string, unknown>;
          timestamp?: string;
          incident_signal_id?: string;
          audit_reference_id?: string;
        };
      };
      facility_metrics: {
        Row: {
          id: string;
          facility_id: string;
          census: number;
          rn_scheduled_hours: number;
          rn_actual_hours: number;
          lpn_scheduled_hours: number;
          lpn_actual_hours: number;
          cna_scheduled_hours: number;
          cna_actual_hours: number;
          sync_timestamp: string;
          source_url: string;
        };
        Insert: {
          id?: string;
          facility_id: string;
          census: number;
          rn_scheduled_hours: number;
          rn_actual_hours: number;
          lpn_scheduled_hours: number;
          lpn_actual_hours: number;
          cna_scheduled_hours: number;
          cna_actual_hours: number;
          sync_timestamp?: string;
          source_url: string;
        };
        Update: {
          id?: string;
          facility_id?: string;
          census?: number;
          rn_scheduled_hours?: number;
          rn_actual_hours?: number;
          lpn_scheduled_hours?: number;
          lpn_actual_hours?: number;
          cna_scheduled_hours?: number;
          cna_actual_hours?: number;
          sync_timestamp?: string;
          source_url?: string;
        };
      };
    };
  };
};

