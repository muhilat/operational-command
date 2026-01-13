-- Create liability_memos table for VRT3X Shield functionality
-- This table stores defense memos with SHA-256 hashes for audit trail

CREATE TABLE IF NOT EXISTS liability_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  facility_name TEXT NOT NULL,
  observations JSONB NOT NULL,
  hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_liability_memos_facility 
ON liability_memos(facility_id);

CREATE INDEX IF NOT EXISTS idx_liability_memos_created 
ON liability_memos(created_at DESC);
