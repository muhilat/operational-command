# VRT3X - Operational Intelligence Platform for Nursing Homes

## 🎯 Project Overview

**VRT3X** is a "Sovereign MVP" operational intelligence platform for Skilled Nursing Facilities (SNFs). The system follows the philosophy: **"The AI is a Sensor, not a Judge."**

### Core Principles
1. **Read-Only First**: Ingest data via scraping/CSV; never write to EHR
2. **The Shield Logic**: Every operational failure must be paired with automated "Good Faith Effort" documentation
3. **Attention Allocation**: Rank units by "Stress Level" to help COOs decide where to look first
4. **HIPAA-Aware**: Minimal data storage, local-first processing where possible

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API (BriefingContext)
- **Routing**: React Router DOM
- **PDF Generation**: jsPDF v4
- **Date Handling**: date-fns
- **Chrome Extension**: Manifest V3

### Key Design Patterns

#### 1. Single Source of Truth (SSoT)
- **`src/context/BriefingContext.tsx`** - The ONLY authoritative state
- All views (Sidebar, Brief, Detail, Revenue, Defense) pull from this context
- Eliminates data discrepancies between views

#### 2. State-Based Observations (Not Calculations)
- System generates **narrative state observations** instead of crashing on missing data
- Example: "Census shows 40 residents but staffing roster shows 2 CNAs visible"
- Philosophy: Capture "States of Stress" rather than perfect metrics

