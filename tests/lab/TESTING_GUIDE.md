# Step-by-Step Testing Guide for TraceLayer SNF Extension

Follow these steps in order to test the extension with the mock PointClickCare staffing page.

## Prerequisites Checklist

Before starting, make sure you have:
- ✅ Google Chrome browser installed
- ✅ The extension folder at `/Users/muhilthendral/operational-command/extension`
- ✅ The mock HTML file at `/Users/muhilthendral/operational-command/tests/lab/mock_pcc_staffing.html`
- ✅ Python 3 installed (for local server)

---

## Step 1: Load the Extension in Chrome

### 1.1 Open Chrome Extensions Page
1. Open Google Chrome
2. In the address bar, type: `chrome://extensions/`
3. Press Enter

### 1.2 Enable Developer Mode
1. Look at the **top-right corner** of the page
2. Find the toggle switch labeled **"Developer mode"**
3. **Click the toggle** to turn it ON (it should turn blue/active)
4. You should now see three new buttons appear: "Load unpacked", "Pack extension", "Update"

### 1.3 Load the Extension
1. Click the **"Load unpacked"** button (leftmost of the three buttons)
2. A file/folder picker window will open

### 1.4 Navigate to Extension Folder
1. In the file picker, you need to go to:
   ```
   /Users/muhilthendral/operational-command/extension
   ```

2. **On Mac, you can:**
   - Press `Cmd+Shift+G` to open "Go to Folder"
   - Type: `/Users/muhilthendral/operational-command/extension`
   - Press Enter
   - **Important:** Select the `extension` **folder** (not a file inside it)
   - Click "Open" or "Select"

3. **Or navigate manually:**
   - Click "Users" in the sidebar
   - Click "muhilthendral"
   - Click "operational-command"
   - Click "extension" folder
   - Click "Open"

### 1.5 Verify Extension Loaded
After selecting the folder, you should see:
- ✅ "TraceLayer SNF - The Sucker" appears in your extensions list
- ✅ Status shows "Enabled" (with a toggle switch)
- ✅ Version shows "1.0.0"
- ✅ No "Errors" button (or if there is one, click it to verify no errors)

**If you see errors:** Click the "Errors" button and let me know what it says.

---

## Step 2: Start the Local HTTP Server

Chrome extensions can't run on `file://` URLs, so we need a local server.

### 2.1 Open Terminal
1. Press `Cmd+Space` (Mac) to open Spotlight
2. Type "Terminal" and press Enter
3. Or find Terminal in Applications → Utilities

### 2.2 Navigate to the Lab Directory
In Terminal, type these commands one by one:

```bash
cd /Users/muhilthendral/operational-command/tests/lab
```

Press Enter after each command.

### 2.3 Start the HTTP Server
Type this command:

```bash
python3 -m http.server 8000
```

Press Enter.

You should see:
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

**Keep this Terminal window open!** The server needs to keep running.

---

## Step 3: Open the Mock HTML Page

### 3.1 Open in Chrome
1. In Chrome, click the address bar (or press `Cmd+L`)
2. Type: `http://localhost:8000/mock_pcc_staffing.html`
3. Press Enter

### 3.2 Verify Page Loaded
You should see:
- ✅ A page titled "PointClickCare - Daily Staffing Report"
- ✅ Header showing "Facility: Oakhaven Manor"
- ✅ A section showing "Current Census: 142 residents"
- ✅ A table with columns: Role, Employee Name, Scheduled Hours, Actual Hours, Variance, Status
- ✅ Rows for RN (Registered Nurse), LPN, and CNA
- ✅ Total rows showing: RN Total (24.0 scheduled, 22.0 actual), CNA Total (48.0 scheduled, 44.0 actual)

---

## Step 4: Open Developer Console

### 4.1 Open Console
Press one of these keyboard shortcuts:
- **Mac:** `Cmd+Option+I` (or `F12`)
- **Windows/Linux:** `Ctrl+Shift+I` (or `F12`)

### 4.2 Switch to Console Tab
1. At the top of the Developer Tools window, you'll see tabs: "Elements", "Console", "Sources", etc.
2. Click the **"Console"** tab

---

## Step 5: Check for TraceLayer Messages

### 5.1 Look for Initialization Messages
In the Console, you should see messages like:

```
[TraceLayer] Initializing content script on: http://localhost:8000/mock_pcc_staffing.html
[TraceLayer] MutationObserver initialized
```

### 5.2 Look for Scraped Data
After a moment, you should see:

```
[TraceLayer] ✅ Successfully scraped staffing data:
```

Followed by a JSON object that looks like:

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
  "url": "http://localhost:8000/mock_pcc_staffing.html"
}
```

### 5.3 Verify the Data is Correct
Check that:
- ✅ `census` = 142 (matches the page)
- ✅ `rn.scheduled` = 24 (from "RN Total" row)
- ✅ `rn.actual` = 22 (from "RN Total" row)
- ✅ `cna.scheduled` = 48 (from "CNA Total" row)
- ✅ `cna.actual` = 44 (from "CNA Total" row)

### 5.4 Look for Storage Message
You should also see:

```
[TraceLayer] Stored staffing data: {census: 142, rn: {...}, cna: {...}, ...}
```

---

## Step 6: Verify Data is Stored

### 6.1 Check Extension Storage
1. Go back to `chrome://extensions/`
2. Find "TraceLayer SNF - The Sucker"
3. Click **"Service worker"** (or "Inspect views: Service worker")
4. This opens the background script console
5. In that console, type:

```javascript
chrome.storage.local.get(null, (data) => console.log(data))
```

6. Press Enter
7. You should see an object with keys like `staffing_1234567890` and `latest_staffing`

---

## Troubleshooting

### Extension Not Loading
- **Error: "Manifest file is missing"**
  - Make sure you selected the `extension` **folder**, not a file inside it
  - Verify `manifest.json` exists in that folder

- **Error: "Could not load icon"**
  - The icons should be there, but if not, the extension should still work
  - Check that `extension/icons/` folder exists

### Server Not Starting
- **"python3: command not found"**
  - Try: `python -m http.server 8000`
  - Or install Python 3

- **"Port 8000 already in use"**
  - Use a different port: `python3 -m http.server 8001`
  - Then open: `http://localhost:8001/mock_pcc_staffing.html`

### No Console Messages
- **Extension not running:**
  1. Go to `chrome://extensions/`
  2. Make sure the extension is **Enabled** (toggle is ON)
  3. Click the refresh icon on the extension card

- **Page not matching:**
  - Make sure you're opening `http://localhost:8000/mock_pcc_staffing.html`
  - Not `file:///...` (file:// URLs won't work)

- **Content script not injected:**
  - Refresh the page (F5)
  - Check the Console for any error messages

### Wrong Data Scraped
- **Values are 0:**
  - Check the Console for error messages
  - Verify the table has `id="staffing_grid"`
  - Make sure "RN Total" and "CNA Total" rows exist

- **Missing data:**
  - The scraper looks for "RN Total" and "CNA Total" rows
  - If those don't exist, it tries to sum individual rows
  - Check the Console for parsing messages

---

## Success Indicators

✅ **Extension loads without errors**  
✅ **Mock HTML page displays correctly**  
✅ **Console shows `[TraceLayer]` messages**  
✅ **JSON data matches the table values**  
✅ **Data is stored in chrome.storage.local**

If you see all of these, the extension is working correctly! 🎉

---

## Next Steps

Once testing is complete:
1. Stop the server: In Terminal, press `Ctrl+C`
2. The extension will work on real PointClickCare pages when you have access
3. You can modify the mock HTML to test different scenarios




