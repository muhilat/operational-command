# Discrepancy Resolution Verification

## Summary: All 12 Discrepancies Resolved via SSoT Architecture

This document verifies that all identified discrepancies have been eliminated through the implementation of a Single Source of Truth (SSoT) architecture.

---

## ✅ Discrepancy #1: "Last Sync" Inconsistency Across Views

**Problem**: Same facility showed different sync times in Brief vs Detail vs Sidebar.

**Resolution**: 
- ✅ All views now use `canonicalFacility.syncTimestamp` from `BriefingContext` (SSoT)
- ✅ Sidebar shows most recent facility sync: `Math.max(...canonicalFacilities.map(f => f.syncTimestamp))`
- ✅ Brief uses: `item.syncTimestamp` (from canonical facility)
- ✅ Detail uses: `canonicalFacility.syncTimestamp`
- ✅ Deterministic sync timestamps per facility (hash-based, not random)

**Files Changed**:
- `src/context/BriefingContext.tsx`: Deterministic sync timestamp creation
- `src/components/AppSidebar.tsx`: Uses most recent facility sync from context
- `src/components/dashboard/AttentionBrief.tsx`: Uses canonical syncTimestamp
- `src/pages/FacilityDrillDown.tsx`: Uses canonical syncTimestamp

---

## ✅ Discrepancy #2: "Data Decay" Label Inconsistency

**Problem**: Some cards said "Data decay detected", others "Data decay", others nothing.

**Resolution**:
- ✅ Standardized to single label: "Attention Degraded"
- ✅ Consistent 4-hour threshold across all views (`hoursSinceSync > 4`)
- ✅ Always shows with amber styling (`text-[#fbbf24]`)
- ✅ Badge shows "Sync Required" with RefreshCw icon when stale

**Files Changed**:
- `src/components/dashboard/AttentionBrief.tsx`: Standardized to "Attention Degraded"
- `src/pages/FacilityDrillDown.tsx`: Standardized to "Attention Degraded"
- `src/lib/utils/cardState.ts`: AMBER state shows "Sync Required" badge

---

## ✅ Discrepancy #3: Severity Labels Conflict

**Problem**: Same facility showed "Low" in Brief but "Critical" in Detail.

**Resolution**:
- ✅ All views use `canonicalFacility.intensity` from SSoT context
- ✅ Intensity calculated once in `createCanonicalFacility()` using `getIntensityLabel()`
- ✅ Same facility always shows same intensity across all views

**Files Changed**:
- `src/context/BriefingContext.tsx`: Intensity calculated once per facility
- `src/components/dashboard/AttentionBrief.tsx`: Uses `item.intensity` from canonical
- `src/pages/FacilityDrillDown.tsx`: Uses `canonicalFacility.intensity`

---

## ✅ Discrepancy #4: Same Signal Name, Different Implications

**Problem**: "Skeleton Crew Signal" had varying observations, severity, and financial impact.

**Resolution**:
- ✅ Created `SIGNAL_DICTIONARY` with fixed names, fixed observations, fixed calculations
- ✅ "Skeleton Crew Signal" always uses: `SIGNAL_DICTIONARY['skeleton-crew'].calculation()` and `SIGNAL_DICTIONARY['skeleton-crew'].observation()`
- ✅ Same signal always produces same headline, observation, and evidence

**Files Changed**:
- `src/context/BriefingContext.tsx`: `SIGNAL_DICTIONARY` with fixed signal definitions
- All signal generation uses dictionary, not ad-hoc logic

---

## ✅ Discrepancy #5: Uncaptured Revenue Differs (7.4×)

**Problem**: Brief showed $250/day, Detail showed $1,850/day for same facility.

**Resolution**:
- ✅ Standardized calculation: Fixed `$250/day` rate (not variable)
- ✅ All views use `canonicalFacility.revenueDelta` from SSoT
- ✅ Calculation: `250 * census` when leak detected
- ✅ Removed all local revenue calculations

**Files Changed**:
- `src/context/BriefingContext.tsx`: `calculateStandardizedRevenue()` with fixed $250/day
- `src/components/dashboard/AttentionBrief.tsx`: Uses `item.revenueDelta` from canonical
- `src/pages/FacilityDrillDown.tsx`: Uses `canonicalFacility.revenueDelta`

---

## ✅ Discrepancy #6: Node 2 and Node 3 Show Identical Values

**Problem**: Both nodes showed same acuity, billing status, and revenue.

**Resolution**:
- ✅ **Node 2 (Defense/The Shield)**: Focus on **Clinical Documentation Gaps**
  - Shows: "Observed Clinical Acuity" vs "Documented Acuity Level"
  - Observation: "Clinical documentation gap detected..."
- ✅ **Node 3 (Profit/The Bridge)**: Focus on **Billing Code Integrity**
  - Shows: "Current Billing Code" vs "Billing Alignment"
  - Observation: "Billing code integrity discrepancy..."

**Files Changed**:
- `src/pages/FacilityDrillDown.tsx`: Separated Node 2 and Node 3 content and focus

---

## ✅ Discrepancy #7: Node 3 "Recommendation" Language

**Problem**: Node 3 showed "Recommendation" which creates liability.

**Resolution**:
- ✅ Removed all "Recommendation" language
- ✅ Converted to "System Observation" everywhere
- ✅ No prescriptive directives, only descriptive observations

