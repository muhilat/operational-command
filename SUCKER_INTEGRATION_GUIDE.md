# VRT3X Data Capture Extension Integration Guide

## Overview

This guide explains how the VRT3X Data Capture Extension ("The Sucker") integrates with the backend API to ingest facility staffing data.

---

## Architecture

```
Extension (content.js) 
  → Background Script (background.js)
  → API Endpoint (/api/ingest)
  → Supabase (facility_metrics table)
  → BriefingContext (refresh)
```

---

## 1. API Endpoint: `/api/ingest`

### Location
- **File**: `api/ingest.ts`
- **URL**: `https://vrt3x.com/api/ingest`

### Authentication
- **Header**: `X-API-Key: vrt3x-extension-key-2024`
- **Method**: POST
- **Content-Type**: application/json

### Request Payload
```json
{
  "facility_id": "facility-uuid-here",
  "census": 45,
  "rn": {
    "scheduled": 6,
    "actual": 4
  },
  "cna": {
    "scheduled": 12,
    "actual": 10
  },
  "lpn": {
    "scheduled": 0,
    "actual": 0
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "url": "https://pointclickcare.com/facility/12345/staffing"
}
```

### Response
```json
{
  "success": true,
  "facility_id": "facility-uuid-here",
  "metrics_id": "metrics-uuid",
  "state_observation": {
    "is_critical": true,
    "rn_gap": 2.0,
    "cna_gap": 2.0,
    "critical_reason": "RN gap of 2.0 hours, CNA gap of 2.0 hours"
  },
  "sync_timestamp": "2024-01-15T10:30:00Z"
}
```

### State Observations
- **CRITICAL Threshold**: 2 hours gap (configurable)
- If `(scheduled - actual) > 2 hours` for RN or CNA, facility is flagged as CRITICAL
- Critical state is stored in `facilities` table: `critical_state`, `critical_reason`

---

## 2. Database Mapping

### `facility_metrics` Table
```sql
facility_id: TEXT (from payload)
census: INTEGER (from payload.census)
rn_scheduled_hours: NUMERIC (from payload.rn.scheduled)
rn_actual_hours: NUMERIC (from payload.rn.actual)
lpn_scheduled_hours: NUMERIC (from payload.lpn.scheduled)
lpn_actual_hours: NUMERIC (from payload.lpn.actual)
cna_scheduled_hours: NUMERIC (from payload.cna.scheduled)
cna_actual_hours: NUMERIC (from payload.cna.actual)
sync_timestamp: TIMESTAMPTZ (from payload.timestamp)
source_url: TEXT (from payload.url)
```

### `facilities` Table Updates
- `last_sync`: Updated to current timestamp
- `critical_state`: BOOLEAN (true if gap > threshold)
- `critical_reason`: TEXT (e.g., "RN gap of 2.0 hours")

---

## 3. Extension Background Script

### Features
- **X-API-Key Authentication**: Sends API key in request header
- **Retry Logic**: Stores failed captures and retries every hour
- **Facility ID Extraction**: Attempts to extract from URL if not provided
- **Error Handling**: Stores failed captures locally for retry

### Retry Mechanism
1. Failed captures stored in `chrome.storage.local` with `retryCount`
2. Retry alarm runs every hour
3. Maximum 5 retries per capture
4. Successful retries removed from storage

---

## 4. BriefingContext Integration

### Refresh Function
After successful ingestion, call:
```typescript
const { refresh } = useBriefingContext();
await refresh(); // Refreshes facilities from Supabase
```

### Automatic Refresh
The API endpoint updates `facilities.last_sync`, which will be reflected on next BriefingContext refresh.

---

## 5. Environment Variables

### Required in Vercel
- `VITE_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (for API access)
- `VRT3X_API_KEY`: API key for extension authentication (default: `vrt3x-extension-key-2024`)

---

## 6. Setup Instructions

### Step 1: Add Environment Variables to Vercel
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add:
   - `SUPABASE_SERVICE_ROLE_KEY` (from Supabase dashboard)
   - `VRT3X_API_KEY` (generate a secure key)

### Step 2: Update Extension API Key
1. Edit `extension/background.js`
2. Update `API_KEY` constant with the same value as `VRT3X_API_KEY`

### Step 3: Deploy
1. Push changes to GitHub
2. Vercel will auto-deploy
3. API endpoint will be available at `https://vrt3x.com/api/ingest`

---

## 7. Testing

### Test API Endpoint
```bash
curl -X POST https://vrt3x.com/api/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vrt3x-extension-key-2024" \
  -d '{
    "facility_id": "test-facility-id",
    "census": 45,
    "rn": {"scheduled": 6, "actual": 4},
    "cna": {"scheduled": 12, "actual": 10},
    "timestamp": "2024-01-15T10:30:00Z",
    "url": "https://test.com"
  }'
```

### Expected Response
```json
{
  "success": true,
  "facility_id": "test-facility-id",
  "metrics_id": "...",
  "state_observation": {
    "is_critical": true,
    "rn_gap": 2.0,
    "cna_gap": 2.0,
    "critical_reason": "RN gap of 2.0 hours, CNA gap of 2.0 hours"
  },
  "sync_timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 8. Error Handling

### Extension Side
- Failed captures stored in `chrome.storage.local['failed_captures']`
- Retry every hour via `chrome.alarms`
- Maximum 5 retries per capture

### API Side
- Returns 400 for invalid payload
- Returns 401 for missing/invalid API key
- Returns 500 for server errors
- Logs errors to console

---

## 9. Security Considerations

1. **API Key Rotation**: Change `VRT3X_API_KEY` regularly
2. **Service Role Key**: Never expose in client-side code
3. **CORS**: Ensure Supabase allows requests from `vrt3x.com`
4. **Rate Limiting**: Consider adding rate limiting to API endpoint

---

## 10. Troubleshooting

### Extension not sending data?
- Check browser console for errors
- Verify API endpoint URL is correct
- Check API key matches

### API returns 401?
- Verify `X-API-Key` header is sent
- Check `VRT3X_API_KEY` in Vercel matches extension

### Data not appearing in BriefingContext?
- Call `refresh()` after successful ingestion
- Check Supabase `facility_metrics` table for new records
- Verify `facilities.last_sync` is updated

---

## Next Steps

1. ✅ API endpoint created
2. ✅ Extension updated with retry logic
3. ✅ BriefingContext refresh function added
4. ⏳ Add facility_id extraction from URL patterns
5. ⏳ Add WebSocket for real-time updates (optional)
6. ⏳ Add rate limiting to API endpoint

