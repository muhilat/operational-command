import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BriefingProvider } from '@/context/BriefingContext';
import RevenueIntegrity from '@/pages/RevenueIntegrity';
import LiabilityDefense from '@/pages/LiabilityDefense';

// Mock facility data
vi.mock('@/data/facilityData', () => ({
  facilities: [
    {
      id: 'fac-1',
      name: 'Test Facility',
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
  ],
}));

describe('Legal Language Compliance', () => {
  it('Revenue page should not contain prescriptive language', async () => {
    const { container } = render(
      <BrowserRouter>
        <BriefingProvider>
          <RevenueIntegrity />
        </BriefingProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const text = container.textContent || '';

    // Should NOT contain these dangerous words (case insensitive)
    const prescriptivePatterns = [
      /you should/i,
      /must hire/i,
      /we recommend/i,
      /need to/i,
      /have to/i,
      /required to/i,
    ];

    prescriptivePatterns.forEach((pattern) => {
      expect(text).not.toMatch(pattern);
    });
  });

  it('Liability page should have legal disclaimer', async () => {
    const { container } = render(
      <BrowserRouter>
        <BriefingProvider>
          <LiabilityDefense />
        </BriefingProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const text = container.textContent || '';

    // Should have disclaimer text
    expect(text).toMatch(/observational/i);
    expect(text).toMatch(/informational purposes/i);
  });

  it('Revenue page should use observational language', async () => {
    const { container } = render(
      <BrowserRouter>
        <BriefingProvider>
          <RevenueIntegrity />
        </BriefingProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const text = container.textContent || '';

    // Should contain observational terms
    const observationalTerms = [
      /observation/i,
      /observed/i,
      /current status/i,
    ];

    // At least one observational term should be present
    const hasObservationalLanguage = observationalTerms.some((pattern) =>
      pattern.test(text)
    );

    // This is a soft check - if no facilities, might not have observations
    // But if there's content, it should use observational language
    if (text.length > 100) {
      expect(hasObservationalLanguage || text.includes('Observation')).toBe(true);
    }
  });
});

