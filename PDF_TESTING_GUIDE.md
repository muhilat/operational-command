# PDF Generation Testing Guide

## How to Test the Hashed PDF Generation Workflow

### Step 1: Start the Development Server

```bash
npm run dev
```

The app should be available at `http://localhost:8080`

### Step 2: Navigate to a Facility Detail Page

1. **Complete Calibration Handshake** (if not already done):
   - Enter facility count (e.g., 15)
   - Select a focus area (e.g., "Staffing")
   - Choose objective (e.g., "Broad weekly scan")

2. **Click on a Facility Card** from the Attention Brief
   - This will navigate to `/facility/{facilityId}`
   - You'll see the Facility Detail page with three VRT3X Nodes

### Step 3: Generate a Defense Memo

1. **Scroll to Node 2: Defense (The Shield)**
   - Look for the "Generate Good Faith Defense Memo" button
   - It should be at the bottom of Node 2 panel

2. **Click the Button**
   - A dialog will open asking for "Action Taken"

3. **Enter Action Taken**
   - Example: "Contacted agency for RN coverage. Offered float pool position. Notified DON of staffing gap."
   - Click "Generate Memo"

### Step 4: Verify the PDF Generation

#### A. Check Browser Console

Open Developer Tools (F12 or Cmd+Option+I) and look for:

```
[Supabase] Created mitigation event: { id: "...", ... }
[generateMemo] Uploaded file to storage: { bucket: "defense-vault", ... }
```

#### B. Check PDF Download

- The PDF should automatically download to your Downloads folder
- Filename format: `VRT3X-Defense-Memo-{eventId}.pdf`

#### C. Verify PDF Content

Open the downloaded PDF and check:

1. **Title Page**:
   - "VRT3X Defense Memo"
   - "Operational Defense Documentation"

2. **Facility Information**:
   - Facility Name
   - Facility ID
   - Document Date

3. **Operational Observations**:
   - Signal Headline
   - System Observation (should use "Observation:" language, NOT "Recommendation:")
   - Attention Intensity (Low/Elevated/Critical)
   - Evidence details (e.g., "Observed: Staffing gap of X hours")

4. **Mitigation Actions Taken**:
   - Your entered action text

5. **Audit Trail**:
   - Mitigation Event ID (UUID)
   - Audit Reference ID
   - Generated timestamp
   - User ID

6. **Footer on Every Page** (MOST IMPORTANT):
   ```
   VRT3X INTEGRITY VERIFICATION
   Verification ID: [UUID from database]
   Timestamp: [ISO timestamp]
   Status: Verified Sovereign Audit Trail Entry
   ```
   - Should be in monospaced font (Courier)
   - Should appear on every page
   - The UUID should match the Mitigation Event ID

### Step 5: Verify Database Record

#### Check localStorage (Development Mode)

1. Open Developer Tools → Application tab → Local Storage
2. Look for key: `mitigation_events`
3. You should see a JSON array with your mitigation event
4. Verify:
   - `id` matches the UUID in PDF footer
   - `auditReferenceId` is present
   - `evidencePayload.pdfStoragePath` contains the storage path

#### Check Storage Metadata (Development Mode)

1. In Local Storage, look for key: `storage_uploads`
2. You should see metadata for the uploaded PDF:
   ```json
   {
     "storage_defense-vault_{facilityId}_{eventId}.pdf": {
       "bucket": "defense-vault",
       "path": "{facilityId}/{eventId}.pdf",
       "contentType": "application/pdf",
       "size": [file size in bytes],
       "uploadedAt": "[ISO timestamp]"
     }
   }
   ```

### Step 6: Verify Toast Notification

After generation, you should see a toast notification:
- **Title**: "Defense Memo Generated"
- **Description**: "Audit Reference: [auditReferenceId]. PDF saved to defense-vault."

### Common Issues & Solutions

#### Issue: PDF doesn't download
- **Check**: Browser console for errors
- **Solution**: Check if popup blocker is enabled, or manually check Downloads folder

#### Issue: Footer UUID doesn't match
- **Check**: Compare `mitigationEvent.id` in console with PDF footer
- **Solution**: Ensure database insert happens BEFORE PDF generation

#### Issue: "Observation" language not used
- **Check**: PDF content for words like "Recommendation" or "Should"
- **Solution**: Verify `generateDefenseMemoPDF` uses "Observed:" prefix

#### Issue: Footer not on every page
- **Check**: Multi-page PDFs - footer should appear on all pages
- **Solution**: Verify `addFooter()` is called in `checkPageBreak()` and after final content

### Testing Checklist

- [ ] PDF downloads automatically
- [ ] PDF filename includes event ID
- [ ] Footer appears on every page
- [ ] Footer contains correct UUID (matches database)
- [ ] Footer uses monospaced font (Courier)
- [ ] Content uses "Observation:" language (not "Recommendation:")
- [ ] Toast notification appears with audit reference
- [ ] Database record created in localStorage
- [ ] Storage metadata saved in localStorage
- [ ] No console errors during generation

### Next Steps (Production)

When connecting to real Supabase:

1. **Verify Database Insert**:
   ```sql
   SELECT * FROM mitigation_events 
   WHERE facility_id = '{facilityId}' 
   ORDER BY timestamp DESC 
   LIMIT 1;
   ```

2. **Verify Storage Upload**:
   - Check Supabase Storage → `defense-vault` bucket
   - File should be at: `{facilityId}/{eventId}.pdf`

3. **Verify PDF Link**:
   - Check `evidencePayload.pdfStoragePath` in mitigation_events table




