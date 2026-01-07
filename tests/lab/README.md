# Scraper Reality Check - Lab Tests

This directory contains the mock PointClickCare staffing page and setup instructions for testing the TraceLayer SNF scraper extension.

## Files

- **`mock_pcc_staffing.html`** - Mock PointClickCare daily staffing page with realistic table structure
- **`EXTENSION_SETUP.md`** - Detailed step-by-step setup instructions
- **`QUICK_START.md`** - Quick 3-step reference guide

## What Was Changed

### 1. Mock EHR Page Created
- ✅ `tests/lab/mock_pcc_staffing.html` - Mimics PointClickCare's complex nested table structure
- Includes `#staffing_grid` table with RN, LPN, and CNA rows
- Contains "Scheduled" and "Actual" columns with realistic values
- Includes census count display

### 2. Extension Refactored
- ✅ `extension/manifest.json` - Added `file://*/*mock_pcc_staffing.html*` to content script matches
- ✅ `extension/content.ts` - Updated `isStaffingPage()` to recognize mock HTML files
- ✅ `extension/content.js` - Same updates applied to compiled JavaScript

### 3. Data Verification Added
- ✅ Console logging added: `console.log('[TraceLayer] ✅ Successfully scraped staffing data:')`
- ✅ JSON output: `console.log(JSON.stringify(data, null, 2))`
- ✅ Improved scraper logic to handle "RN Total" and "CNA Total" rows

## Quick Test

1. Load extension: `chrome://extensions/` → Load unpacked → Select `extension/` folder
2. Open mock page: `Cmd+O` → Select `mock_pcc_staffing.html`
3. View console: `F12` → Console tab → Look for `[TraceLayer] ✅` message

## Expected Scraped Data

```json
{
  "census": 142,
  "rn": {
    "scheduled": 24,
    "actual": 22
  },
  "cna": {
    "scheduled": 48,
    "actual": 44
  },
  "timestamp": "2025-01-06T...",
  "url": "file:///..."
}
```

## Notes

- Icon files referenced in `manifest.json` are optional - Chrome will use default icons if missing
- The extension works on both `file://` URLs (for testing) and `*.pointclickcare.com` (production)
- The scraper uses a fallback strategy: first tries to find "Total" rows, then sums individual rows if needed

