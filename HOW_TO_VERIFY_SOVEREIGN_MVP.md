# How to Verify the Sovereign MVP Refactor Worked

## Quick Start: Run the App

```bash
npm run dev
```

Open `http://localhost:8080` in your browser.

---

## ✅ 1. DATA INTEGRITY (SSoT) - Verification

### Test: Check that all views show the same data

**Step 1: Check Sidebar Sync Status**
- Look at the sidebar (left side)
- Find "Last Sync: X ago" text
- Note the time (e.g., "2 hours ago")

**Step 2: Check Attention Brief**
- Complete calibration handshake (if needed)
- Look at any facility card
- Check "Last sync: X ago" at bottom of card
- ✅ **PASS**: Should match sidebar time (or be close)

**Step 3: Check Facility Detail**
- Click on a facility card
- Look at header "Last sync: X ago"
- ✅ **PASS**: Should match sidebar time

**Step 4: Check Revenue Delta**
- In Attention Brief, note revenue delta (e.g., "$250/day")
- Go to Facility Detail → Node 3 (Profit)
- Check "Uncaptured Revenue"
- ✅ **PASS**: Should show same $250/day (standardized)

**If data differs between views → FAIL** (SSoT broken)

---

## ✅ 2. TECHNICAL RESILIENCE - Verification

### Test A: Error Boundary Works

**Step 1: Open Browser Console (F12)**
- Go to any page
- Look for errors

**Step 2: Simulate Error (Optional)**
- In console, type: `throw new Error("Test error")`
- ✅ **PASS**: Should see "Attention Degraded" page with amber styling
- ✅ **PASS**: Should NOT see blank white screen

### Test B: Defensive Guards Work

**Step 1: Check Facility with Missing Data**
- Look for facilities with "Attention Degraded" badge
- ✅ **PASS**: Should show amber badge, not crash

**Step 2: Check Calculations**
- Open any facility detail page
- Look at Node 1 (Staffing) - should show gaps even if data is partial
- ✅ **PASS**: Should show "0h" or actual gap, never "undefined" or "NaN"

**Step 3: Check Missing Metrics**
- If a facility has no staffing data, it should show:
  - Status: AMBER
  - Label: "Attention Degraded"
  - Subtext: "Sync Required"
- ✅ **PASS**: Should show amber state, not crash

---

## ✅ 3. LEGAL SAFE-HARBOR - Verification

### Test: No Prescriptive Language

**Step 1: Search for Bad Words**
- Open browser console (F12)
- Type: `document.body.innerText.includes('Recommend')`
- ✅ **PASS**: Should return `false` (no recommendations)

**Step 2: Check Facility Cards**
- Look at any facility card in Attention Brief
- Read the "System Observation" text
- ✅ **PASS**: Should start with "Observation:" not "Recommend:"
- ✅ **PASS**: Should NOT contain words like "Schedule", "Should", "Must"

**Step 3: Check Facility Detail**
- Go to any facility detail page
- Read all text in Node 1, Node 2, Node 3
- ✅ **PASS**: All should use "Observation:" language
- ✅ **PASS**: No numeric scores like "85/100" - only "Low", "Elevated", "Critical"

**Step 4: Check PDF (if generated)**
- Generate a defense memo
- Open the PDF
- Search for "Recommend" or "Schedule"
- ✅ **PASS**: Should find 0 results

---

## ✅ 4. INSTITUTIONAL NAVIGATION - Verification

### Test A: Settings Page Works

**Step 1: Navigate to Settings**
- Click "Settings" in sidebar
- ✅ **PASS**: Should open Settings page (not 404)

**Step 2: Update Facility Count**
- Change "Facility Oversight Count" to 5
- Click "Save Settings"
- ✅ **PASS**: Should show toast "Settings Saved"
- ✅ **PASS**: Should redirect to Dashboard
- ✅ **PASS**: Attention Brief should show exactly 5 facilities (not 15)

**Step 3: Update Focus Area**
- Go back to Settings
- Change Focus to "Billing"
- Save
- Go to Dashboard
- ✅ **PASS**: Only facilities with billing/acuity signals should appear

**Step 4: Check Sidebar Navigation**
- Click "Liability Defense" in sidebar
- ✅ **PASS**: Should open Compliance Vault page
- Click "Revenue Integrity" in sidebar
- ✅ **PASS**: Should open Revenue Opportunities page

### Test B: Visual Clarity (No Blur)

**Step 1: Check for Blur**
- Open any page
- Inspect elements (right-click → Inspect)
- Search for CSS: `backdrop-blur`, `blur-sm`, `filter: blur`
- ✅ **PASS**: Should find 0 results

**Step 2: Check Solid Fills**
- Inspect background colors
- ✅ **PASS**: Should be solid `#0f172a` or `#020617`, not transparent

