import React, { useState, useEffect } from 'react';
import { CalibrationHandshake, type CalibrationAnswers } from '@/components/dashboard/CalibrationHandshake';
import { AttentionBrief } from '@/components/dashboard/AttentionBrief';

/**
 * VRT3X Dashboard
 *
 * Gated briefing assistant:
 * - Renders CalibrationHandshake until the operator sets scope/focus.
 * - Then renders AttentionBrief using the stored calibration answers.
 */

const SESSION_STORAGE_KEY = 'vrt3x_calibration';

const Dashboard: React.FC = () => {
  const [calibration, setCalibration] = useState<CalibrationAnswers | null>(null);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  // Hydrate from sessionStorage on mount, but never block initial render
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCalibration(parsed);
        setIsCalibrated(true);
      }
    } catch (error) {
      // Calibration load error - use defaults
    }
  }, []);

  const handleCalibrationComplete = (answers: CalibrationAnswers) => {
    setCalibration(answers);
    setIsCalibrated(true);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(answers));
    } catch (error) {
      // Calibration save error - non-critical
    }
  };

  const handleResetCalibration = () => {
    setCalibration(null);
    setIsCalibrated(false);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      // Calibration clear error - non-critical
    }
  };

  // Safe gating pattern: if not calibrated, only show the handshake
  if (!isCalibrated || !calibration) {
    return <CalibrationHandshake onComplete={handleCalibrationComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AttentionBrief calibration={calibration} />

      {/* Footer */}
      <footer className="border-t border-border px-8 py-6 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground font-vrt3x tracking-wide">
            VRT3X | Operational Integrity at Scale. Calibrated for {calibration.facilityCount}{' '}
            {calibration.facilityCount === 1 ? 'facility' : 'facilities'}.
          </p>
          <button
            onClick={handleResetCalibration}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground underline"
          >
            Reset Calibration
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;

