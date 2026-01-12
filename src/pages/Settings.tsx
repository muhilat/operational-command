/**
 * Settings Page
 * 
 * Allows users to update Facility Oversight Count
 * which physically filters the Attention Brief.
 */

import React, { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { CalibrationAnswers } from '@/components/dashboard/CalibrationHandshake';

const SESSION_STORAGE_KEY = 'vrt3x_calibration';

const Settings: React.FC = () => {
  const { toast } = useToast();
  const [calibration, setCalibration] = useState<CalibrationAnswers | null>(null);
  const [facilityCount, setFacilityCount] = useState<number>(15);
  const [focusArea, setFocusArea] = useState<'staffing' | 'billing' | 'safety' | 'documentation'>('staffing');
  const [objective, setObjective] = useState<'broad' | 'narrow'>('broad');
  const [isSaving, setIsSaving] = useState(false);

  // Load current calibration
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CalibrationAnswers;
        setCalibration(parsed);
        setFacilityCount(parsed.facilityCount);
        setFocusArea(parsed.focusArea);
        setObjective(parsed.objective);
      }
    } catch (error) {
      console.error('[Settings] Error loading calibration:', error);
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const updatedCalibration: CalibrationAnswers = {
        facilityCount,
        focusArea,
        objective,
      };

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedCalibration));
      setCalibration(updatedCalibration);

      toast({
        title: 'Settings Saved',
        description: `Facility oversight count updated to ${facilityCount}. Brief will now show exactly ${facilityCount} ${facilityCount === 1 ? 'facility' : 'facilities'}.`,
      });

      // Reload page to apply changes
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('[Settings] Error saving calibration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFacilityCount(15);
    setFocusArea('staffing');
    setObjective('broad');
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#334155] px-6 py-4">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-5 h-5 text-vrt3x-accent" />
            <h1 className="text-lg font-semibold text-foreground">Settings</h1>
          </div>
        </header>

        <div className="p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Facility Oversight Count */}
            <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" />
                Facility Oversight Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="facilityCount" className="text-sm text-foreground mb-2 block">
                    Facility Oversight Count
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    This number physically filters the Attention Brief to show exactly this many facilities.
                    The Brief will display the top {facilityCount} facilities based on attention intensity.
                  </p>
                  <Input
                    id="facilityCount"
                    type="number"
                    min="1"
                    max="50"
                    value={facilityCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value) && value > 0) {
                        setFacilityCount(value);
                      }
                    }}
                    className="bg-[#1e293b] border-[#334155] text-foreground"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground mb-2 block">
                    Focus Area
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Determines which operational signals are prioritized in the Brief.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['staffing', 'billing', 'safety', 'documentation'] as const).map((area) => (
                      <button
                        key={area}
                        onClick={() => setFocusArea(area)}
                        className={cn(
                          'px-4 py-2 rounded border text-sm transition-colors',
                          focusArea === area
                            ? 'bg-[#1e293b] border-cyan-400/50 text-foreground'
                            : 'bg-[#0f172a] border-[#334155] text-muted-foreground hover:border-[#475569]'
                        )}
                      >
                        {area.charAt(0).toUpperCase() + area.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-foreground mb-2 block">
                    Detail Level
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Controls the complexity of evidence shown in facility cards.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setObjective('broad')}
                      className={cn(
                        'px-4 py-2 rounded border text-sm transition-colors',
                        objective === 'broad'
                          ? 'bg-[#1e293b] border-cyan-400/50 text-foreground'
                          : 'bg-[#0f172a] border-[#334155] text-muted-foreground hover:border-[#475569]'
                      )}
                    >
                      Broad Weekly Scan
                    </button>
                    <button
                      onClick={() => setObjective('narrow')}
                      className={cn(
                        'px-4 py-2 rounded border text-sm transition-colors',
                        objective === 'narrow'
                          ? 'bg-[#1e293b] border-cyan-400/50 text-foreground'
                          : 'bg-[#0f172a] border-[#334155] text-muted-foreground hover:border-[#475569]'
                      )}
                    >
                      Narrow Deep Dive
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-[#334155]">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-cyan-400 text-[#020617] hover:bg-cyan-400/80 font-medium"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-[#334155] text-muted-foreground hover:text-foreground"
                >
                  Reset to Defaults
                </Button>
              </div>
            </div>

            {/* Current Configuration Display */}
            {calibration && (
              <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Current Configuration</h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Facility Count: {calibration.facilityCount}</p>
                  <p>Focus: {calibration.focusArea.charAt(0).toUpperCase() + calibration.focusArea.slice(1)}</p>
                  <p>Objective: {calibration.objective === 'broad' ? 'Broad Weekly Scan' : 'Narrow Deep Dive'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;

