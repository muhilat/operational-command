-- Migration: Add critical state fields to facilities table
-- Created: 2025-01-15
-- Purpose: Track critical state observations from data ingestion

-- Add critical state fields to facilities table
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS critical_state BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS critical_reason TEXT,
ADD COLUMN IF NOT EXISTS last_critical_update TIMESTAMPTZ;

-- Create index on critical_state for fast filtering
CREATE INDEX IF NOT EXISTS idx_facilities_critical_state 
ON facilities(critical_state) 
WHERE critical_state = TRUE;

-- Add comment
COMMENT ON COLUMN facilities.critical_state IS 'Flagged as CRITICAL if staffing gap exceeds threshold (2 hours)';
COMMENT ON COLUMN facilities.critical_reason IS 'Reason for critical state (e.g., "RN gap of 2.0 hours")';
COMMENT ON COLUMN facilities.last_critical_update IS 'Timestamp when critical state was last updated';

