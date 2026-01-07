/**
 * TraceLayer SNF - Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const captureBtn = document.getElementById('capture');
  
  // Check if we're on a staffing page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url?.includes('pointclickcare.com/Facilitator/Staffing')) {
    statusEl.textContent = 'Active on Staffing Page';
    statusEl.className = 'status active';
    captureBtn.disabled = false;
  } else {
    statusEl.textContent = 'Navigate to PointClickCare Staffing page';
    statusEl.className = 'status inactive';
    captureBtn.disabled = true;
  }
  
  // Get latest captured data
  const result = await chrome.storage.local.get('latest_staffing');
  if (result.latest_staffing) {
    console.log('Latest data:', result.latest_staffing);
  }
  
  captureBtn.addEventListener('click', async () => {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'FORCE_CAPTURE' });
      statusEl.textContent = 'Capture triggered...';
    }
  });
});

