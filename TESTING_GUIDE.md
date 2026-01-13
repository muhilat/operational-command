# VRT3X Extension Testing Guide

## 🚀 Quick Start Testing

### Step 1: Load the Extension

1. **Open Chrome Extensions Page**
   ```
   chrome://extensions
   ```

2. **Enable Developer Mode**
   - Toggle switch in top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to: `~/operational-command/extension/`
   - Select the folder and click "Select"

4. **Verify Extension Loaded**
   - You should see "VRT3X Data Capture" in the extensions list
   - Version should be 2.0.0

---

### Step 2: Test on PointClickCare (or Mock Page)

#### Option A: Real PointClickCare Page
1. Navigate to a PointClickCare staffing page
2. Extension will auto-capture after 3 seconds
3. Check browser console (F12) for logs

#### Option B: Mock Test Page (Recommended for Testing)

Create a test HTML file:

```bash
cd ~/operational-command
cat > extension/test-page.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Test Facility - Staffing</title>
</head>
<body>
  <h1 class="facility-name">Oakhaven Manor</h1>
  <div class="census-count">45</div>
  
  <table id="staffing_grid">
    <tr>
      <th>Role</th>
      <th>Scheduled</th>
      <th>Actual</th>
    </tr>
    <tr>
      <td>RN Total</td>
      <td>6</td>
      <td>4</td>
    </tr>
    <tr>
      <td>CNA Total</td>
      <td>12</td>
      <td>10</td>
    </tr>
  </table>
</body>
</html>
EOF
```

Then:
1. Open `extension/test-page.html` in Chrome
2. Extension should capture data automatically

---

### Step 3: Check Console Logs

Open Chrome DevTools (F12) and check the **Console** tab:

**Expected Logs:**
```
🎯 VRT3X: Data capture initialized
🔄 VRT3X: Starting data capture...
✅ VRT3X: Data extracted: {facilityName: "...", census: ..., staffing: {...}}
```

**Background Script Logs:**
1. Click extension icon → "Inspect popup" (if available)
2. Or go to `chrome://extensions` → Click "service worker" link under VRT3X
3. Look for:
   ```
   📨 VRT3X Background: Received message FACILITY_DATA_CAPTURED
   🔄 Processing captured data...
   ✅ API sync successful
   ```

---

### Step 4: Check Extension Popup

1. **Click Extension Icon** (top-right of Chrome)
2. **Verify Status:**
   - Should show "Last sync: X min ago" (if successful)
   - Or "No sync yet" (if first time)
   - Badge should show ✓ (green) on success

3. **Test Manual Capture:**
   - Click "Capture Data Now" button
   - Should trigger capture immediately

4. **Test Retry:**
   - Click "Retry Failed Captures" button
   - Should retry any failed captures

---

### Step 5: Verify Data in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to your Supabase project
   - Go to Table Editor

2. **Check `facility_metrics` Table:**
   ```sql
   SELECT * FROM facility_metrics 
   ORDER BY sync_timestamp DESC 
   LIMIT 5;
   ```
   - Should see new record with captured data
   - Check `census`, `rn_scheduled_hours`, `rn_actual_hours`, etc.

3. **Check `facilities` Table:**
   ```sql
   SELECT id, name, last_sync, critical_state, critical_reason 
   FROM facilities 
   ORDER BY last_sync DESC 
   LIMIT 5;
   ```
   - `last_sync` should be updated
   - `critical_state` should be `true` if gap > 2 hours

---

## 🧪 Testing Scenarios

### Scenario 1: Successful Capture ✅

**Steps:**
1. Load extension
2. Navigate to test page or PointClickCare
3. Wait 3 seconds

**Expected Results:**
- ✅ Console shows capture logs
- ✅ Badge shows ✓ (green)
- ✅ Popup shows "Last sync: 0 min ago"
- ✅ Data appears in Supabase

---

### Scenario 2: Network Error (Offline) ❌

**Steps:**
1. Disconnect internet
2. Trigger capture (manual or auto)
3. Reconnect internet

**Expected Results:**
- ✅ Badge shows ✗ (red)
- ✅ Failed capture stored locally
- ✅ Popup shows failed captures count
- ✅ After reconnecting, retry should happen automatically (within 1 hour)
- ✅ Or click "Retry Failed Captures" to retry immediately

**Check Failed Captures:**
```javascript
// In browser console
chrome.storage.local.get('failed_captures', console.log);
```

---

### Scenario 3: Missing Data ⚠️

**Steps:**
1. Create test page with missing facility name
2. Extension should still attempt capture

**Expected Results:**
- ✅ Console shows error: "Could not extract facility name"
- ✅ Badge shows ✗ (red)
- ✅ Error logged

---

### Scenario 4: API Authentication Error 🔒

**Steps:**
1. Change API key in `extension/background.js` to wrong value
2. Trigger capture