#### 3. Confidence Model
- Every facility has a **confidence level**: High/Med/Low
- Based on data completeness (census, staffing, acuity, billing)
- Low confidence = Amber/Gold styling (#F59E0B)

#### 4. Passive Ingestion Guards
- "Waiting for System Sync" badge when Sucker extension hasn't sent data in >6 hours
- Prevents false positives from stale data

---

## 📁 Project Structure

```
operational-command/
├── src/
│   ├── context/
│   │   └── BriefingContext.tsx      # SSoT - Canonical facility data
│   ├── pages/
│   │   ├── Dashboard.tsx            # Main entry point
│   │   ├── FacilityDrillDown.tsx    # Detailed facility view
│   │   ├── LiabilityDefense.tsx     # Shield page (mitigation events)
│   │   ├── RevenueIntegrity.tsx     # Revenue opportunities
│   │   └── Settings.tsx             # Calibration settings
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── AttentionBrief.tsx   # Main briefing view
│   │   │   └── CalibrationHandshake.tsx
│   │   └── AppSidebar.tsx
│   ├── lib/
│   │   ├── api.ts                   # Sucker-to-Shield API layer
│   │   ├── services/
│   │   │   └── supabase.ts         # Mock Supabase service
│   │   └── utils/
│   │       ├── cardState.ts         # Visual state logic
│   │       ├── defensiveGuards.ts   # Safe data access
│   │       └── generateMemo.ts      # Hashed PDF generation
│   └── types/
│       └── snf.ts                   # Core domain types
├── extension/                        # Chrome Extension (The Sucker)
│   ├── content.ts                   # DOM scraping
│   ├── background.js                # API sync
│   └── manifest.json
└── package.json
```

---

## 🔄 Data Flow: Sucker → Shield

```
1. Chrome Extension (The Sucker)
   ↓ Scrapes PointClickCare staffing grid
   ↓ Sends to: https://vrt3x.com/api/staffing-data
   
2. API Layer (src/lib/api.ts)
   ↓ syncSuckerData() processes payload
   ↓ Maps to facility_metrics structure
   ↓ Stores in Supabase (or localStorage in dev)
   
3. BriefingContext (SSoT)
   ↓ Reads from facility_metrics
   ↓ Calculates: syncTimestamp, revenueDelta, intensity, confidence
   ↓ Generates: stateObservation, headline, observation
   ↓ Provides canonical data to all views
   
4. Liability Defense Page
   ↓ Reads mitigation_events from Supabase
   ↓ Displays all defense memos with UUIDs
   ↓ Allows PDF download
   
5. Revenue Integrity Page
   ↓ Reads from BriefingContext (SSoT)
   ↓ Calculates Capture Gap (Staffing Acuity vs Billing)
   ↓ Shows facilities sorted by revenue
   ↓ Amber alerts for stale sync (>6h)
```

---

## 🎨 Key Features

### 1. State-Based Observations
- **Narrative First**: "40 residents but only 2 CNAs visible" instead of numeric gaps
- **No Crashes**: Missing data generates observations, not errors
- **Confidence Levels**: High/Med/Low based on data completeness

### 2. The Shield (Liability Defense)
- **Hashed PDFs**: Every defense memo has a unique UUID
- **Audit Trail**: Permanent record of "Good Faith Effort"
- **State Observations**: Shows all hashed observations

### 3. Revenue Integrity
- **Capture Gap**: Compares Staffing Acuity (from Sucker) to Billing Status
- **Identified Opportunities**: Shows potential revenue capture
- **Freshness Indicators**: "Observed X ago" for all signals

### 4. Calibration System
- **Facility Count**: Limits cards shown in Attention Brief
- **Focus Area**: Filters by staffing/billing/safety/documentation
- **Detail Level**: Changes card complexity (Scan vs Dive)

---

## 🔐 Legal Safe-Harbor

### Language Purge
- ❌ **Removed**: "Recommendation", "Schedule", "Should", "Must"
- ✅ **Replaced**: "Observation", "Verification suggested"
- ❌ **Removed**: Numeric "Attention Scores" (XX/100)
- ✅ **Replaced**: Qualitative labels (Low, Elevated, Critical)

### Example Transformations
- **Before**: "Recommendation: Schedule review of staffing levels"
- **After**: "Observation: Staffing hours deviate from census requirements; verification suggested."

---

## 🛡️ Defensive Programming

### Error Boundaries
- All core pages wrapped in React Error Boundaries
- Prevents total app crashes

### Safe Data Access
- Optional chaining (`?.`) throughout
- Nullish coalescing (`??`) for defaults
- Defensive guards: `getStaffingGap()`, `isDataStale()`

### Fallback States
- Missing data → AMBER state
- Calculation errors → "Sync Required" message
- No crashes on undefined variables

---

## 📊 Data Models

### CanonicalFacility (SSoT)
```typescript
interface CanonicalFacility {
  id: string;
  name: string;
  syncTimestamp: Date;           // Single source of truth
  revenueDelta: number;          // Single source of truth
  intensity: 'Low' | 'Elevated' | 'Critical';
  stressCategory: 'staffing' | 'acuity' | 'compliance' | 'communication';
  headline: string;
  observation: string;
  stateObservation: string;       // NEW: Narrative state observation
  confidence: 'High' | 'Med' | 'Low';  // NEW: Data completeness
  evidence: { ... };
  rawData: FacilityData;
}
```

### Signal Dictionary
- **skeleton-crew**: Staffing gap detection
- **acuity-mismatch**: Billing vs observed acuity
- **safety-incident**: Compliance signals

Each signal has:
- `name`: Signal identifier
- `observation`: Formatted observation text
- `stateObservation`: Narrative state description
- `calculation`: Safe calculation function

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
# Server runs on http://localhost:8080
```

### Build
```bash
npm run build
```

---

## 🧪 Testing

See `TESTING_GUIDE.md` for comprehensive testing checklist.

### Quick Test
1. Open http://localhost:8080
2. Complete Calibration Handshake
3. View Attention Brief (should show 4 facilities)
4. Navigate to "Revenue Integrity" (check confidence badges)
5. Navigate to "Liability Defense" (check state observations)

---

## 📝 Recent Changes (State-Based Refactor)

### ✅ Completed
1. **State Observations**: Narrative observations instead of calculations
2. **Confidence Model**: High/Med/Low confidence badges
3. **Passive Ingestion Guards**: "Waiting for System Sync" badges
4. **Empty States**: Helpful messages instead of "No data"
5. **Time as Signal**: "Observed X ago" throughout
6. **Error Handling**: No crashes on missing data

### 🔄 Philosophy Shift
- **Before**: Perfect calculations, crash on missing data
- **After**: State observations, graceful degradation

---

## 🔗 Key Files to Review

1. **`src/context/BriefingContext.tsx`** - Single Source of Truth
2. **`src/lib/api.ts`** - Sucker-to-Shield API
3. **`src/pages/LiabilityDefense.tsx`** - Shield page
4. **`src/pages/RevenueIntegrity.tsx`** - Revenue page
5. **`src/lib/utils/generateMemo.ts`** - Hashed PDF generation

---

## 📚 Documentation

- `TESTING_GUIDE.md` - Comprehensive testing checklist
- `SUCKER_TO_SHIELD_PIPELINE.md` - Pipeline implementation details
- `SHARING_WITH_CLAUDE.md` - How to share project
- `HOW_TO_VERIFY_SOVEREIGN_MVP.md` - Verification steps

---

## 🎯 Next Steps

1. **Backend Integration**: Connect to real Supabase instance
2. **Chrome Extension**: Deploy to Chrome Web Store
3. **Real-time Sync**: WebSocket for live updates
4. **PDF Storage**: Supabase Storage bucket setup

---

## 📄 License

[Your License Here]

---

**Status**: ✅ **Sovereign MVP Complete** - Ready for testing and deployment!

