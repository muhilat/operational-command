-- Migration: Add mitigation_events table for "The Shield" audit trail
-- Created: 2025-01-06
-- Purpose: Track all "Good Faith Effort" actions taken in response to operational signals

-- Create mitigation_events table
CREATE TABLE IF NOT EXISTS mitigation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agency-call', 'float-pool-offer', 'don-notification', 'defense-memo', 'other')),
  action_taken TEXT NOT NULL,
  evidence_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  incident_signal_id TEXT,
  audit_reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on facility_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_mitigation_events_facility_id ON mitigation_events(facility_id);

-- Create index on timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_mitigation_events_timestamp ON mitigation_events(timestamp DESC);

-- Create index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_mitigation_events_user_id ON mitigation_events(user_id);

-- Create index on type for filtering by action type
CREATE INDEX IF NOT EXISTS idx_mitigation_events_type ON mitigation_events(type);

-- Create index on audit_reference_id for PDF reference lookups
CREATE INDEX IF NOT EXISTS idx_mitigation_events_audit_ref ON mitigation_events(audit_reference_id) WHERE audit_reference_id IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE mitigation_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own mitigation events
CREATE POLICY "Users can view their own mitigation events"
  ON mitigation_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own mitigation events
CREATE POLICY "Users can insert their own mitigation events"
  ON mitigation_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own mitigation events (within 24 hours)
CREATE POLICY "Users can update their own mitigation events"
  ON mitigation_events
  FOR UPDATE
  USING (auth.uid() = user_id AND created_at > NOW() - INTERVAL '24 hours');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mitigation_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER trigger_update_mitigation_events_updated_at
  BEFORE UPDATE ON mitigation_events
  FOR EACH ROW
  EXECUTE FUNCTION update_mitigation_events_updated_at();

-- Add comment to table
COMMENT ON TABLE mitigation_events IS 'Audit trail for all "Good Faith Effort" mitigation actions. Every operational failure must be paired with documented mitigation efforts.';
COMMENT ON COLUMN mitigation_events.action_taken IS 'Human-readable description of the action taken (e.g., "Called 3 agencies, offered float pool position")';
COMMENT ON COLUMN mitigation_events.evidence_payload IS 'JSONB object containing evidence (screenshots, logs, call records, etc.)';
COMMENT ON COLUMN mitigation_events.audit_reference_id IS 'Unique reference ID included in generated PDF footer for audit trail linkage';

