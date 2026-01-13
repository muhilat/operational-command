# VRT3X Extension Testing Guide

## Quick Start

### 1. Load Extension
1. Open Chrome: `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/` folder

### 2. Test on PointClickCare
1. Navigate to a PointClickCare staffing page
2. Extension will auto-capture after 3 seconds
3. Check browser console for logs:
   - `🎯 VRT3X: Data capture initialized`
   - `🔄 VRT3X: Starting data capture...`
   - `✅ VRT3X: Data extracted`

### 3. Check Popup
1. Click extension icon
2. Should show:
   - Status (last sync time)
   - "Capture Data Now" button
   - "Retry Failed Captures" button

### 4. Verify API Integration
1. Check browser console for:
   - `✅ API sync successful`
2. Check Supabase:
   - `facility_metrics` table should have new record
   - `facilities` table should have updated `last_sync`

## Testing Scenarios

### Scenario 1: Successful Capture
- ✅ Extension captures data
- ✅ Badge shows ✓ (green)
- ✅ Data appears in Supabase
- ✅ Popup shows "Last sync: X min ago"

### Scenario 2: Network Error
- ✅ Extension stores failed capture
- ✅ Badge shows ✗ (red)
- ✅ Failed capture retries every hour
- ✅ Popup shows failed captures count

### Scenario 3: Missing Data
- ✅ Extension logs error
- ✅ Badge shows ✗ (red)
- ✅ Error stored for retry

## Debugging

### Check Console Logs
- Content script: Look for `[VRT3X]` or `[TraceLayer]` logs
- Background script: Check service worker console
- API: Check Vercel function logs

### Check Storage
```javascript
// In extension popup console
chrome.storage.local.get(null, console.log);
```

### Check Failed Captures
```javascript
chrome.storage.local.get('failed_captures', console.log);
```

## Common Issues

### Extension Not Capturing
- Check if on correct page (PointClickCare staffing)
- Check console for errors
- Verify manifest permissions

### API Returns 401
- Check API key in background.js matches Vercel
- Verify X-API-Key header is sent

### Data Not Appearing in Supabase
- Check facility_id is correct
- Verify facility exists in facilities table
- Check Supabase logs for errors

