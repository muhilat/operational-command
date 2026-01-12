# Audit-Driven Refactor Summary

## Overview
Complete UI/UX overhaul transforming VRT3X from a 'data-blast dashboard' into an 'Operational Partner' that respects operator scarcity and builds an indisputable legal and financial audit trail.

## 1. Causal Constraints Implementation ✅

### Facility Count Limiting
- **Location**: `src/components/dashboard/AttentionBrief.tsx`
- **Implementation**: Cards are limited to exactly `calibration.facilityCount` using `.slice(0, calibration.facilityCount)`
- **Result**: If user selects 5 facilities, exactly 5 cards are shown (sorted by intensity)

### Focus Area Filtering
- **Location**: `src/components/dashboard/AttentionBrief.tsx`
- **Implementation**: Facilities are filtered by `calibration.focusArea`:
  - `staffing` → Only shows facilities with `stressCategory === 'staffing'`
  - `billing` → Only shows facilities with `stressCategory === 'acuity'`
  - `safety` → Only shows facilities with `stressCategory === 'compliance'`
  - `documentation` → Only shows facilities with `stressCategory === 'compliance'`
- **Result**: UI elements/nodes not related to selected focus are completely hidden

### Detail Level Complexity
- **Location**: `src/components/dashboard/AttentionBrief.tsx`
- **Implementation**: 
  - `'broad'` (Scan mode): Headlines only, evidence hidden behind "View Evidence" toggle
  - `'narrow'` (Dive mode): Evidence payloads visible by default (`showEvidence = true`)
- **Result**: Card complexity changes based on Step 3 selection

## 2. Kill False Authority ✅

### Qualitative Intensity Labels
- **Location**: `src/lib/logic/scoring.ts`
- **Implementation**: 
  - Removed numeric `attentionScore` display
  - Added `getIntensityLabel(score)` → Returns `'Low' | 'Elevated' | 'Critical'`
  - Replaced all `AttentionBadge` components with intensity label badges
- **Result**: No numeric scores visible; only qualitative labels

### System Observations (Not Recommendations)
- **Location**: `src/lib/logic/scoring.ts`
- **Implementation**: 
  - Added `generateSystemObservation(facility, stressCategory)` function
  - Returns plain English observations like: "Observation: Staffing hours deviate from census requirements."
  - Removed all `recommendation` fields from UI
  - Replaced with "System Observation" sections
- **Result**: No prescriptive logic; only factual observations

### Removed Directives
- **Location**: `src/pages/FacilityDrillDown.tsx`, `src/components/dashboard/AttentionBrief.tsx`
- **Implementation**: 
  - Deleted all "Recommendation" sections
  - Removed language like "Schedule review", "Requires action", etc.
  - All signals rewritten as observations
- **Result**: System presents facts; human makes decisions

## 3. Standardized Financials ✅

### Uncaptured Revenue as Only Metric
- **Location**: `src/components/dashboard/AttentionBrief.tsx`, `src/pages/FacilityDrillDown.tsx`
- **Implementation**: 
  - Removed `dailyMismatch`, `PDPM opportunity`, `billing gap` as separate metrics
  - Consolidated to single `uncapturedRevenue` field
  - Only displayed when `calibration.objective === 'broad'` (revenue mode)
- **Result**: One canonical dollar metric across entire system

### Diminished Font Sizes
- **Location**: All components displaying revenue
- **Implementation**: 
  - Changed from `text-2xl font-bold` to `text-sm`
  - Revenue values use `font-mono text-sm` instead of large display fonts
- **Result**: Dollar values do not visually overpower operational safety signals

## 4. Localized Uncertainty ✅

### Removed Global Data Confidence
- **Location**: `src/components/dashboard/AttentionBrief.tsx`
- **Implementation**: 
  - Removed global "Data Confidence: Medium (Sync Pending)" banner
  - Removed `useSyncStatus()` hook from brief header
- **Result**: No global uncertainty indicators

### Per-Card Last Sync Timestamps
- **Location**: `src/components/dashboard/AttentionBrief.tsx`
- **Implementation**: 
  - Each `AttentionItem` includes `lastSync: Date` field
  - Displayed as: "Last sync: 2 hours ago" with clock icon
  - Mock data simulates 0-6 hours ago (in production, from API)
