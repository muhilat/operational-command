# 🚀 WEEK 2: ACTION PLAN (Prioritized)

## ✅ WEEK 1 STATUS: COMPLETE

All 9 checklist items verified. Ready for Week 2.

---

## 🎯 WEEK 2 PRIORITIES (In Order)

### **PRIORITY 1: Liability Defense Backend** (4 hours)

**Goal:** Make memos actually save to database with hashes

#### **Step 1: Create Database Table** (15 min)

Run in Supabase SQL Editor:

```sql
-- Create liability_memos table
CREATE TABLE IF NOT EXISTS liability_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id TEXT NOT NULL,
  user_id TEXT,
  observations JSONB NOT NULL,
  hash VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_liability_memos_facility_id 
ON liability_memos(facility_id);

CREATE INDEX IF NOT EXISTS idx_liability_memos_hash 
ON liability_memos(hash);

-- Enable RLS (Row Level Security)
ALTER TABLE liability_memos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own memos
CREATE POLICY "Users can read own memos"
ON liability_memos FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own memos
CREATE POLICY "Users can insert own memos"
ON liability_memos FOR INSERT
WITH CHECK (auth.uid()::text = user_id);
```

#### **Step 2: Create API Function** (1 hour)

Create `src/lib/api/generateMemo.ts`:

```typescript
import { supabase } from '@/lib/supabase';
import { createHash } from 'crypto';

export interface MemoObservation {
  facilityName: string;
  census?: number;
  staffingGap?: number;
  acuityMismatch?: boolean;
  timestamp: string;
}

export interface GeneratedMemo {
  id: string;
  facilityId: string;
  hash: string;
  observations: MemoObservation[];
  createdAt: Date;
}

/**
 * Generate a liability defense memo with SHA-256 hash
 */
export async function generateMemo(
  facilityId: string,
  userId?: string
): Promise<GeneratedMemo> {
  // Fetch facility from BriefingContext or Supabase
  // For now, we'll get it from context data
  
  // Create observations array
  const observations: MemoObservation[] = [
    {
      facilityName: 'Facility Name', // Get from context
      census: 45,
      staffingGap: 2,
      timestamp: new Date().toISOString(),
    },
  ];

  // Generate SHA-256 hash
  const memoContent = JSON.stringify(observations);
  const hash = createHash('sha256')
    .update(memoContent)
    .digest('hex');

  // Save to database
  const { data: memo, error } = await supabase
    .from('liability_memos')
    .insert({
      facility_id: facilityId,
      user_id: userId || 'anonymous',
      observations,
      hash,
    })
    .select()
    .single();

  if (error) {
    console.error('[generateMemo] Database error:', error);
    throw new Error(`Failed to save memo: ${error.message}`);
  }

  return {
    id: memo.id,
    facilityId: memo.facility_id,
    hash: memo.hash,
    observations: memo.observations as MemoObservation[],
    createdAt: new Date(memo.created_at),
  };
}
```

**Note:** For browser environment, use Web Crypto API instead of Node's `crypto`:

```typescript
// Browser-compatible hash function
async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

#### **Step 3: Update LiabilityDefense Page** (2 hours)

Add "Generate New Memo" section to `src/pages/LiabilityDefense.tsx`:

```typescript
import { generateMemo } from '@/lib/api/generateMemo';

// Add state
const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
const [isGenerating, setIsGenerating] = useState(false);

// Add handler
const handleGenerateMemo = async () => {
  if (!selectedFacilityId) return;
  
  setIsGenerating(true);
  try {
    const memo = await generateMemo(selectedFacilityId);
    alert(`Memo generated! Hash: ${memo.hash.substring(0, 8)}...`);
    // Refresh memo list
    loadMitigationEvents();
  } catch (error) {
    console.error('[LiabilityDefense] Error generating memo:', error);
    alert('Failed to generate memo. Please try again.');
  } finally {
    setIsGenerating(false);
    setSelectedFacilityId(null);
  }
};

// Add UI section before memo list
<div className="mb-6">
  <h2 className="text-lg font-semibold text-white font-mono mb-4">
    Generate New Memo
  </h2>
  <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
    <select
      value={selectedFacilityId || ''}
      onChange={(e) => setSelectedFacilityId(e.target.value)}
      className="bg-[#1e293b] border border-[#334155] text-white rounded px-4 py-2 mb-4 w-full"
    >
      <option value="">Select a facility...</option>
      {canonicalFacilities.map(facility => (
        <option key={facility.id} value={facility.id}>
          {facility.name}
        </option>
      ))}
    </select>
    <Button
      onClick={handleGenerateMemo}
      disabled={!selectedFacilityId || isGenerating}
      className="w-full"
    >
      {isGenerating ? 'Generating...' : 'Generate Defense Memo'}
    </Button>
  </div>
