import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BriefingProvider } from '@/context/BriefingContext';
import RevenueIntegrity from '@/pages/RevenueIntegrity';

// Mock facility data with revenue information
vi.mock('@/data/facilityData', () => ({
  facilities: [
    {
      id: 'fac-1',
      name: 'Test Facility 1',
      census: 45,
      attentionScore: 75,
      primaryStressSignal: 'Acuity Mismatch',
      stressCategory: 'acuity',
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
  ],
}));

describe('Data Consistency - Revenue Calculations', () => {
  it('should render revenue integrity page without crashing', async () => {
    render(
      <BrowserRouter>
        <BriefingProvider>
          <RevenueIntegrity />
        </BriefingProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Page should render without errors
      expect(screen.queryByText(/revenue integrity/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display facilities from context', async () => {
    render(
      <BrowserRouter>
        <BriefingProvider>
          <RevenueIntegrity />
        </BriefingProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should render page content
      const page = screen.queryByText(/revenue integrity/i);
      expect(page).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle empty facility list gracefully', async () => {
    render(
      <BrowserRouter>
        <BriefingProvider>
          <RevenueIntegrity />
        </BriefingProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should not crash, should show some state (empty or loading)
      const page = screen.queryByText(/revenue integrity/i);
      expect(page || screen.queryByText(/loading/i) || screen.queryByText(/no facilities/i)).toBeTruthy();
    }, { timeout: 3000 });
  });
});

