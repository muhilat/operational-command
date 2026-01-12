# TraceLayer SNF - Production Refactor Summary

## Overview
This refactor separates UI from Business Logic, initializes automated data capture ("The Sucker"), and hardens the legal audit trail ("The Shield").

## Architecture Changes

### 1. Domain Integrity & Logic Extraction

#### New Files Created:
- **`src/types/snf.ts`**: Strict TypeScript interfaces for the domain model
  - `Facility`: Core entity with all operational data
  - `StaffingRecord`: Scheduled vs actual hours tracking
  - `IncidentSignal`: Detected operational stress indicators
  - `AcuityLevel`: Clinical complexity levels (LOW, STANDARD, HIGH, CRITICAL)
  - `MitigationEvent`: "Good Faith Effort" audit trail records

#### Business Logic Extraction:
- **`src/lib/logic/scoring.ts`**: The "Brain" - completely decoupled from UI
  - `calculateAttentionScore()`: Pure function that takes facility data and returns score + signals
  - `detectIncidentSignals()`: Heuristic algorithm for stress detection
  - `applySafeHarborFilter()`: Legal-safe language sanitization
  - `getScoreCategory()`: UI helper (moved from data layer)

**Key Principle**: The scoring algorithm is now a pure function with no React dependencies. It can be:
- Tested in isolation
- Used in background workers
- Called from API endpoints
- Reused across different UI frameworks

### 2. The Sucker (Automated Capture)

#### Extension Structure:
```
extension/
├── manifest.json          # Manifest V3 configuration
├── content.ts            # TypeScript source (for development)
├── content.js            # Compiled content script
├── background.js         # Service worker
├── popup.html            # Extension popup UI
└── popup.js              # Popup logic
```

**Key Features**:
- MutationObserver for passive DOM scraping
- Targets `#staffing_grid` on PointClickCare staffing pages
- Extracts RN/CNA scheduled vs actual hours
- Stores data in `chrome.storage.local`
- No API dependencies - pure read-only scraping

### 3. The Shield (Audit Trail)

#### Database Migration:
- **`supabase/migrations/20260106_add_mitigation_events.sql`**
  - Creates `mitigation_events` table with RLS policies
  - Tracks all "Good Faith Effort" actions
  - Includes `audit_reference_id` for PDF linkage

#### UI Integration:
- **`src/pages/FacilityDrillDown.tsx`**: Updated "Generate Defense Memo" flow
  1. Opens dialog requiring "Action Taken" input
  2. Creates `mitigation_events` record BEFORE PDF generation
  3. Includes audit reference ID in PDF footer
  4. Full audit trail linkage

#### Service Layer:
- **`src/lib/services/supabase.ts`**: Database operations abstraction
  - `createMitigationEvent()`: Writes to database
  - `getMitigationEvents()`: Retrieves facility history
  - Currently uses localStorage fallback (replace with real Supabase client)

### 4. Operational Safety

#### Safe Harbor Filter:
The `applySafeHarborFilter()` function in `scoring.ts` ensures all generated text avoids legal liability language:

**Forbidden Words** → **Replacements**:
- "Negligence" → "Attention Priority"
- "Error" → "Operational Drift"
- "Fault" → "Documentation Gap"
- "Failure" → "Operational Drift"
- "Mistake" → "Documentation Gap"

## Decoupling: Brain from UI

### Before Refactor:
- Scoring logic embedded in React components
- Hardcoded scores in mock data
- No separation of concerns
- Difficult to test or reuse

### After Refactor:

```
┌─────────────────────────────────────────┐
│         UI Layer (React)                │
│  - Components display data              │
│  - No business logic                    │
└──────────────┬──────────────────────────┘
               │
               │ calls
               ▼
┌─────────────────────────────────────────┐
│      Business Logic Layer               │
│  src/lib/logic/scoring.ts               │
│  - calculateAttentionScore()            │
│  - detectIncidentSignals()              │
│  - Pure functions, no React deps        │
└──────────────┬──────────────────────────┘
               │
               │ operates on
               ▼
┌─────────────────────────────────────────┐
│         Domain Types                    │
│  src/types/snf.ts                       │
│  - Facility, StaffingRecord, etc.       │
│  - Type-safe contracts                  │
└─────────────────────────────────────────┘
```

### Benefits:
1. **Testability**: Scoring logic can be unit tested without React
2. **Reusability**: Same logic can power API endpoints, background jobs, etc.
3. **Maintainability**: Business rules in one place, not scattered across components
4. **Type Safety**: Strict interfaces prevent data inconsistencies

## File Structure

```
operational-command/
├── src/
│   ├── types/
│   │   └── snf.ts                    # Domain types
│   ├── lib/
│   │   ├── logic/
│   │   │   └── scoring.ts            # The "Brain" - decoupled scoring
│   │   └── services/
│   │       └── supabase.ts           # Database operations
│   ├── components/                   # UI components (no business logic)
│   ├── pages/                        # Page components
│   └── data/
│       └── facilityData.ts           # Mock data (backward compatible)
├── extension/                        # Chrome Extension ("The Sucker")
│   ├── manifest.json
│   ├── content.js
│   └── background.js
└── supabase/
    └── migrations/
        └── 20260106_add_mitigation_events.sql  # "The Shield" table
```

## Next Steps

1. **Replace Mock Supabase Client**: Update `src/lib/services/supabase.ts` with actual `@supabase/supabase-js` client
2. **Implement PDF Generation**: Add actual PDF library (jsPDF/pdfkit) to `generateDefenseMemoPDF()`
3. **Add Authentication**: Integrate Supabase Auth for `userId` in mitigation events
4. **Connect Extension to Backend**: Sync `chrome.storage.local` data to database
5. **Add Unit Tests**: Test `calculateAttentionScore()` with various facility states

## Usage Example

```typescript
import { calculateAttentionScore } from '@/lib/logic/scoring';
import type { Facility } from '@/types/snf';

// Pure function - no React, no side effects
const result = calculateAttentionScore(facility);

// result.score: 0-100
// result.confidence: 'high' | 'medium' | 'low'
// result.stressSignals: IncidentSignal[]
// result.primarySignal: string (Safe Harbor filtered)
```

This can be called from:
- React components (for display)
- API routes (for server-side scoring)
- Background workers (for batch processing)
- Test suites (for validation)

---

**Status**: ✅ Refactor Complete
- Domain types defined
- Scoring logic extracted
- Extension initialized
- Audit trail hardened
- Safe Harbor filter active




