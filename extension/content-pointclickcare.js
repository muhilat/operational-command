// VRT3X Data Capture - PointClickCare Integration
// This runs on PointClickCare pages

(function() {
  'use strict';
  
  console.log('🎯 VRT3X: Data capture initialized');

  // Configuration
  const CONFIG = {
    captureInterval: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
    apiEndpoint: 'https://operational-command.vercel.app/api/ingest',
  };

  // State management
  let captureInProgress = false;
  let lastCaptureTime = null;

  // ==========================================
  // CORE CAPTURE FUNCTIONS
  // ==========================================

  /**
   * Main data capture orchestrator
   */
  async function captureData() {
    if (captureInProgress) {
      console.log('⏸️ VRT3X: Capture already in progress, skipping');
      return;
    }

    captureInProgress = true;
    console.log('🔄 VRT3X: Starting data capture...');

    try {
      const facilityData = await extractFacilityData();
      
      if (!facilityData) {
        throw new Error('No facility data extracted');
      }

      console.log('✅ VRT3X: Data extracted:', facilityData);

      // Send to background script for processing
      await chrome.runtime.sendMessage({
        type: 'FACILITY_DATA_CAPTURED',
        data: facilityData,
        timestamp: new Date().toISOString(),
      });

      lastCaptureTime = Date.now();
      await updateBadge('success');
      
    } catch (error) {
      console.error('❌ VRT3X: Capture failed:', error);
      await updateBadge('error');
      
      // Report error
      chrome.runtime.sendMessage({
        type: 'CAPTURE_ERROR',
        error: error.message,
      });
    } finally {
      captureInProgress = false;
    }
  }

  /**
   * Extract facility data from DOM
   * Adapts to different page structures
   */
  async function extractFacilityData() {
    // Wait for page to fully load
    await waitForElement('[data-facility-name], .facility-header, #staffing_grid, h1', 10000);

    const data = {
      facilityName: extractFacilityName(),
      census: extractCensus(),
      staffing: extractStaffingData(),
      billing: extractBillingData(),
      timestamp: new Date().toISOString(),
      source: 'pointclickcare',
      url: window.location.href,
    };

    // Validate critical fields
    if (!data.facilityName) {
      throw new Error('Could not extract facility name');
    }

    return data;
  }

  /**
   * Extract facility name from page
   */
  function extractFacilityName() {
    const selectors = [
      '[data-facility-name]',
      '.facility-header h1',
      '.facility-name',
      '#facility-name',
      'h1.title',
      '.page-title',
      'header h1',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        if (text && text.length > 0) {
          return text;
        }
      }
    }

    // Fallback: try to extract from page title
    const titleMatch = document.title.match(/(.+?)\s*[-–|]/);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    // Last resort: use URL
    const urlMatch = window.location.href.match(/facility[\/=]([^\/\?]+)/i);
    if (urlMatch) {
      return decodeURIComponent(urlMatch[1]);
    }

    return null;
  }

  /**
   * Extract census data
   */
  function extractCensus() {
    const patterns = [
      { selector: '[data-census]', attr: 'data-census' },
      { selector: '.census-count', text: true },
      { selector: '#census', text: true },
      { selector: '.census', text: true },
      { selector: '[id*="census"]', text: true },
      { selector: '[class*="census"]', text: true },
    ];

    for (const pattern of patterns) {
      const element = document.querySelector(pattern.selector);
      if (element) {
        const value = pattern.attr 
          ? element.getAttribute(pattern.attr)
          : element.textContent.trim();
        
        const census = parseInt(value.replace(/\D/g, ''));
        if (!isNaN(census) && census > 0) return census;
      }
    }

    // Try to find in text content
    const bodyText = document.body.textContent || '';
    const censusMatch = bodyText.match(/census[:\s]+(\d+)/i);
    if (censusMatch) {
      return parseInt(censusMatch[1]);
    }

    return null;
  }

  /**
   * Extract staffing matrix
   */
  function extractStaffingData() {
    const staffing = {
      budgeted: null,
      scheduled: null,
      actual: null,
      gap: null,
      byRole: {},
    };

    // Try to find staffing table (PointClickCare specific)
    const table = findStaffingTable();
    if (table) {
      staffing.byRole = parseStaffingTable(table);
      
      // Calculate totals
      staffing.budgeted = sumColumn(staffing.byRole, 'budgeted');
      staffing.scheduled = sumColumn(staffing.byRole, 'scheduled');
      staffing.actual = sumColumn(staffing.byRole, 'actual');
      staffing.gap = staffing.budgeted - (staffing.scheduled || staffing.actual || 0);
    }

    // Fallback: look for individual elements
    if (!staffing.budgeted) {
      staffing.budgeted = extractNumber('.budgeted-staff, [data-budgeted]');
      staffing.scheduled = extractNumber('.scheduled-staff, [data-scheduled]');
      staffing.actual = extractNumber('.actual-staff, [data-actual]');
      staffing.gap = staffing.budgeted - (staffing.scheduled || staffing.actual || 0);
    }

    // Try legacy PointClickCare staffing grid format
    if (!staffing.budgeted && !staffing.scheduled) {
      const gridData = extractFromLegacyGrid();
      if (gridData) {
        Object.assign(staffing, gridData);
      }
    }

    return staffing;
  }

  /**
   * Extract from legacy PointClickCare staffing grid (#staffing_grid)
   */
  function extractFromLegacyGrid() {
    const grid = document.querySelector('#staffing_grid');
    if (!grid) return null;

    const data = {
      budgeted: 0,
      scheduled: 0,
      actual: 0,
      gap: 0,
      byRole: {},
    };

    const rows = grid.querySelectorAll('tr');
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('td, th'));
      const rowText = row.textContent?.toLowerCase() || '';
      
      // Look for RN Total row
      if (rowText.includes('rn total') || (rowText.includes('rn') && rowText.includes('total'))) {
        const numbers = cells
          .map(cell => extractNumberFromText(cell.textContent))
          .filter(num => num > 0);
        
        if (numbers.length >= 2) {
          data.byRole.RN = {
            scheduled: numbers[0],
            actual: numbers[1] || numbers[0],
          };
          data.scheduled += numbers[0];
          data.actual += numbers[1] || numbers[0];
        }
      }
      
      // Look for CNA Total row
      if (rowText.includes('cna total') || (rowText.includes('cna') && rowText.includes('total'))) {
        const numbers = cells
          .map(cell => extractNumberFromText(cell.textContent))
          .filter(num => num > 0);
        
        if (numbers.length >= 2) {
          data.byRole.CNA = {
            scheduled: numbers[0],
            actual: numbers[1] || numbers[0],
          };
          data.scheduled += numbers[0];
          data.actual += numbers[1] || numbers[0];
        }
      }
    }

    data.gap = data.scheduled - data.actual;
    return Object.keys(data.byRole).length > 0 ? data : null;
  }

  /**
   * Extract billing/acuity data
   */
  function extractBillingData() {
    return {
      acuityLevel: extractText('.acuity-level, [data-acuity]'),
      billingStatus: extractText('.billing-status, [data-billing]'),
      pdpmCategory: extractText('.pdpm-category, [data-pdpm]'),
    };
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  function findStaffingTable() {
    const tables = document.querySelectorAll('table');
    for (const table of tables) {
      const text = table.textContent.toLowerCase();
      if (text.includes('staff') && 
          (text.includes('budgeted') || text.includes('scheduled') || text.includes('actual'))) {
        return table;
      }
    }
    return null;
  }

  function parseStaffingTable(table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    const result = {};

    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td, th'));
      if (cells.length >= 3) {
        const role = cells[0].textContent.trim();
        const budgeted = extractNumberFromText(cells[1].textContent);
        const scheduled = extractNumberFromText(cells[2].textContent);
        const actual = cells.length >= 4 ? extractNumberFromText(cells[3].textContent) : null;

        if (role && !isNaN(budgeted)) {
          result[role] = { 
            budgeted, 
            scheduled: scheduled || budgeted,
            actual: actual || scheduled || budgeted,
          };
        }
      }
    });

    return result;
  }

  function sumColumn(data, column) {
    return Object.values(data).reduce((sum, item) => {
      return sum + (item[column] || 0);
    }, 0);
  }

  function extractNumber(selector) {
    const element = document.querySelector(selector);
    if (element) {
      const value = element.textContent || element.getAttribute('value') || '';
      return extractNumberFromText(value);
    }
    return null;
  }

  function extractNumberFromText(text) {
    if (!text) return null;
    const match = text.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  }

  function extractText(selector) {
    const element = document.querySelector(selector);
    return element ? element.textContent.trim() : null;
  }

  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        // Don't reject - just resolve with null if not found
        resolve(null);
      }, timeout);
    });
  }

  async function updateBadge(status) {
    const badges = {
      success: { text: '✓', color: '#22c55e' },
      error: { text: '✗', color: '#ef4444' },
      capturing: { text: '...', color: '#f59e0b' },
    };

    const badge = badges[status];
    if (badge && chrome.action) {
      try {
        await chrome.runtime.sendMessage({
          type: 'UPDATE_BADGE',
          text: badge.text,
          color: badge.color,
        });
      } catch (error) {
        console.warn('Could not update badge:', error);
      }
    }
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CAPTURE_NOW') {
      captureData().then(() => sendResponse({ success: true }));
      return true; // Keep channel open for async response
    }
  });

  // Auto-capture on page load (after delay)
  setTimeout(() => {
    console.log('🚀 VRT3X: Auto-capture triggered');
    captureData();
  }, 3000);

  // Periodic capture
  setInterval(() => {
    const timeSinceLastCapture = Date.now() - (lastCaptureTime || 0);
    if (timeSinceLastCapture >= CONFIG.captureInterval) {
      captureData();
    }
  }, CONFIG.captureInterval);

})();

