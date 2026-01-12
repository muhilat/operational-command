/**
 * Calibration Handshake Component
 * 
 * A minimalist sequence of three framing questions that gate system access.
 * Philosophy: System outputs are GATED behind user intent.
 * 
 * UX: Briefing assistant, not analytics software.
 */

import React, { useState, useRef, useEffect } from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CalibrationAnswers {
  facilityCount: number;
  focusArea: 'staffing' | 'billing' | 'safety' | 'documentation';
  objective: 'broad' | 'narrow';
}

interface CalibrationHandshakeProps {
  onComplete: (answers: CalibrationAnswers) => void;
}

interface FocusOption {
  id: 'staffing' | 'billing' | 'safety' | 'documentation';
  label: string;
  description: string;
}

interface ObjectiveOption {
  id: 'broad' | 'narrow';
  label: string;
  description: string;
}

const FOCUS_OPTIONS: FocusOption[] = [
  {
    id: 'staffing',
    label: 'Staffing',
    description: 'Attention signals related to staffing gaps and coverage',
  },
  {
    id: 'billing',
    label: 'Billing',
    description: 'Attention signals related to revenue capture and billing status',
  },
  {
    id: 'safety',
    label: 'Safety',
    description: 'Attention signals related to compliance and safety protocols',
  },
  {
    id: 'documentation',
    label: 'Documentation',
    description: 'Attention signals related to regulatory documentation and audit trails',
  },
];

const OBJECTIVE_OPTIONS: ObjectiveOption[] = [
  {
    id: 'broad',
    label: 'Broad weekly scan',
    description: 'Prioritize attention across all facilities with high-level signals',
  },
  {
    id: 'narrow',
    label: 'Narrow deep dive',
    description: 'Focus on specific facilities with detailed operational signals',
  },
];

