# Quick Start: Scraper Reality Check

## 3-Step Setup

### Step 1: Load Extension in Chrome
1. Open Chrome → `chrome://extensions/`
2. Enable **"Developer mode"** (top-right toggle)
3. Click **"Load unpacked"**
4. Select folder: `/Users/muhilthendral/operational-command/extension`

### Step 2: Open Mock HTML File
1. In Chrome: `Cmd+O` (Mac) or `Ctrl+O` (Windows)
2. Navigate to: `tests/lab/mock_pcc_staffing.html`
3. Click **"Open"**

### Step 3: View Console Output
1. Press `F12` to open Developer Tools
2. Click **"Console"** tab
3. Look for: `[TraceLayer] ✅ Successfully scraped staffing data:`
4. Verify the JSON output shows:
   - `census: 142`
   - `rn.scheduled: 24`, `rn.actual: 22`
   - `cna.scheduled: 48`, `cna.actual: 44`

## Expected Output

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

## Troubleshooting

- **No logs?** → Refresh the page (F5)
- **Extension error?** → Check `chrome://extensions/` for error details
- **Wrong data?** → Check console for parsing errors

For detailed instructions, see `EXTENSION_SETUP.md`.




