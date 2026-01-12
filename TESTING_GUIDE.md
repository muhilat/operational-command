# VRT3X Testing Guide - State-Based Refactor

## 🚀 Server Status
**URL**: http://localhost:8080

---

## ✅ Quick Test Checklist

### 1. **Calibration Handshake** (First Load)
- [ ] Open http://localhost:8080
- [ ] Complete the calibration form:
  - Facility Count: 4
  - Focus Area: Staffing
  - Objective: Weekly Scan
- [ ] Click "Begin Briefing"
- [ ] Should see Attention Brief with 4 facility cards

### 2. **State Observations** (New Feature)
- [ ] Look at each facility card in the Attention Brief
- [ ] Check for narrative "State Observations" (not just calculations)
- [ ] Example: "Census shows 40 residents but staffing roster shows 2 CNAs visible"
- [ ] Should NOT see "gap is not defined" errors

### 3. **Confidence Model** (New Feature)
- [ ] Navigate to "Revenue Integrity" page (sidebar)
- [ ] Look for confidence badges: "High Confidence", "Med Confidence", "Low Confidence"
- [ ] Low confidence should be Amber/Gold (#F59E0B)
- [ ] High confidence should be Green (#10B981)

### 4. **Passive Ingestion Guards** (New Feature)
- [ ] On Revenue Integrity page, check for "Waiting for System Sync" badge
- [ ] Should appear if Sucker extension hasn't sent data in >6 hours
- [ ] Different from "Sync Required" (which is for stale context data)

### 5. **Liability Defense Page** (State Observations)
- [ ] Click "Liability Defense" in sidebar
- [ ] If empty: Should show "Current State: Active Surveillance. No critical deviations observed in last sync."
- [ ] If events exist: Should show "Observed X ago" with relative time
- [ ] Each event should display UUID (Integrity Hash)

### 6. **Revenue Integrity Page** (Capture Opportunities)
- [ ] Click "Revenue Integrity" in sidebar
- [ ] If empty: Should show "No Capture Opportunities Identified"
- [ ] If facilities exist:
  - [ ] Should show "State Observation" section with narrative
  - [ ] Should show "Identified Opportunity" (not "Uncaptured Revenue")
  - [ ] Should show "Observed X ago" for freshness
  - [ ] Should show Capture Gap if acuity mismatch detected

### 7. **Time as a Signal** (Freshness)
- [ ] Check all pages for "Observed X ago" or "Last sync: X ago"
- [ ] Should NOT see "formatDistanceToNow is not defined" errors
- [ ] All timestamps should display relative time correctly

### 8. **Error Handling** (Defensive Guards)
- [ ] Try navigating between pages quickly
- [ ] Should NOT see blank screens or crashes
- [ ] Missing data should show "AMBER" state, not crash
- [ ] All pages should load without JavaScript errors

---

## 🎯 Key Features to Verify

### **State-Based Observations**
- ✅ Narrative observations instead of calculations
- ✅ "40 residents but only 2 CNAs visible" type messages
- ✅ No crashes on missing data

### **Confidence Model**
- ✅ High/Med/Low confidence badges
- ✅ Amber styling for Low confidence
- ✅ Based on data completeness

### **Passive Ingestion**
- ✅ "Waiting for System Sync" badge
- ✅ Shows when Sucker hasn't sent updates
- ✅ Different from stale data warnings

### **Empty States**
- ✅ Liability Defense: "Current State: Active Surveillance"
- ✅ Revenue Integrity: "No Capture Opportunities Identified"
- ✅ Helpful explanations, not just "No data"

---

## 🐛 Common Issues to Check

1. **Blank Page**: Check browser console for errors
2. **Missing Imports**: Verify `formatDistanceToNow` is imported everywhere
3. **Type Errors**: Check TypeScript compilation
4. **Styling Issues**: Verify Tailwind classes are applied

---

## 📝 Test Results Template

```
Date: __________
Tester: __________

Calibration Handshake: [ ] Pass [ ] Fail
State Observations: [ ] Pass [ ] Fail
Confidence Model: [ ] Pass [ ] Fail
Passive Ingestion Guards: [ ] Pass [ ] Fail
Liability Defense: [ ] Pass [ ] Fail
Revenue Integrity: [ ] Pass [ ] Fail
Time as Signal: [ ] Pass [ ] Fail
Error Handling: [ ] Pass [ ] Fail

Notes:
_________________________________
_________________________________
```

---

**Ready to test!** Open http://localhost:8080 and follow the checklist above.