**Files Changed**:
- `src/pages/FacilityDrillDown.tsx`: Replaced "Recommendation" with "System Observation"
- `src/data/facilityData.ts`: `recommendation` field still exists in raw data but is never displayed

---

## ✅ Discrepancy #8: Node 1 Blur Despite Active Alerts

**Problem**: Node 1 was visually blurred/dimmed even when containing critical staffing signals.

**Resolution**:
- ✅ Removed all blur effects from Node 1 (`blur-[0.5px]` removed)
- ✅ No opacity reduction
- ✅ Visual clarity maintained even when data is stale (uses AMBER state, not blur)

**Files Changed**:
- `src/pages/FacilityDrillDown.tsx`: Removed blur from Node 1 panel body
- `src/lib/utils/cardState.ts`: AMBER state uses grayscale, not blur

---

## ✅ Discrepancy #9: Focus Selection Doesn't Change Emphasis

**Problem**: Selecting "Staffing" focus didn't make Node 1 visually primary.

**Resolution**:
- ✅ Implemented Causal Hierarchy: If `calibration.focusArea === 'staffing'`, Node 1 gets:
  - Enhanced border: `border-2` (double width)
  - Visual priority glow: `box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.2)`
  - Never muted (always ACTIVE state when staffing focus)

**Files Changed**:
- `src/pages/FacilityDrillDown.tsx`: Causal hierarchy logic with enhanced styling for Node 1 when staffing focus
- `src/lib/utils/cardState.ts`: `getCardState()` respects `isSelectedFocus` to prevent muting

---

## ✅ Discrepancy #10: Facility Count Doesn't Filter Cards

**Problem**: Inputting "4 facilities" didn't limit the Brief to 4 cards.

**Resolution**:
- ✅ Exact filtering: `sorted.slice(0, calibration.facilityCount)`
- ✅ If user inputs 4, exactly 4 facilities are shown
- ✅ No approximation, no rounding

**Files Changed**:
- `src/components/dashboard/AttentionBrief.tsx`: `slice(0, calibration.facilityCount)` after sorting

---

## ✅ Discrepancy #11: Sidebar "Last Sync: Never" Contradiction

**Problem**: Sidebar showed "Never" while main content showed sync times.

**Resolution**:
- ✅ Sidebar now uses most recent facility sync from `BriefingContext`
- ✅ Calculates: `Math.max(...canonicalFacilities.map(f => f.syncTimestamp.getTime()))`
- ✅ Shows same sync time format as facility cards: `formatDistanceToNow(mostRecentSync, { addSuffix: true })`
- ✅ Amber status when most recent sync > 4 hours

**Files Changed**:
- `src/components/AppSidebar.tsx`: Uses `useBriefingContext()` to get most recent facility sync
- Removed dependency on separate `useSyncStatus` hook with localStorage

---

## ✅ Discrepancy #12: Visual Hierarchy Inverts Causality

**Problem**: Financial numbers were prominent, staffing alerts were dimmed.

**Resolution**:
- ✅ Revenue metrics dimmed to Slate-500 (`#64748B`) to reduce visual prominence
- ✅ Node 1 (staffing) is visually primary when staffing focus (enhanced border + glow)
- ✅ All revenue displays use reduced contrast: `style={{ color: '#64748B' }}`
- ✅ Root causes (staffing) visually prioritized over effects (revenue)

**Files Changed**:
- `src/components/dashboard/AttentionBrief.tsx`: Revenue dimmed to `#64748B`
- `src/pages/FacilityDrillDown.tsx`: Revenue dimmed to `#64748B`
- `src/pages/FacilityDrillDown.tsx`: Node 1 gets visual priority when staffing focus

---

## Architecture Summary

### Single Source of Truth (SSoT)
- **Context**: `src/context/BriefingContext.tsx`
- **Canonical Fields**:
  - `syncTimestamp`: Single sync time per facility
  - `revenueDelta`: Standardized $250/day calculation
  - `intensity`: Calculated once, used everywhere
  - `headline`: Fixed from SIGNAL_DICTIONARY
  - `observation`: Fixed from SIGNAL_DICTIONARY

### Signal Dictionary
- Central definitions in `BriefingContext.tsx`
- Fixed names, fixed observations, fixed calculations
- No ad-hoc signal generation

### Standardized Thresholds
- Stale threshold: **4 hours** (consistent across all views)
- Revenue calculation: **$250/resident/day** (fixed rate)
- AMBER state: Shows "Sync Required" badge when stale

### Visual Hierarchy
- Revenue: Dimmed to Slate-500 (`#64748B`)
- Node 1: Visual priority when staffing focus
- No blur effects: Uses opacity + grayscale for AMBER state

---

## Verification Checklist

- [x] All views use canonical syncTimestamp
- [x] Data decay label standardized to "Attention Degraded"
- [x] All views use canonical intensity
- [x] Signal dictionary ensures consistent signals
- [x] All views use canonical revenueDelta ($250/day)
- [x] Node 2 and Node 3 have distinct content and focus
- [x] All recommendations removed, converted to observations
- [x] No blur on Node 1
- [x] Causal hierarchy implemented (Node 1 priority when staffing focus)
- [x] Facility count exactly filters cards
- [x] Sidebar uses most recent facility sync
- [x] Revenue metrics dimmed, staffing prioritized visually

---

**Status**: ✅ **ALL 12 DISCREPANCIES RESOLVED**