export const CalibrationHandshake: React.FC<CalibrationHandshakeProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [facilityCount, setFacilityCount] = useState<number>(15);
  const [focusArea, setFocusArea] = useState<'staffing' | 'billing' | 'safety' | 'documentation' | null>(null);
  const [objective, setObjective] = useState<'broad' | 'narrow' | null>(null);
  
  // Refs for keyboard navigation
  const step2Refs = useRef<(HTMLButtonElement | null)[]>([]);
  const step3Refs = useRef<(HTMLButtonElement | null)[]>([]);

  // Keyboard navigation for Step 2
  useEffect(() => {
    if (step === 2 && step2Refs.current.length > 0) {
      const handleKeyDown = (e: KeyboardEvent) => {
        const currentIndex = FOCUS_OPTIONS.findIndex(opt => opt.id === focusArea);
        let newIndex = currentIndex;

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          newIndex = currentIndex < FOCUS_OPTIONS.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : FOCUS_OPTIONS.length - 1;
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (focusArea) {
            handleNext();
          }
        }

        if (newIndex !== currentIndex && step2Refs.current[newIndex]) {
          step2Refs.current[newIndex]?.focus();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [step, focusArea]);

  // Keyboard navigation for Step 3
  useEffect(() => {
    if (step === 3 && step3Refs.current.length > 0) {
      const handleKeyDown = (e: KeyboardEvent) => {
        const currentIndex = OBJECTIVE_OPTIONS.findIndex(opt => opt.id === objective);
        let newIndex = currentIndex;

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          newIndex = currentIndex < OBJECTIVE_OPTIONS.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : OBJECTIVE_OPTIONS.length - 1;
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (objective) {
            handleNext();
          }
        }

        if (newIndex !== currentIndex && step3Refs.current[newIndex]) {
          step3Refs.current[newIndex]?.focus();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [step, objective]);

  const handleNext = () => {
    if (step === 1) {
      if (facilityCount > 0) {
        setStep(2);
      }
    } else if (step === 2) {
      if (focusArea) {
        setStep(3);
      }
    } else if (step === 3) {
      if (objective && focusArea) {
        onComplete({
          facilityCount,
          focusArea,
          objective,
        });
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const canProceed = () => {
    if (step === 1) return facilityCount > 0;
    if (step === 2) return focusArea !== null;
    if (step === 3) return objective !== null;
    return false;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Centered Logo */}
      <div className="mb-12 flex flex-col items-center">
        <BrandLogo size="lg" showText={true} />
        <div className="mt-4 text-sm text-muted-foreground font-vrt3x tracking-wide">
          Operational Integrity at Scale
        </div>
      </div>

      {/* Question Container */}
      <div className="w-full max-w-2xl space-y-8">
        {/* Step 1: Facility Count */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="facility-count" className="text-base font-medium text-foreground">
                How many facilities are you overseeing this week?
              </Label>
              <p className="text-sm text-muted-foreground">
                This helps prioritize attention signals across your portfolio.
              </p>
            </div>
            <Input
              id="facility-count"
              type="number"
              min="1"
              max="100"
              value={facilityCount}
              onChange={(e) => setFacilityCount(parseInt(e.target.value) || 1)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && facilityCount > 0) {
                  handleNext();
                }
              }}
              className="text-lg font-mono"
              autoFocus
              aria-label="Number of facilities"
            />
          </div>
        )}

        {/* Step 2: Focus Area - Card Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-medium text-foreground">
                Where does leadership attention feel most stretched right now?
              </Label>
              <p className="text-sm text-muted-foreground">
                Select the primary operational pressure point.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label="Focus area selection">
              {FOCUS_OPTIONS.map((option, index) => {
                const isSelected = focusArea === option.id;
                return (
                  <button
                    key={option.id}
                    ref={(el) => {
                      step2Refs.current[index] = el;
                    }}
                    type="button"
                    onClick={() => setFocusArea(option.id)}
                    className={cn(
                      "relative p-4 text-left border-2 rounded-lg transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-background",
                      isSelected
                        ? "border-cyan-400 bg-cyan-500/10"
                        : "border-border bg-surface-1 hover:border-cyan-400/50 hover:bg-surface-2"
                    )}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Select ${option.label}`}
                    tabIndex={index === 0 ? 0 : -1}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-medium text-foreground">
                            {option.label}
                          </span>
                          {isSelected && (
                            <Check className="w-5 h-5 text-cyan-400" aria-hidden="true" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {focusArea && (
              <div className="pt-2 text-sm text-cyan-400 font-medium">
                This frames this week's attention priorities.
              </div>
            )}
          </div>
        )}

        {/* Step 3: Objective - Binary Options */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-medium text-foreground">
                What level of detail do you need?
              </Label>
              <p className="text-sm text-muted-foreground">
                Choose how attention signals are prioritized and presented.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label="Objective selection">
              {OBJECTIVE_OPTIONS.map((option, index) => {
                const isSelected = objective === option.id;
                return (
                  <button
                    key={option.id}
                    ref={(el) => {
                      step3Refs.current[index] = el;
                    }}
                    type="button"
                    onClick={() => setObjective(option.id)}
                    className={cn(
                      "relative p-4 text-left border-2 rounded-lg transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-background",
                      isSelected
                        ? "border-cyan-400 bg-cyan-500/10"
                        : "border-border bg-surface-1 hover:border-cyan-400/50 hover:bg-surface-2"
                    )}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Select ${option.label}`}
                    tabIndex={index === 0 ? 0 : -1}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-medium text-foreground">
                            {option.label}
                          </span>
                          {isSelected && (
                            <Check className="w-5 h-5 text-cyan-400" aria-hidden="true" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="text-muted-foreground"
            aria-label="Go back to previous step"
          >
            Back
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Step {step} of 3</span>
          </div>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="font-vrt3x tracking-wide"
            aria-label={step === 3 ? 'Begin briefing' : 'Continue to next step'}
          >
            {step === 3 ? 'Begin Briefing' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