**Expected Results:**
- ✅ API returns 401 error
- ✅ Badge shows ✗ (red)
- ✅ Failed capture stored for retry
- ✅ Console shows: "API returned 401: Unauthorized"

---

## 🔍 Debugging Commands

### Check Extension Storage

```javascript
// In browser console (on any page)
chrome.storage.local.get(null, (items) => {
  console.log('All storage:', items);
  console.log('Failed captures:', items.failed_captures);
  console.log('Last sync:', new Date(items.last_sync_timestamp));
});
```

### Check Failed Captures

```javascript
chrome.storage.local.get('failed_captures', (result) => {
  console.log('Failed captures:', result.failed_captures);
  console.log('Count:', result.failed_captures?.length || 0);
});
```

### Check Local Backups

```javascript
chrome.storage.local.get('captures', (result) => {
  console.log('Backup captures:', result.captures);
  console.log('Latest:', result.captures?.[result.captures.length - 1]);
});
```

### Manually Trigger Capture

```javascript
// In content script console (on PointClickCare page)
chrome.runtime.sendMessage({ type: 'CAPTURE_NOW' });
```

---

## 🐛 Common Issues & Solutions

### Issue: Extension Not Capturing

**Check:**
1. Is extension loaded? (`chrome://extensions`)
2. Is it enabled? (Toggle should be ON)
3. Are you on correct page? (PointClickCare or test page)
4. Check console for errors

**Solution:**
- Reload extension: Click refresh icon in `chrome://extensions`
- Check manifest permissions

---

### Issue: API Returns 401

**Check:**
1. API key in `extension/background.js` matches `VRT3X_API_KEY` in Vercel
2. Vercel environment variables are set

**Solution:**
```javascript
// Update in extension/background.js
const CONFIG = {
  apiKey: 'your-actual-api-key-here', // Match Vercel
  // ...
};
```

---

### Issue: Data Not Appearing in Supabase

**Check:**
1. Facility ID is correct
2. Facility exists in `facilities` table
3. Supabase service role key is correct in Vercel

**Solution:**
```sql
-- Check if facility exists
SELECT * FROM facilities WHERE name ILIKE '%Oakhaven%';

-- If not, create test facility
INSERT INTO facilities (id, name) 
VALUES (gen_random_uuid(), 'Oakhaven Manor');
```

---

### Issue: Badge Not Updating

**Check:**
1. Extension has permission to set badge
2. Check service worker console for errors

**Solution:**
- Reload extension
- Check `chrome.action` API is available

---

## 📊 Testing Checklist

- [ ] Extension loads without errors
- [ ] Content script initializes on PointClickCare page
- [ ] Auto-capture triggers after 3 seconds
- [ ] Data extraction works (facility name, census, staffing)
- [ ] Background script receives message
- [ ] Data validation passes
- [ ] API request sent with correct headers
- [ ] API returns success (200)
- [ ] Data appears in Supabase `facility_metrics`
- [ ] `facilities.last_sync` updated
- [ ] Badge shows ✓ (green)
- [ ] Popup shows correct status
- [ ] Manual capture button works
- [ ] Retry button works
- [ ] Failed captures stored on error
- [ ] Retry works after network reconnection
- [ ] Critical state flag set if gap > 2 hours

---

## 🎯 Quick Test Script

Run this in browser console on PointClickCare page:

```javascript
// Test 1: Check extension loaded
console.log('Extension loaded:', !!chrome.runtime);

// Test 2: Check storage
chrome.storage.local.get(null, console.log);

// Test 3: Trigger manual capture
chrome.runtime.sendMessage({ type: 'CAPTURE_NOW' }, (response) => {
  console.log('Capture response:', response);
});

// Test 4: Check failed captures
chrome.storage.local.get('failed_captures', (result) => {
  console.log('Failed captures:', result.failed_captures?.length || 0);
});
```

---

## 🚀 Next Steps After Testing

1. **Verify API Endpoint:**
   ```bash
   curl -X POST https://operational-command.vercel.app/api/ingest \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-api-key" \
     -d '{
       "facilityName": "Test Facility",
       "census": 45,
       "rn": {"scheduled": 6, "actual": 4},
       "cna": {"scheduled": 12, "actual": 10},
       "timestamp": "2024-01-15T10:30:00Z",
       "url": "https://test.com"
     }'
   ```

2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Functions
   - Check `/api/ingest` function logs

3. **Monitor Supabase:**
   - Check `facility_metrics` table for new records
   - Verify `facilities` table updates

---

## ✅ Success Criteria

Your extension is working correctly if:

1. ✅ Extension loads without errors
2. ✅ Captures data automatically on PointClickCare pages
3. ✅ Shows ✓ badge on success
4. ✅ Data appears in Supabase within 5 seconds
5. ✅ Popup shows correct status
6. ✅ Failed captures retry automatically

---

**Need Help?** Check console logs and Supabase for detailed error messages!
