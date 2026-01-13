import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BriefingProvider, useBriefingContext } from '../BriefingContext';
import { ReactNode } from 'react';

// Mock facilityData module - must be inline in vi.mock
vi.mock('@/data/facilityData', () => ({
  facilities: [
    {
      id: 'fac-1',
      name: 'Test Facility 1',
      census: 45,
      attentionScore: 75,
      primaryStressSignal: 'Staffing Gap Detected',
      stressCategory: 'staffing',
      staffingTrend: [0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6],
      uncapturedRevenue: 250,
      actionStatus: 'defense-memo-needed',
      staffingDetails: {
        rn: [{ scheduled: 6, actual: 4 }],
        lpn: [],
        cna: [{ scheduled: 8, actual: 8 }],
        alerts: [],
      },
      revenueDetails: {
        observedAcuity: 'HIGH',
        billingStatus: 'STANDARD',
        dailyMismatch: 250,
      },
      defensibility: {
        agencyCallsDocumented: false,
        floatPoolOffered: false,
        donNotified: false,
        lastMemoDate: null,
      },
      incidentSignals: [],
    },
    {
      id: 'fac-2',
      name: 'Test Facility 2',
      census: 38,
      attentionScore: 50,
      primaryStressSignal: 'No Signals',
      stressCategory: 'staffing',
      staffingTrend: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
      uncapturedRevenue: 0,
      actionStatus: 'audit-ready',
      staffingDetails: {
        rn: [{ scheduled: 5, actual: 5 }],
        lpn: [],
        cna: [{ scheduled: 6, actual: 6 }],
        alerts: [],
      },
      revenueDetails: {
        observedAcuity: 'STANDARD',
        billingStatus: 'STANDARD',
        dailyMismatch: 0,
      },
      defensibility: {
        agencyCallsDocumented: false,
        floatPoolOffered: false,
        donNotified: false,
        lastMemoDate: null,
      },
      incidentSignals: [],
    },
  ],
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <BriefingProvider>{children}</BriefingProvider>
);

describe('BriefingContext - Single Source of Truth', () => {
  it('should provide facilities from context', async () => {
    const { result } = renderHook(() => useBriefingContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.facilities).toBeDefined();
    }, { timeout: 3000 });

    // Should have facilities
    expect(result.current.facilities.length).toBeGreaterThan(0);
  });

  it('should calculate revenueDelta consistently', async () => {
    const { result } = renderHook(() => useBriefingContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.facilities.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const facility = result.current.facilities[0];

    // Revenue delta should be a number
    expect(typeof facility.revenueDelta).toBe('number');

    // Should not be NaN
    expect(isNaN(facility.revenueDelta)).toBe(false);
  });

  it('should have consistent syncTimestamp', async () => {
    const { result } = renderHook(() => useBriefingContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.facilities.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const facility = result.current.facilities[0];

    // Sync timestamp should be a Date object
    expect(facility.syncTimestamp).toBeInstanceOf(Date);

    // Should not be invalid
    expect(isNaN(facility.syncTimestamp.getTime())).toBe(false);
  });

  it('should calculate intensity consistently', async () => {
    const { result } = renderHook(() => useBriefingContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.facilities.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const facility = result.current.facilities[0];

    // Intensity should be one of the valid values
    expect(['Low', 'Elevated', 'Critical']).toContain(facility.intensity);
  });

  it('should have stateObservation for each facility', async () => {
    const { result } = renderHook(() => useBriefingContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.facilities.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const facility = result.current.facilities[0];

    // Should have state observation
    expect(typeof facility.stateObservation).toBe('string');
    expect(facility.stateObservation.length).toBeGreaterThan(0);
  });

  it('should have confidence levels', async () => {
    const { result } = renderHook(() => useBriefingContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.facilities.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const facility = result.current.facilities[0];

    // Confidence should be one of the valid values
    expect(['High', 'Med', 'Low']).toContain(facility.confidence);
  });

  it('should handle updateSyncTimestamp', async () => {
    const { result } = renderHook(() => useBriefingContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.facilities.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const facility = result.current.facilities[0];
    const newTimestamp = new Date();

    // Should have updateSyncTimestamp function
    expect(typeof result.current.updateSyncTimestamp).toBe('function');

    // Should not throw when called
    expect(() => {
      result.current.updateSyncTimestamp(facility.id, newTimestamp);
    }).not.toThrow();
  });

  it('should handle updateRevenueDelta', async () => {
    const { result } = renderHook(() => useBriefingContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.facilities.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const facility = result.current.facilities[0];

    // Should have updateRevenueDelta function
    expect(typeof result.current.updateRevenueDelta).toBe('function');

    // Should not throw when called
    expect(() => {
      result.current.updateRevenueDelta(facility.id, 500);
    }).not.toThrow();
  });
});

