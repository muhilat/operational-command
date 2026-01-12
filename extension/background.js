/**
 * VRT3X - Background Service Worker
 * 
 * Handles messages from content script and manages data sync to production API.
 */

const API_ENDPOINT = 'https://vrt3x.com/api/staffing-data';

/**
 * Send staffing data to production API
 */
async function sendToAPI(data) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[VRT3X] Data sent to API successfully:', result);
    
    // Update last sync time in storage (for sync status indicator)
    chrome.storage.local.set({ 'last_sync_timestamp': Date.now() });
    
    // Note: The web app will need to poll the API or use WebSocket to get sync status
    // For now, sync status is managed via localStorage in the web app
    
    return result;
  } catch (error) {
    console.error('[VRT3X] Error sending data to API:', error);
    throw error;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STAFFING_DATA_CAPTURED') {
    console.log('[VRT3X] Received staffing data:', message.data);
    
    // Send to production API
    sendToAPI(message.data)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[VRT3X] Failed to send data:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep message channel open for async response
  }
  
  return true; // Keep message channel open for async response
});

// Optional: Periodic cleanup of old storage entries
if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup_old_data') {
      chrome.storage.local.get(null, (items) => {
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
          chrome.storage.local.remove(keysToDelete);
          console.log(`[TraceLayer] Cleaned up ${keysToDelete.length} old entries`);
        }
      });
    }
  });

  // Set up cleanup alarm (runs daily)
  try {
    chrome.alarms.create('cleanup_old_data', { periodInMinutes: 24 * 60 });
  } catch (error) {
    console.warn('[TraceLayer] Could not create cleanup alarm:', error);
  }
} else {
  console.warn('[TraceLayer] Alarms API not available');
}

