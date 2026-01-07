/**
 * TraceLayer SNF - The Sucker (Content Script)
 * 
 * Automated data capture from PointClickCare staffing grids.
 * Uses MutationObserver to passively scrape DOM without waiting for APIs.
 * 
 * PRINCIPLE: Read-Only First - We ingest data via scraping; we never write to the EHR.
 */

interface ScrapedStaffingData {
  census: number;
  rn: {
    scheduled: number;
    actual: number;
  };
  cna: {
    scheduled: number;
    actual: number;
  };
  timestamp: string;
  url: string;
}

/**
 * Extract numeric value from text (handles "24.0", "24", etc.)
 */
function extractNumber(text: string | null): number {
  if (!text) return 0;
  const match = text.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

/**
 * Scrape staffing data from the #staffing_grid table
 */
function scrapeStaffingGrid(): ScrapedStaffingData | null {
  const grid = document.querySelector('#staffing_grid');
  if (!grid) {
    console.log('[TraceLayer] Staffing grid not found');
    return null;
  }

  const data: ScrapedStaffingData = {
    census: 0,
    rn: { scheduled: 0, actual: 0 },
    cna: { scheduled: 0, actual: 0 },
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };

  // Try to find census count
  const censusElement = document.querySelector('[id*="census"], [class*="census"]');
  if (censusElement) {
    data.census = extractNumber(censusElement.textContent);
  }

  // Scrape staffing data from table rows
  // Look for total rows (e.g., "RN Total", "CNA Total") which are more reliable
  const rows = grid.querySelectorAll('tr');
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td, th'));
    const rowText = row.textContent?.toLowerCase() || '';
    
    // Look for RN Total row
    if (rowText.includes('rn total') || (rowText.includes('rn') && rowText.includes('total'))) {
      const cellTexts = cells.map(cell => cell.textContent?.trim() || '');
      // Find numeric values - typically in "Scheduled" and "Actual" columns
      const numbers = cellTexts
        .map(text => extractNumber(text))
        .filter(num => num > 0);
      
      // Usually the first two significant numbers are scheduled and actual
      if (numbers.length >= 2) {
        data.rn.scheduled = numbers[0];
        data.rn.actual = numbers[1];
      }
    }
    
    // Look for LPN Total row (if needed)
    if (rowText.includes('lpn total') || (rowText.includes('lpn') && rowText.includes('total'))) {
      const cellTexts = cells.map(cell => cell.textContent?.trim() || '');
      const numbers = cellTexts
        .map(text => extractNumber(text))
        .filter(num => num > 0);
      
      if (numbers.length >= 2) {
        // Store LPN data if needed (currently not in interface, but can be added)
        console.log('[TraceLayer] LPN data found:', { scheduled: numbers[0], actual: numbers[1] });
      }
    }
    
    // Look for CNA Total row
    if (rowText.includes('cna total') || (rowText.includes('cna') && rowText.includes('total'))) {
      const cellTexts = cells.map(cell => cell.textContent?.trim() || '');
      const numbers = cellTexts
        .map(text => extractNumber(text))
        .filter(num => num > 0);
      
      if (numbers.length >= 2) {
        data.cna.scheduled = numbers[0];
        data.cna.actual = numbers[1];
      }
    }
  }
  
  // Fallback: If totals not found, try to find individual rows and sum them
  if (data.rn.scheduled === 0 && data.cna.scheduled === 0) {
    let rnScheduled = 0, rnActual = 0;
    let cnaScheduled = 0, cnaActual = 0;
    
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('td'));
      const rowText = row.textContent?.toLowerCase() || '';
      const cellTexts = cells.map(cell => cell.textContent?.trim() || '');
      
      // Skip header rows and total rows
      if (rowText.includes('total') || rowText.includes('role') || rowText.includes('employee')) {
        continue;
      }
      
      if (rowText.includes('rn') && !rowText.includes('lpn')) {
        const numbers = cellTexts.map(text => extractNumber(text)).filter(num => num > 0);
        if (numbers.length >= 2) {
          rnScheduled += numbers[0];
          rnActual += numbers[1];
        }
      }
      
      if (rowText.includes('cna')) {
        const numbers = cellTexts.map(text => extractNumber(text)).filter(num => num > 0);
        if (numbers.length >= 2) {
          cnaScheduled += numbers[0];
          cnaActual += numbers[1];
        }
      }
    }
    
    if (rnScheduled > 0) {
      data.rn.scheduled = rnScheduled;
      data.rn.actual = rnActual;
    }
    if (cnaScheduled > 0) {
      data.cna.scheduled = cnaScheduled;
      data.cna.actual = cnaActual;
    }
  }

  // Validate we got some data
  if (data.rn.scheduled === 0 && data.cna.scheduled === 0) {
    console.log('[TraceLayer] No staffing data found in grid');
    return null;
  }

  // Data Verification: Output final JSON object
  console.log('[TraceLayer] ✅ Successfully scraped staffing data:');
  console.log(JSON.stringify(data, null, 2));
  
  return data;
}

/**
 * Store scraped data in chrome.storage.local
 */
async function storeScrapedData(data: ScrapedStaffingData): Promise<void> {
  try {
    const key = `staffing_${Date.now()}`;
    await chrome.storage.local.set({ [key]: data });
    
    // Also store latest for quick access
    await chrome.storage.local.set({ 'latest_staffing': data });
    
    console.log('[TraceLayer] Stored staffing data:', data);
    
    // Notify background script if needed
    chrome.runtime.sendMessage({
      type: 'STAFFING_DATA_CAPTURED',
      data,
    }).catch(() => {
      // Background script might not be ready, that's okay
    });
  } catch (error) {
    console.error('[TraceLayer] Error storing data:', error);
  }
}

/**
 * Main capture function
 */
function captureStaffingData(): void {
  const data = scrapeStaffingGrid();
  if (data) {
    storeScrapedData(data);
  }
}

/**
 * Initialize MutationObserver to watch for DOM changes
 * This handles dynamic content loading in PointClickCare
 */
function initializeObserver(): void {
  const observer = new MutationObserver((mutations) => {
    // Check if staffing grid appeared or was updated
    const grid = document.querySelector('#staffing_grid');
    if (grid) {
      // Debounce: only capture once per second
      if (!window.traceLayerCaptureTimeout) {
        window.traceLayerCaptureTimeout = setTimeout(() => {
          captureStaffingData();
          window.traceLayerCaptureTimeout = null;
        }, 1000);
      }
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
  });

  console.log('[TraceLayer] MutationObserver initialized');
}

/**
 * Check if we're on the right page
 */
function isStaffingPage(): boolean {
  return window.location.href.includes('/Facilitator/Staffing/DailyStaffing.aspx') ||
         window.location.href.includes('mock_pcc_staffing.html');
}

/**
 * Initialize the scraper
 */
function init(): void {
  if (!isStaffingPage()) {
    console.log('[TraceLayer] Not on staffing page, skipping');
    return;
  }

  console.log('[TraceLayer] Initializing content script on:', window.location.href);

  // Try immediate capture (in case page is already loaded)
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    captureStaffingData();
  } else {
    window.addEventListener('DOMContentLoaded', captureStaffingData);
  }

  // Set up observer for dynamic content
  initializeObserver();

  // Periodic capture (every 30 seconds) as backup
  setInterval(captureStaffingData, 30000);
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    traceLayerCaptureTimeout?: number | null;
  }
}

// Start the scraper
init();