</div>
```

#### **Step 4: Update Memo Loading** (30 min)

Update `loadMitigationEvents` to fetch from Supabase:

```typescript
const loadMitigationEvents = async () => {
  try {
    setIsLoading(true);
    
    // Try Supabase first
    const { data, error } = await supabase
      .from('liability_memos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      // Convert to MitigationEvent format
      const events: MitigationEvent[] = data.map(memo => ({
        id: memo.id,
        facilityId: memo.facility_id,
        userId: memo.user_id || 'unknown',
        type: 'defense-memo',
        actionTaken: `Defense memo generated with hash ${memo.hash.substring(0, 8)}...`,
        evidencePayload: {
          observations: memo.observations,
          hash: memo.hash,
          pdfStoragePath: null, // Will be added when PDF is generated
        },
        timestamp: new Date(memo.created_at),
      }));
      
      setMitigationEvents(events);
      return;
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem('mitigation_events') || '[]';
    const events = JSON.parse(stored).map((event: any) => ({
      ...event,
      timestamp: event.timestamp instanceof Date 
        ? event.timestamp 
        : new Date(event.timestamp),
    }));
    setMitigationEvents(events);
  } catch (error) {
    console.error('[LiabilityDefense] Error loading events:', error);
    // Fallback to localStorage
    const stored = localStorage.getItem('mitigation_events') || '[]';
    setMitigationEvents(JSON.parse(stored));
  } finally {
    setIsLoading(false);
  }
};
```

**Verification:**
- [ ] Can select facility from dropdown
- [ ] Can generate memo
- [ ] Memo saves to Supabase with hash
- [ ] Memo appears in history list
- [ ] Hash is displayed correctly

---

### **PRIORITY 2: Legal Safety Audit** (2 hours)

#### **Step 1: Add Disclaimers** (1 hour)

Add to **every operational page**:

**Create:** `src/components/LegalDisclaimer.tsx`

```typescript
export const LegalDisclaimer: React.FC = () => (
  <div className="mt-8 p-4 bg-[#0f172a] border border-[#334155] rounded-lg">
    <p className="text-xs text-[#64748b] font-mono leading-relaxed">
      <strong className="text-[#94a3b8]">Observational Intelligence:</strong>{' '}
      This view presents operational data for informational purposes only. 
      No recommendations are implied. All operational decisions remain with 
      authorized facility personnel.
    </p>
  </div>
);
```

**Add to pages:**
- `src/pages/RevenueIntegrity.tsx` (bottom of page)
- `src/pages/LiabilityDefense.tsx` (bottom of page)
- `src/pages/FacilityDrillDown.tsx` (bottom of page)
- `src/components/dashboard/AttentionBrief.tsx` (bottom of component)

#### **Step 2: Clean Up Comments** (30 min)

Search and replace in comments:
- "must be" → "is"
- "should" → "will"
- "need to" → "to"

#### **Step 3: Final Language Check** (30 min)

Run:
```bash
grep -rn "should\|must\|recommend\|need to\|have to" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "test"
```

Review each instance and replace if user-facing.

**Verification:**
- [ ] All pages have disclaimers
- [ ] Zero prescriptive language in UI text
- [ ] Comments cleaned up (optional)

---

### **PRIORITY 3: Revenue Integrity Polish** (3 hours)

#### **Step 1: Add Filtering/Sorting** (2 hours)

Add to `src/pages/RevenueIntegrity.tsx`:

```typescript
const [filter, setFilter] = useState<'all' | 'capturable' | 'stale'>('all');
const [sortBy, setSortBy] = useState<'revenue' | 'gap' | 'name'>('revenue');

// Update revenueFacilities useMemo
const filteredAndSorted = useMemo(() => {
  let filtered = revenueFacilities;
  
  // Apply filter
  if (filter === 'capturable') {
    filtered = filtered.filter(f => (f as any).captureGap > 0);
  } else if (filter === 'stale') {
    filtered = filtered.filter(f => isBillingSyncStale(f.id, f.syncTimestamp));
  }
  
  // Apply sort
  return [...filtered].sort((a, b) => {
    if (sortBy === 'revenue') {
      return (b.revenueDelta ?? 0) - (a.revenueDelta ?? 0);
    } else if (sortBy === 'gap') {
      return ((b as any).captureGap || 0) - ((a as any).captureGap || 0);
    } else {
      return a.name.localeCompare(b.name);
    }
  });
}, [revenueFacilities, filter, sortBy]);
```

Add UI controls before the list.

#### **Step 2: Add Export to CSV** (1 hour)

```typescript
const handleExportCSV = () => {
  const csv = [
    ['Facility', 'Revenue Opportunity', 'Capture Gap', 'Confidence', 'Last Sync'],
    ...revenueFacilities.map(f => [
      f.name,
      `$${f.revenueDelta.toLocaleString()}/day`,
      (f as any).captureGap || 0,
      f.confidence,
      formatDistanceToNow(f.syncTimestamp, { addSuffix: true }),
    ]),
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `revenue-integrity-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
```

**Verification:**
- [ ] Can filter by capturable/stale
- [ ] Can sort by revenue/gap/name
- [ ] Export button downloads CSV

---

### **PRIORITY 4: Chrome Extension Pipeline** (2 hours)

#### **Step 1: Test Extension** (30 min)
- Open PointClickCare
- Trigger capture
- Verify data appears

#### **Step 2: Add Retry Logic** (1 hour)

Update `extension/background.js` with retry logic (see user's plan above).

#### **Step 3: Verify Sync** (30 min)

Check Supabase for sync timestamps.

**Verification:**
- [ ] Extension syncs successfully
- [ ] Data appears in app
- [ ] Retry logic works

---

## 📊 ESTIMATED TIME

- **Priority 1:** 4 hours
- **Priority 2:** 2 hours
- **Priority 3:** 3 hours
- **Priority 4:** 2 hours

**Total: 11 hours (1.5 days of focused work)**

---

## ✅ WEEK 2 COMPLETION CRITERIA

- [ ] Liability memos save to database
- [ ] Memos have SHA-256 hashes
- [ ] All pages have disclaimers
- [ ] Zero prescriptive language
- [ ] Revenue page has filtering/sorting
- [ ] Revenue page exports CSV
- [ ] Chrome extension reliable

---

## 🚀 NEXT: WEEK 3

Once Week 2 is complete:
- UI/UX polish
- Mobile responsiveness
- Load testing
- Production deploy
- Monitor for 72 hours

**Estimated: 2-3 days**

---

**Total MVP Timeline: 7-8 days** 🎉

