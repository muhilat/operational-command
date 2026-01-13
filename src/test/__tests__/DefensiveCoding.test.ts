import { describe, it, expect } from 'vitest';
import { isDataStale, getLastSyncTimestamp } from '@/lib/api';

describe('Defensive Coding - API Utilities', () => {
  describe('isDataStale', () => {
    it('should identify stale data (>6 hours)', () => {
      const now = new Date();
      const sevenHoursAgo = new Date(now.getTime() - 7 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

      expect(isDataStale(sevenHoursAgo)).toBe(true);
      expect(isDataStale(oneHourAgo)).toBe(false);
    });

    it('should handle null timestamp gracefully', () => {
      expect(isDataStale(null)).toBe(true);
    });

    it('should handle very old dates', () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      expect(isDataStale(oneYearAgo)).toBe(true);
    });

    it('should handle future dates', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(isDataStale(tomorrow)).toBe(false);
    });
  });

  describe('getLastSyncTimestamp', () => {
    it('should return null for non-existent facility', async () => {
      const timestamp = await getLastSyncTimestamp('non-existent-id');
      expect(timestamp).toBeNull();
    });
  });
});

