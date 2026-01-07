# Detailed Steps: Loading the Extension in Chrome

## You're on `chrome://extensions/` - Here's what to do next:

### Step 1: Enable Developer Mode

1. **Look at the top-right corner** of the Chrome Extensions page
2. You should see a toggle switch labeled **"Developer mode"**
3. **Click the toggle** to turn it ON (it should turn blue/active)
4. After enabling, you'll see three new buttons appear:
   - "Load unpacked"
   - "Pack extension"
   - "Update"

### Step 2: Click "Load unpacked"

1. **Click the "Load unpacked" button** (it's usually the leftmost of the three new buttons)
2. A file/folder picker dialog will open

### Step 3: Navigate to the Extension Folder

1. In the file picker, you need to navigate to:
   ```
   /Users/muhilthendral/operational-command/extension
   ```

2. **How to navigate:**
   - If you're on Mac:
     - Press `Cmd+Shift+G` (or click "Go" → "Go to Folder" in Finder)
     - Type: `/Users/muhilthendral/operational-command/extension`
     - Press Enter
   - Or use the sidebar:
     - Click "Users" → "muhilthendral" → "operational-command" → "extension"

3. **Important:** Select the `extension` **folder** (not a file inside it)
   - You should see these files inside: `manifest.json`, `content.js`, `background.js`, etc.
   - Make sure you're selecting the folder itself, not opening it

4. **Click "Select"** (or "Open" on Mac)

### Step 4: Verify Extension Loaded

After selecting the folder, you should see:

1. **"TraceLayer SNF - The Sucker"** appear in your extensions list
2. The extension should show:
   - ✅ Status: "Enabled" (with a toggle switch)
   - 📦 Version: "1.0.0"
   - 📝 Description: "Automated data capture for PointClickCare staffing grids..."
   - 🔧 An "Errors" button (if there are any issues)

3. **Check for errors:**
   - If you see an "Errors" button, click it to see what's wrong
   - If there are no errors, you're good to go!

### Step 5: Test the Extension

Now let's test it with the mock HTML file:

1. **Open the mock HTML file:**
   - In Chrome, press `Cmd+O` (Mac) or `Ctrl+O` (Windows)
   - Navigate to: `/Users/muhilthendral/operational-command/tests/lab/mock_pcc_staffing.html`
   - Click "Open"

2. **Open Developer Console:**
   - Press `F12` OR `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Click the **"Console"** tab at the top

3. **Look for TraceLayer messages:**
   - You should see messages starting with `[TraceLayer]`
   - Look for: `[TraceLayer] ✅ Successfully scraped staffing data:`
   - Below that, you'll see a JSON object with the scraped data

## Troubleshooting

### "Could not load manifest" error
- Make sure you selected the `extension` **folder**, not a file
- Verify `manifest.json` exists in that folder

### "Could not load icon" error
- The icons should already be created, but if you see this:
  - Check that `extension/icons/` folder exists
  - Verify `icon16.png`, `icon48.png`, `icon128.png` are there

### Extension doesn't appear
- Refresh the `chrome://extensions/` page (F5)
- Make sure Developer Mode is still enabled
- Try clicking "Load unpacked" again

### No console messages when opening mock HTML
- Make sure the extension is **enabled** (toggle should be ON)
- Refresh the HTML page (F5)
- Check the extension's "Errors" section

## Visual Guide

```
chrome://extensions/ page layout:

┌─────────────────────────────────────────────────┐
│  Extensions                    [Developer mode] │ ← Toggle this ON
│                                                 │
│  [Load unpacked] [Pack extension] [Update]      │ ← Click "Load unpacked"
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ TraceLayer SNF - The Sucker               │ │ ← Should appear here
│  │ Version 1.0.0                             │ │
│  │ [Enabled] toggle                          │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## What You Should See in Console

When you open the mock HTML file and check the console, you should see:

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
  "timestamp": "2025-01-06T...",
  "url": "file:///..."
}
[TraceLayer] Stored staffing data: {...}
```

If you see this, the extension is working correctly! 🎉

