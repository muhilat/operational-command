/**
 * TraceLayer SNF - Background Service Worker
 * 
 * Handles messages from content script and manages data sync.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STAFFING_DATA_CAPTURED') {
    console.log('[TraceLayer] Received staffing data:', message.data);
    
    // Here you could:
    // 1. Send to backend API
    // 2. Aggregate data
    // 3. Trigger alerts
    
    sendResponse({ success: true });
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

