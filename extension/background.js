// VRT3X Background Service Worker
// Handles data processing and API communication

const CONFIG = {
  apiEndpoint: 'https://operational-command.vercel.app/api/ingest',
  apiKey: 'vrt3x-extension-key-2024', // TODO: Store securely, rotate regularly
  retryAttempts: 3,
  retryDelay: 2000,
};

// ==========================================
// MESSAGE HANDLERS
// ==========================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 VRT3X Background: Received message', message.type);

  switch (message.type) {
    case 'FACILITY_DATA_CAPTURED':
    case 'STAFFING_DATA_CAPTURED':
      handleDataCapture(message.data, message.timestamp)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open

    case 'UPDATE_BADGE':
      updateBadge(message.text, message.color);
      sendResponse({ success: true });
      break;

    case 'CAPTURE_ERROR':
      logError(message.error);
      sendResponse({ success: true });
      break;

    case 'RETRY_FAILED':
      retryFailedCaptures()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      console.warn('Unknown message type:', message.type);
  }
});

// ==========================================
// DATA PROCESSING
// ==========================================

async function handleDataCapture(rawData, timestamp) {
  console.log('🔄 Processing captured data...');

  try {
    // 1. Validate data
    const validatedData = validateData(rawData);

    // 2. Enrich data
    const enrichedData = enrichData(validatedData, timestamp);

    // 3. Send to API with retry
    const result = await sendToAPIWithRetry(enrichedData);

    // 4. Store locally as backup
    await storeLocalBackup(enrichedData, result);

    console.log('✅ Data processed successfully');
    return result;

  } catch (error) {
    console.error('❌ Data processing failed:', error);
    
    // Store failed capture for later retry
    await storeFailedCapture(rawData, error.message);
    throw error;
  }
}

function validateData(data) {
  const required = ['facilityName', 'timestamp'];
  
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Sanitize and normalize
  return {
    facilityName: sanitizeString(data.facilityName),
    census: normalizeNumber(data.census),
    staffing: {
      budgeted: normalizeNumber(data.staffing?.budgeted),
      scheduled: normalizeNumber(data.staffing?.scheduled),
      actual: normalizeNumber(data.staffing?.actual),
      gap: normalizeNumber(data.staffing?.gap),
      byRole: data.staffing?.byRole || {},
    },
    billing: data.billing || {},
    timestamp: data.timestamp,
    source: data.source || 'unknown',
    url: data.url,
  };
}

function enrichData(data, captureTimestamp) {
  return {
    ...data,
    captureId: generateCaptureId(),
    captureTimestamp,
    userAgent: navigator.userAgent,
    extensionVersion: chrome.runtime.getManifest().version,
    confidence: calculateConfidence(data),
  };
}

function calculateConfidence(data) {
  let score = 0;
  
  if (data.facilityName) score += 0.3;
  if (data.census) score += 0.2;
  if (data.staffing?.budgeted) score += 0.3;
  if (data.staffing?.scheduled) score += 0.2;
  
  return Math.min(score, 1.0);
}

// ==========================================
// API COMMUNICATION
// ==========================================