**Step 3: Check Causal Hierarchy**
- Go to Settings, set Focus to "Staffing"
- Save and go to Dashboard
- Click on a facility with staffing signals
- Look at Node 1 (Staffing) vs Node 3 (Revenue)
- ✅ **PASS**: Node 1 should have high contrast (white text, cyan border)
- ✅ **PASS**: Node 3 should be dimmed (Slate-500 text, muted border)

---

## ✅ 5. THE SHIELD (PDF Generation) - Verification

### Test: Generate Defense Memo

**Step 1: Navigate to Facility Detail**
- Click any facility card
- Scroll to Node 2: Defense (The Shield)

**Step 2: Generate Memo**
- Click "VRT3X Defense Protocol" button
- Enter action taken (e.g., "Contacted agency for RN coverage")
- Click "Generate Memo"
- ✅ **PASS**: Should show toast "Defense Memo Generated"
- ✅ **PASS**: PDF should download automatically

**Step 3: Verify PDF Content**
- Open downloaded PDF
- Check footer on every page:
  ```
  VRT3X INTEGRITY VERIFICATION
  Verification ID: [UUID]
  Timestamp: [ISO timestamp]
  Status: Verified Sovereign Audit Trail Entry
  ```
- ✅ **PASS**: Footer should be in monospaced font (Courier)
- ✅ **PASS**: UUID should be present (long string)
- ✅ **PASS**: Timestamp should be ISO format (e.g., "2026-01-08T13:07:30Z")

**Step 4: Verify PDF Language**
- Read PDF content
- ✅ **PASS**: Should use "Observation:" language
- ✅ **PASS**: Should NOT contain "Recommend", "Schedule", "Should", "Must"

**Step 5: Check Browser Console**
- Open console (F12)
- Look for:
  - `[Supabase] Created mitigation event:`
  - `[generateMemo] Uploaded file to storage:`
- ✅ **PASS**: Should see both messages

**Step 6: Check localStorage (Development)**
- Open DevTools → Application → Local Storage
- Check `mitigation_events` key
- ✅ **PASS**: Should contain your mitigation event with UUID
- Check `storage_uploads` key
- ✅ **PASS**: Should contain PDF metadata

---

## 🚨 Common Issues & Solutions

### Issue: "Last Sync" times don't match
**Solution**: Check that all views use `useBriefingContext()`. If not, SSoT is broken.

### Issue: Settings page shows 404
**Solution**: Check `src/App.tsx` has `/settings` route added.

### Issue: PDF doesn't download
**Solution**: Check browser console for errors. Verify `formatDistanceToNow` is imported.

### Issue: Still seeing "Recommend" text
**Solution**: Hard refresh (Cmd+Shift+R) and check that `facilityData.ts` has no recommendation fields.

### Issue: App crashes with "ReferenceError: gap is not defined"
**Solution**: Defensive guards not working. Check `BriefingContext.tsx` uses safe-access patterns.

### Issue: Settings don't filter Brief
**Solution**: Check `AttentionBrief.tsx` reads from sessionStorage and filters by `facilityCount`.

---

## 📋 Quick Verification Checklist

Run through this checklist to verify everything:

- [ ] Sidebar "Last Sync" matches facility card "Last Sync"
- [ ] Revenue delta is consistent ($250/day standardized)
- [ ] Error boundary shows "Attention Degraded" (not blank screen)
- [ ] No "Recommend", "Schedule", "Should", "Must" in UI text
- [ ] Only qualitative labels (Low/Elevated/Critical), no numeric scores
- [ ] Settings page opens and saves
- [ ] Facility count in Settings filters Brief correctly
- [ ] Sidebar navigation works (Liability Defense, Revenue Integrity)
- [ ] No CSS blur in styles
- [ ] Focus = Staffing makes Node 1 high contrast, Node 3 dimmed
- [ ] PDF generates with UUID footer
- [ ] PDF uses "Observation:" language only
- [ ] No console errors during normal use

---

## ✅ Success Criteria

**If all checks pass:**
- ✅ Sovereign MVP is working correctly
- ✅ System is stable, data-consistent, and legally safe
- ✅ Ready for production testing

**If any check fails:**
- ❌ Review the specific section above
- ❌ Check browser console for errors
- ❌ Verify files were saved correctly
- ❌ Hard refresh (Cmd+Shift+R) to clear cache

---

## 🎯 Expected Behavior Summary

1. **Data Consistency**: All views show same sync time and revenue delta
2. **Error Handling**: Errors show amber "Attention Degraded" page, not crashes
3. **Legal Safety**: Only "Observation:" language, no prescriptive text
4. **Navigation**: Settings page works, sidebar links work
5. **PDF Generation**: PDFs have UUID footer and observation-only language

**If all 5 work → Sovereign MVP is successful! 🎉**




