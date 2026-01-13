/**
 * Attention Brief Component
 * 
 * Narrative-based output replacing data-dense tables.
 * Philosophy: Prioritize Narrative over Metrics. Briefing, not analytics.
 * 
 * Audit-Driven Refactor:
 * - Causal constraints: Facility count limits cards, focus filters content, detail level changes complexity
 * - No false authority: Qualitative intensity labels, system observations only
 * - Standardized financials: Only uncaptured revenue, diminished font
 * - Localized uncertainty: Per-card last_sync, visual decay for stale data
 * - Reading room aesthetic: Spark indicators, high-contrast typography
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBriefingContext } from '@/context/BriefingContext';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, ChevronRight, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCardState, getCardStateStyles } from '@/lib/utils/cardState';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import type { CalibrationAnswers } from './CalibrationHandshake';

interface AttentionBriefProps {
  calibration: CalibrationAnswers;
}

export const AttentionBrief: React.FC<AttentionBriefProps> = ({ calibration }) => {
  const navigate = useNavigate();
  const { facilities: canonicalFacilities } = useBriefingContext();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Filter and rank facilities based on calibration constraints - SSoT from context
  const attentionItems = useMemo(() => {
    // CAUSAL CONSTRAINT 1: Filter by focus area using canonical data
    const filtered = canonicalFacilities.filter((facility) => {
      if (calibration.focusArea === 'staffing' && facility.stressCategory !== 'staffing') {
        return false;
      }
      if (calibration.focusArea === 'billing' && facility.stressCategory !== 'acuity') {
        return false;
      }
      if (calibration.focusArea === 'safety' && facility.stressCategory !== 'compliance') {
        return false;
      }
      if (calibration.focusArea === 'documentation' && facility.stressCategory !== 'communication') {
        return false;
      }
      return true;
    });

    // Sort by intensity (Critical > Elevated > Low), then by revenue delta
    const intensityOrder = { Critical: 3, Elevated: 2, Low: 1 };
    const sorted = filtered.sort((a, b) => {
      if (intensityOrder[a.intensity] !== intensityOrder[b.intensity]) {
        return intensityOrder[b.intensity] - intensityOrder[a.intensity];
      }
      return b.revenueDelta - a.revenueDelta;
    });

    // CAUSAL CONSTRAINT 2: Limit to EXACTLY facilityCount cards (not approximate)
    return sorted.slice(0, calibration.facilityCount);
  }, [canonicalFacilities, calibration]);

  const toggleCard = (facilityId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(facilityId)) {
      newExpanded.delete(facilityId);
    } else {
      newExpanded.add(facilityId);
    }
    setExpandedCards(newExpanded);
  };

  // Standardized stale threshold: 4 hours (matches cardState logic)
  const isDataStale = (lastSync: Date): boolean => {
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    return hoursSinceSync > 4; // Consistent 4-hour threshold across all views
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-vrt3x font-semibold tracking-wide text-foreground mb-2">
                Attention Brief
              </h1>
              <p className="text-sm text-muted-foreground">
                {calibration.objective === 'broad' ? 'Broad Weekly Scan' : 'Narrow Deep Dive'} • 
                Focus: {calibration.focusArea.charAt(0).toUpperCase() + calibration.focusArea.slice(1)} • 
                {attentionItems.length} {attentionItems.length === 1 ? 'facility' : 'facilities'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Brief Content - Reading Room Aesthetic */}
      <main className="max-w-4xl mx-auto px-8 py-12">
        <div className="space-y-6">
          {attentionItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg mb-2">No attention items found</p>
              <p className="text-sm">Try adjusting your calibration settings.</p>
            </div>
          ) : (
            attentionItems.map((item) => {
              const isExpanded = expandedCards.has(item.id);
              const stale = isDataStale(item.syncTimestamp);
              const showEvidence = calibration.objective === 'narrow' || isExpanded; // CAUSAL CONSTRAINT 3: Detail level controls complexity
              
              // Determine if this item is in scope based on focus area
              const isInScope = true; // Already filtered above
              const isSelectedFocus = calibration.focusArea === item.stressCategory;
              const isCriticalSignal = item.intensity === 'Critical';
              
              // Get card state using semantic dimming logic
              const cardState = getCardState(
                isInScope,
                isSelectedFocus,
                isCriticalSignal,
                item.syncTimestamp, // SSoT: Use canonical sync timestamp
                4 // 4 hour stale threshold
              );
              const stateStyles = getCardStateStyles(cardState);
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "border rounded-lg transition-all",
                    cardState === 'ACTIVE' && "border-[#334155] bg-[#020617]",
                    cardState === 'SECONDARY' && "border-[#334155] bg-[#020617]",
                    cardState === 'AMBER' && "border-[#d97706] bg-[#0f172a]"
                  )}
                  style={{ 
                    opacity: stateStyles.opacity,
                    boxShadow: stateStyles.boxShadow || 'none'
                  }}
                >
                  <div className="p-6">
                    {/* Headline Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 
                            className="text-lg font-semibold"
                            style={{ color: stateStyles.textColor }}
                          >
                            {item.headline}
                          </h2>
                          <span className={cn(
                            "text-xs font-mono px-2 py-0.5 rounded border",
                            item.intensity === 'Critical' && "bg-[#1e293b] text-red-400 border-red-500/50",
                            item.intensity === 'Elevated' && "bg-[#1e293b] text-amber-400 border-amber-500/50",
                            item.intensity === 'Low' && "bg-[#1e293b] text-slate-400 border-slate-500/50"
                          )}>
                            {item.intensity}
                          </span>
                          {stateStyles.showSyncBadge && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0f172a] text-[#fbbf24] border border-[#d97706] flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" />
                              Sync Required
                            </span>
                          )}
                        </div>
                        <p 
                          className="text-sm leading-relaxed"
                          style={{ color: stateStyles.textColor }}
                        >
                          {item.observation}
                        </p>
                      </div>
                    </div>

                    {/* Last Sync Timestamp - Localized Uncertainty (SSoT) */}
                    <div 
                      className="flex items-center gap-2 text-xs mb-4 pt-2 border-t"
                      style={{ 
                        color: stateStyles.textColor,
                        borderColor: stateStyles.borderColor 
                      }}
                    >
                      <Clock className="w-3 h-3" />
                      <span>Last sync: {formatDistanceToNow(item.syncTimestamp, { addSuffix: true })}</span>
                      {stale && (
                        <span className="text-[#fbbf24] ml-2">• Attention Degraded</span>
                      )}
                    </div>

                    {/* Evidence Payload - Only shown in 'Dive' mode or when expanded */}
                    {showEvidence && (
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                        {item.evidence?.staffingGap !== undefined && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Staffing gap: </span>
                            <span className="font-mono">{item.evidence.staffingGap > 0 ? '-' : '+'}{Math.abs(item.evidence.staffingGap)} hrs</span>
                            {item.evidence.trendDelta && (
                              <span className="text-muted-foreground ml-2">• Trend: {item.evidence.trendDelta}</span>
                            )}
                          </div>
                        )}
                        {item.evidence?.acuityMismatch && (
                          <div className="text-sm text-muted-foreground">
                            Acuity mismatch: {item.rawData.revenueDetails.observedAcuity} → {item.rawData.revenueDetails.billingStatus}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Uncaptured Revenue - Standardized, Diminished Font (SSoT, dimmed to Slate-500) */}
                    {item.revenueDelta > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs uppercase tracking-wide" style={{ color: '#64748B' }}>Uncaptured Revenue</span>
                          <span className="text-sm font-mono" style={{ color: '#64748B' }}>
                            ${item.revenueDelta.toLocaleString()}/day
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Expand/Collapse for 'Scan' mode */}
                    {calibration.objective === 'broad' && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                            onClick={() => toggleCard(item.id)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? 'Hide Evidence' : 'View Evidence'}
                          <ChevronRight className={cn("w-3.5 h-3.5 ml-2 transition-transform", isExpanded && "rotate-90")} />
                        </Button>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-6 pt-4 border-t border-border/50">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/facility/${item.id}`)}
                            className="w-full justify-between"
                          >
                            <span>View Facility Details</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Legal Disclaimer */}
        <LegalDisclaimer />
      </main>
    </div>
  );
};