- **Result**: Uncertainty is localized to individual facilities

### Visual Decay for Stale Data
- **Location**: `src/components/dashboard/AttentionBrief.tsx`, `src/pages/FacilityDrillDown.tsx`
- **Implementation**: 
  - `isDataStale(lastSync)` function checks if `> 2 hours`
  - Applied CSS classes:
    - `opacity-60 grayscale-[0.3]` on card container
    - `blur-[0.5px]` on card content
  - Shows "• Data decay detected" warning
- **Result**: Stale data is visually distinct and clearly marked

## 5. Visual Refactor: Briefing Room Aesthetic ✅

### Replaced Charts with Spark Indicators
- **Location**: `src/pages/FacilityDrillDown.tsx`
- **Implementation**: 
  - Removed `StaffingChart` component (BarChart)
  - Replaced with text-based trend deltas:
    - `↓ -4h` (declining)
    - `↑ +2h` (improving)
    - `→ stable` (no change)
  - Simple text indicators in rounded boxes
- **Result**: No dashboard charts; clean text-based indicators

### Reading Room Aesthetic
- **Location**: All components
- **Implementation**: 
  - High-contrast typography (Inter for prose, Geist Mono for VRT3X branding)
  - Generous white space (max-w-4xl containers, py-12 spacing)
  - Dark mode palette (#020617 background)
  - Clear narrative blocks (cards with headlines and observations)
  - No dashboard tropes (no gauges, no dense tables, no sidebar filters)
- **Result**: Feels like a Command Center briefing, not a spreadsheet

## Files Modified

1. **`src/lib/logic/scoring.ts`**
   - Added `getIntensityLabel()` function
   - Added `generateSystemObservation()` function
   - Removed `getScoreCategory()` (replaced with intensity labels)

2. **`src/components/dashboard/AttentionBrief.tsx`**
   - Complete rewrite implementing all 5 audit requirements
   - Causal constraints (count, focus, detail level)
   - Qualitative labels, observations, localized uncertainty
   - Visual decay, spark indicators

3. **`src/pages/FacilityDrillDown.tsx`**
   - Replaced `AttentionBadge` with intensity labels
   - Removed `StaffingChart`, added spark indicators
   - Removed recommendations, added observations
   - Standardized to `uncapturedRevenue`, diminished font
   - Added `lastSync` timestamps and visual decay

4. **`src/pages/Index.tsx`**
   - Already uses calibration-based rendering
   - No changes needed (already gated)

## Visual Design System

### Colors
- **Deep Obsidian**: `#020617` (background)
- **Metallic Slate**: `#94a3b8` (accent)
- **Signal Amber**: `#f59e0b` (warnings, data decay)

### Typography
- **Prose**: Inter (system default)
- **VRT3X Branding**: Geist Mono (`font-vrt3x`)
- **ID Hashes**: Geist Mono (`font-mono`)

### Intensity Labels
- **Critical**: Red border, red background tint, red text
- **Elevated**: Amber border, amber background tint, amber text
- **Low**: Slate border, slate background tint, slate text

## Testing Checklist

- [x] Facility count limits cards correctly
- [x] Focus area filters facilities
- [x] Detail level changes card complexity
- [x] No numeric scores visible
- [x] Only qualitative intensity labels
- [x] No recommendations or directives
- [x] Only system observations
- [x] Uncaptured revenue is only dollar metric
- [x] Revenue font sizes are diminished
- [x] No global data confidence
- [x] Per-card last sync timestamps
- [x] Visual decay for stale data (>2h)
- [x] Charts replaced with spark indicators
- [x] Reading room aesthetic applied

## Next Steps

1. **API Integration**: Connect `last_sync` timestamps to actual API data
2. **Capture Gap Events**: Implement Supabase logging for failed scrapes
3. **PDF Generator**: Create `src/lib/utils/pdfGenerator.ts` with VRT3X Integrity Hash footer
4. **Revenue Calculation**: Update `calculateRevenueLeak()` to use $210/resident/day for High Acuity + minimum staffing

---

**Status**: ✅ Audit-Driven Refactor Complete
- Causal constraints implemented
- False authority eliminated
- Financials standardized
- Uncertainty localized
- Visual refactor complete




