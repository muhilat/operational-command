/**
 * Sync Status Hook
 * 
 * Tracks the last data sync time and calculates time ago.
 * Used to display sync status indicator in header.
 */

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

const SYNC_STORAGE_KEY = 'vrt3x_last_sync';
const CAPTURE_GAP_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

export interface SyncStatus {
  lastSyncTime: Date | null;
  timeAgo: string;
  isCaptureGap: boolean;
  statusColor: 'green' | 'amber';
}

/**
 * Get last sync time from localStorage
 */
function getLastSyncTime(): Date | null {
  try {
    const stored = localStorage.getItem(SYNC_STORAGE_KEY);
    if (stored) {
      const timestamp = parseInt(stored, 10);
      if (!isNaN(timestamp)) {
        return new Date(timestamp);
      }
    }
  } catch (error) {
    console.error('[SyncStatus] Error reading last sync time:', error);
  }
  return null;
}

/**
 * Update last sync time in localStorage
 */
export function updateLastSyncTime(): void {
  try {
    const now = Date.now();
    localStorage.setItem(SYNC_STORAGE_KEY, now.toString());
  } catch (error) {
    console.error('[SyncStatus] Error updating last sync time:', error);
  }
}

/**
 * Hook to track sync status
 * Updates every minute to refresh "time ago" display
 */
export function useSyncStatus(): SyncStatus {
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(getLastSyncTime());
  const [timeAgo, setTimeAgo] = useState<string>('Never');
  const [isCaptureGap, setIsCaptureGap] = useState<boolean>(false);

  useEffect(() => {
    // Update sync status immediately
    const updateStatus = () => {
      const syncTime = getLastSyncTime();
      setLastSyncTime(syncTime);

      if (syncTime) {
        const now = Date.now();
        const timeSinceSync = now - syncTime.getTime();
        const gap = timeSinceSync > CAPTURE_GAP_THRESHOLD_MS;
        
        setIsCaptureGap(gap);
        setTimeAgo(formatDistanceToNow(syncTime, { addSuffix: true }));
      } else {
        setIsCaptureGap(true); // No sync = capture gap
        setTimeAgo('Never');
      }
    };

    updateStatus();

    // Update every minute
    const interval = setInterval(updateStatus, 60000);

    // Listen for storage changes (in case another tab updates sync time)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SYNC_STORAGE_KEY) {
        updateStatus();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    lastSyncTime,
    timeAgo,
    isCaptureGap,
    statusColor: isCaptureGap ? 'amber' : 'green',
  };
}




