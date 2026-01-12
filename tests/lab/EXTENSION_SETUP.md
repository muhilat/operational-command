# Scraper Reality Check - Extension Setup Guide

This guide walks you through loading the TraceLayer SNF extension as an "Unpacked Extension" in Chrome and testing it with the mock PointClickCare staffing page.

## Prerequisites

- Google Chrome browser
- The `extension/` directory with all extension files
- The mock HTML file: `tests/lab/mock_pcc_staffing.html`

## Step-by-Step Instructions

### Step 1: Load the Extension as Unpacked

1. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or: Click the three-dot menu (⋮) → **Extensions** → **Manage extensions**

2. **Enable Developer Mode**
   - Toggle the **"Developer mode"** switch in the top-right corner of the extensions page
   - This enables the ability to load unpacked extensions

3. **Load the Extension**
   - Click the **"Load unpacked"** button (appears after enabling Developer Mode)
   - Navigate to your project directory: `/Users/muhilthendral/operational-command/extension`
   - Select the `extension` folder and click **"Select Folder"** (or **"Open"** on Mac)

4. **Verify Extension is Loaded**
   - You should see "TraceLayer SNF - The Sucker" in your extensions list
   - The extension icon should appear in your Chrome toolbar
   - Status should show as "Enabled"

### Step 2: Open the Mock HTML File

1. **Open the Mock Page**
   - In Chrome, press `Cmd+O` (Mac) or `Ctrl+O` (Windows/Linux) to open a file
   - Navigate to: `/Users/muhilthendral/operational-command/tests/lab/mock_pcc_staffing.html`
   - Click **"Open"**

   **Alternative Method:**
   - Right-click on `mock_pcc_staffing.html` in your file explorer
   - Select **"Open with"** → **Google Chrome**

2. **Verify the Page Loaded**
   - You should see a styled table with:
     - Header: "PointClickCare - Daily Staffing Report"
     - Census display: "Current Census: 142 residents"
     - Staffing grid table with RN, LPN, and CNA rows
     - Total rows showing scheduled vs actual hours

### Step 3: View the Data Capture in Action

1. **Open Developer Console**
   - Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)
   - Or: Right-click on the page → **"Inspect"** → Click the **"Console"** tab

2. **Look for TraceLayer Logs**
   - You should see console messages starting with `[TraceLayer]`
   - Look for:
     ```
     [TraceLayer] Initializing content script on: file:///...
     [TraceLayer] MutationObserver initialized
     [TraceLayer] ✅ Successfully scraped staffing data:
     ```

3. **View the Scraped JSON Data**
   - Scroll in the console to find the JSON output
   - It should look like:
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

4. **Verify Data Accuracy**
   - Check that `rn.scheduled` = 24.0 (from "RN Total" row)
   - Check that `rn.actual` = 22.0
   - Check that `cna.scheduled` = 48.0 (from "CNA Total" row)
   - Check that `cna.actual` = 44.0
   - Check that `census` = 142

## Troubleshooting

### Extension Not Loading
- **Error: "Manifest file is missing or unreadable"**
  - Make sure you selected the `extension/` folder (not a parent folder)
  - Verify `manifest.json` exists in the extension folder

- **Error: "Could not load extension"**
  - Check the console for specific errors
  - Verify all required files are present: `manifest.json`, `content.js`, `background.js`

### Content Script Not Running
- **No `[TraceLayer]` logs in console**
  - Check that the extension is enabled (toggle should be ON)
  - Refresh the mock HTML page (F5)
  - Check the extension's "Errors" section in `chrome://extensions/`

- **"Staffing grid not found" message**
  - Verify the HTML file has `id="staffing_grid"` on the table
  - Check that the file path matches the manifest pattern

### Data Not Scraping Correctly
- **Values are 0 or incorrect**
  - Open the console and look for detailed error messages
  - Check that the table structure matches the expected format
  - Verify "RN Total" and "CNA Total" rows exist in the table

## Expected Console Output

When everything works correctly, you should see:

```
[TraceLayer] Initializing content script on: file:///Users/muhilthendral/operational-command/tests/lab/mock_pcc_staffing.html
[TraceLayer] MutationObserver initialized
[TraceLayer] ✅ Successfully scraped staffing data:
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
  "timestamp": "2025-01-06T12:34:56.789Z",
  "url": "file:///Users/muhilthendral/operational-command/tests/lab/mock_pcc_staffing.html"
}
[TraceLayer] Stored staffing data: {census: 142, rn: {...}, cna: {...}, ...}
```

## Next Steps

Once the scraper is verified to work with the mock page:
1. Test with a real PointClickCare staffing page (if you have access)
2. Verify data is being stored in `chrome.storage.local`
3. Check the extension popup to see captured data
4. Integrate with the backend API to sync captured data

## Extension Files Checklist

Make sure these files exist in the `extension/` directory:
- ✅ `manifest.json` - Extension configuration
- ✅ `content.js` - Content script (compiled from content.ts)
- ✅ `background.js` - Service worker
- ✅ `popup.html` - Extension popup UI
- ✅ `popup.js` - Popup logic