async function sendToAPIWithRetry(data, attempt = 1) {
  try {
    // Map to API format
    const apiPayload = mapToAPIPayload(data);
    
    const response = await fetch(CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.apiKey,
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ API sync successful:', result);
    
    // Update badge on success
    await updateBadge('✓', '#22c55e');
    
    return result;

  } catch (error) {
    console.error(`❌ API sync attempt ${attempt} failed:`, error);

    if (attempt < CONFIG.retryAttempts) {
      console.log(`⏳ Retrying in ${CONFIG.retryDelay}ms...`);
      await sleep(CONFIG.retryDelay * attempt); // Exponential backoff
      return sendToAPIWithRetry(data, attempt + 1);
    }

    // Update badge on failure
    await updateBadge('✗', '#ef4444');
    
    throw new Error(`API sync failed after ${CONFIG.retryAttempts} attempts: ${error.message}`);
  }
}

/**
 * Map captured data to API payload format
 */
function mapToAPIPayload(data) {
  // Extract facility_id from URL or use facilityName as fallback
  let facility_id = data.facility_id;
  
  if (!facility_id && data.url) {
    const urlMatch = data.url.match(/facility[\/=]([a-zA-Z0-9-]+)/i);
    if (urlMatch) {
      facility_id = urlMatch[1];
    }
  }
  
  // If still no facility_id, we'll need to look it up by name
  // For now, use facilityName as identifier (API will handle lookup)
  if (!facility_id) {
    facility_id = data.facilityName?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
  }

  // Map staffing data to API format
  const staffing = data.staffing || {};
  const byRole = staffing.byRole || {};
  
  // Extract RN and CNA data
  const rn = byRole.RN || byRole.rn || {};
  const cna = byRole.CNA || byRole.cna || {};
  const lpn = byRole.LPN || byRole.lpn || {};

  return {
    facility_id,
    facilityName: data.facilityName,
    census: data.census || 0,
    rn: {
      scheduled: rn.scheduled || staffing.scheduled || 0,
      actual: rn.actual || staffing.actual || 0,
    },
    cna: {
      scheduled: cna.scheduled || 0,
      actual: cna.actual || 0,
    },
    lpn: {
      scheduled: lpn.scheduled || 0,
      actual: lpn.actual || 0,
    },
    timestamp: data.timestamp || new Date().toISOString(),
    url: data.url || '',
    confidence: data.confidence || 0,
    source: data.source || 'pointclickcare',
  };
}

// ==========================================
// LOCAL STORAGE
// ==========================================

async function storeLocalBackup(data, apiResult) {
  try {
    const stored = await chrome.storage.local.get('captures');
    const backup = stored.captures || [];
    
    backup.push({
      data,
      apiResult,
      timestamp: Date.now(),
    });

    // Keep only last 50 captures
    if (backup.length > 50) {
      backup.shift();
    }

    await chrome.storage.local.set({ captures: backup });
    console.log('[VRT3X] Stored local backup');
  } catch (error) {
    console.error('[VRT3X] Error storing backup:', error);
  }
}

async function storeFailedCapture(data, error) {
  try {
    const stored = await chrome.storage.local.get('failed_captures');
    const failed = stored.failed_captures || [];
    
    failed.push({
      data,
      error: error.message || String(error),
      timestamp: Date.now(),
      retryCount: 0,
    });

    // Keep only last 50 failed captures
    if (failed.length > 50) {
      failed.shift();
    }

    await chrome.storage.local.set({ failed_captures: failed });
    console.log('[VRT3X] Stored failed capture for retry:', failed.length);
  } catch (err) {
    console.error('[VRT3X] Error storing failed capture:', err);
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function sanitizeString(str) {
  if (!str) return null;
  return str.trim().replace(/\s+/g, ' ');
}

function normalizeNumber(value) {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'number' ? value : parseInt(value);
  return isNaN(num) ? null : num;
}

function generateCaptureId() {
  return `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateBadge(text, color) {
  try {
    if (chrome.action) {
      await chrome.action.setBadgeText({ text });
      await chrome.action.setBadgeBackgroundColor({ color });
    }
  } catch (error) {
    console.warn('[VRT3X] Could not update badge:', error);
  }
}

function logError(error) {
  // Send to error tracking service
  console.error('🔴 Extension Error:', error);
  
  // Could send to Sentry, LogRocket, etc.
  // For now, just log to console
}

// ==========================================
// RETRY FAILED CAPTURES
// ==========================================

async function retryFailedCaptures() {
  try {
    const stored = await chrome.storage.local.get('failed_captures');
    const captures = stored.failed_captures || [];
    
    if (captures.length === 0) {
      return;
    }
    
    console.log(`🔄 Retrying ${captures.length} failed captures...`);
    
    const successful = [];
    const stillFailed = [];
    
    for (const capture of captures) {
      // Skip if retry count exceeds 5
      if (capture.retryCount >= 5) {
        console.log('[VRT3X] Skipping capture with max retries:', capture);
        continue;
      }
      
      try {
        const result = await handleDataCapture(capture.data, capture.timestamp);
        successful.push(capture);
        console.log('[VRT3X] Retry successful:', capture);
      } catch (error) {
        capture.retryCount += 1;
        capture.lastRetry = Date.now();
        stillFailed.push(capture);
        console.log('[VRT3X] Retry failed, will retry again:', capture.retryCount);
      }
    }
    
    // Update storage with remaining failed captures
    await chrome.storage.local.set({ failed_captures: stillFailed });
    
    if (successful.length > 0) {
      console.log(`✅ Successfully retried ${successful.length} captures`);
    }
  } catch (error) {
    console.error('[VRT3X] Error in retryFailedCaptures:', error);
  }
}

// Set up periodic retry of failed captures (every hour)
if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'retry-failed') {
      await retryFailedCaptures();
    } else if (alarm.name === 'cleanup_old_data') {
      const items = await chrome.storage.local.get(null);
      const now = Date.now();
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      const keysToDelete = Object.keys(items).filter(key => {
        if (key.startsWith('staffing_')) {
          const timestamp = parseInt(key.split('_')[1]);
          return timestamp < oneWeekAgo;
        }
        return false;
      });
      
      if (keysToDelete.length > 0) {
        await chrome.storage.local.remove(keysToDelete);
        console.log(`[VRT3X] Cleaned up ${keysToDelete.length} old entries`);
      }
    }
  });

  // Set up retry alarm (runs every hour)
  try {
    chrome.alarms.create('retry-failed', { periodInMinutes: 60 });
  } catch (error) {
    console.warn('[VRT3X] Could not create retry alarm:', error);
  }

  // Set up cleanup alarm (runs daily)
  try {
    chrome.alarms.create('cleanup_old_data', { periodInMinutes: 24 * 60 });
  } catch (error) {
    console.warn('[VRT3X] Could not create cleanup alarm:', error);
  }
} else {
  console.warn('[VRT3X] Alarms API not available');
}

// Retry failed captures on startup
retryFailedCaptures();
