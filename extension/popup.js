// VRT3X Extension Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const statusText = document.getElementById('statusText');
  const statusInfo = document.getElementById('statusInfo');
  const statusDiv = document.getElementById('status');
  const captureBtn = document.getElementById('captureBtn');
  const retryBtn = document.getElementById('retryBtn');

  // Load status
  await updateStatus();

  // Capture button
  captureBtn.addEventListener('click', async () => {
    captureBtn.disabled = true;
    captureBtn.textContent = 'Capturing...';
    
    try {
      // Send message to content script to capture
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url && (tab.url.includes('pointclickcare.com') || tab.url.includes('localhost'))) {
        await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_NOW' });
        statusText.textContent = 'Capture triggered';
        statusDiv.className = 'status success';
        statusInfo.textContent = 'Check console for details';
      } else {
        statusText.textContent = 'Not on supported page';
        statusDiv.className = 'status warning';
        statusInfo.textContent = 'Navigate to PointClickCare staffing page';
      }
    } catch (error) {
      statusText.textContent = 'Error';
      statusDiv.className = 'status error';
      statusInfo.textContent = error.message;
    } finally {
      captureBtn.disabled = false;
      captureBtn.textContent = 'Capture Data Now';
      setTimeout(updateStatus, 2000);
    }
  });

  // Retry button
  retryBtn.addEventListener('click', async () => {
    retryBtn.disabled = true;
    retryBtn.textContent = 'Retrying...';
    
    try {
      // Trigger retry in background script
      chrome.runtime.sendMessage({ type: 'RETRY_FAILED' });
      statusText.textContent = 'Retry triggered';
      statusDiv.className = 'status success';
      statusInfo.textContent = 'Check background console';
    } catch (error) {
      statusText.textContent = 'Error';
      statusDiv.className = 'status error';
      statusInfo.textContent = error.message;
    } finally {
      retryBtn.disabled = false;
      retryBtn.textContent = 'Retry Failed Captures';
      setTimeout(updateStatus, 2000);
    }
  });

  async function updateStatus() {
    try {
      const stored = await chrome.storage.local.get(['last_sync_timestamp', 'failed_captures']);
      const lastSync = stored.last_sync_timestamp;
      const failed = stored.failed_captures || [];

      if (lastSync) {
        const timeAgo = Math.floor((Date.now() - lastSync) / 1000 / 60);
        statusText.textContent = `Last sync: ${timeAgo} min ago`;
        statusDiv.className = 'status success';
        statusInfo.textContent = timeAgo < 10 ? 'All systems operational' : 'Sync may be delayed';
      } else {
        statusText.textContent = 'No sync yet';
        statusDiv.className = 'status warning';
        statusInfo.textContent = 'Waiting for data capture';
      }

      if (failed.length > 0) {
        statusInfo.textContent += ` | ${failed.length} failed captures`;
        statusDiv.className = 'status warning';
      }
    } catch (error) {
      statusText.textContent = 'Error loading status';
      statusDiv.className = 'status error';
      statusInfo.textContent = error.message;
    }
  }
});
