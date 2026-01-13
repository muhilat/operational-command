/**
 * Revenue Integrity Page
 * 
 * Displays facilities with revenue integrity signals.
 * Filters by revenue signals, sorts by Uncaptured Revenue (highest first).
 * Shows Amber border for facilities with billing sync > 4 hours old.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { DollarSign, ArrowLeft, TrendingUp, Clock, Loader2, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBriefingContext } from '@/context/BriefingContext';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { formatDistanceToNow } from 'date-fns';
import { getStaffingGap } from '@/lib/utils/defensiveGuards';
import { isDataStale, getLastSyncTimestamp, isWaitingForSync } from '@/lib/api';

const RevenueIntegrity: React.FC = () => {
  const navigate = useNavigate();
  const { facilities: canonicalFacilities } = useBriefingContext();
  const [isLoading] = useState(false); // Context loads synchronously

  // Filter facilities with revenue integrity signals
  // Revenue signals = facilities with revenueDelta > 0 OR acuity mismatch
  const revenueFacilities = useMemo(() => {
    return canonicalFacilities
      .filter(facility => {
        // Filter: Revenue delta > 0 OR acuity mismatch detected
        const hasRevenueDelta = (facility.revenueDelta ?? 0) > 0;
        const hasAcuityMismatch = facility.evidence?.acuityMismatch === true;
        return hasRevenueDelta || hasAcuityMismatch;
      })
      .map(facility => {
        // Calculate Capture Gap: Compare Staffing Acuity (from Sucker) to Billing Status
        const staffingAcuity = facility.rawData.revenueDetails?.observedAcuity || 'STANDARD';
        const billingStatus = facility.rawData.revenueDetails?.billingStatus || 'STANDARD';
        
        // Capture Gap = difference between observed (from staffing) and billed
        const acuityLevels = { 'LOW': 1, 'STANDARD': 2, 'HIGH': 3, 'CRITICAL': 4 };
        const staffingLevel = acuityLevels[staffingAcuity as keyof typeof acuityLevels] || 2;
        const billingLevel = acuityLevels[billingStatus as keyof typeof acuityLevels] || 2;
        const captureGap = staffingLevel - billingLevel; // Positive = under-billing
        
        // Check if waiting for Sucker sync
        const waitingForSync = isWaitingForSync(facility.id);
        
        return {
          ...facility,
          captureGap,
          staffingAcuity,
          billingStatus,
          waitingForSync,
        };
      })
      .sort((a, b) => {
        // Sort by Uncaptured Revenue (highest first)
        const revenueA = a.revenueDelta ?? 0;
        const revenueB = b.revenueDelta ?? 0;
        return revenueB - revenueA;
      });
  }, [canonicalFacilities]);

  // Check if billing sync is stale (> 6 hours) - Defensive Guard
  const isBillingSyncStale = (facilityId: string, syncTimestamp: Date): boolean => {
    // Check both context sync timestamp and API last sync
    const apiLastSync = getLastSyncTimestamp(facilityId);
    const mostRecentSync = apiLastSync && apiLastSync > syncTimestamp ? apiLastSync : syncTimestamp;
    return isDataStale(mostRecentSync);
  };

  // Defensive guard: Show AMBER loader if context is loading
  if (isLoading || canonicalFacilities.length === 0) {
    return (
      <div className="flex min-h-screen w-full bg-[#020617]">
        <AppSidebar />
        <main className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 text-[#fbbf24] mb-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-mono text-sm">Calibrating Intelligence...</span>
            </div>
            <div className="w-32 h-1 bg-[#0f172a] rounded-full overflow-hidden border border-[#d97706]">
              <div className="h-full bg-[#fbbf24] animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[#020617]">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#334155] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h1 className="text-lg font-semibold text-white font-mono">Revenue Integrity</h1>
            </div>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="border-[#334155] text-white hover:bg-[#1e293b] font-mono text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Brief
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            {revenueFacilities.length === 0 ? (
              // Empty state
              <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-12 text-center">
                <TrendingUp className="w-16 h-16 text-[#64748b] mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white font-mono mb-2">
                  No revenue integrity signals detected
                </h2>
                <p className="text-sm text-[#94a3b8] font-mono">
                  All facilities show aligned billing status.
                </p>
              </div>
            ) : (
              // List of revenue facilities
              <div className="space-y-4">
                <div className="text-sm text-[#94a3b8] font-mono mb-4">
                  {revenueFacilities.length} {revenueFacilities.length === 1 ? 'facility' : 'facilities'} with revenue signals
                </div>
                
                {revenueFacilities.map((facility) => {
                  const isStale = isBillingSyncStale(facility.id, facility.syncTimestamp);
                  const revenueDelta = facility.revenueDelta ?? 0;
                  const captureGap = (facility as any).captureGap || 0;
                  const waitingForSync = (facility as any).waitingForSync || false;
                  
                  // Defensive guard: Safe access to staffing gap
                  const staffingGap = getStaffingGap(
                    facility.rawData.staffingDetails?.rn?.[0]?.scheduled,
                    facility.rawData.staffingDetails?.rn?.[0]?.actual
                  );
                  
                  // Confidence level styling
                  const confidenceColor = facility.confidence === 'Low' ? '#f59e0b' : facility.confidence === 'Med' ? '#fbbf24' : '#10b981';
                  
                  return (
                    <div
                      key={facility.id}
                      className={`
                        bg-[#0f172a] border-2 rounded-lg p-6 transition-colors
                        ${isStale 
                          ? 'border-[#fbbf24] shadow-[0_0_0_2px_rgba(251,191,36,0.2)]' 
                          : captureGap > 0
                          ? 'border-[#f59e0b] shadow-[0_0_0_1px_rgba(245,158,11,0.1)]'
                          : 'border-[#334155] hover:border-[#475569]'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Facility Details */}
                        <div className="flex-1 space-y-3">
                          {/* Facility Name & Intensity */}
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-white font-mono text-base">
                              {facility.name}
                            </h3>
                            <span className={`
                              text-xs font-mono px-2 py-0.5 rounded border
                              ${facility.intensity === 'Critical' 
                                ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                                : facility.intensity === 'Elevated'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              }
                            `}>
                              {facility.intensity.toUpperCase()}
                            </span>
                            {waitingForSync && (
                              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0f172a] text-[#f59e0b] border border-[#d97706] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Waiting for System Sync
                              </span>
                            )}
                            {isStale && !waitingForSync && (
                              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0f172a] text-[#fbbf24] border border-[#d97706] flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Sync Required
                              </span>
                            )}
                            {/* Confidence Badge */}
                            <span 
                              className="text-xs font-mono px-2 py-0.5 rounded bg-[#0f172a] border flex items-center gap-1"
                              style={{ 
                                color: confidenceColor, 
                                borderColor: confidenceColor,
                                opacity: facility.confidence === 'Low' ? 1 : 0.7
                              }}
                            >
                              <Eye className="w-3 h-3" />
                              {facility.confidence} Confidence
                            </span>
                          </div>

                          {/* System Observation */}
                          <div className="text-sm text-[#94a3b8] font-mono">
                            {facility.observation}
                          </div>

                          {/* State Observation */}
                          {facility.stateObservation && (
                            <div className="mt-4 pt-4 border-t border-[#334155]">
                              <div className="text-xs text-[#64748b] uppercase tracking-wide mb-2 font-mono flex items-center gap-2">
                                <Eye className="w-3 h-3" />
                                State Observation
                              </div>
                              <p className="text-sm text-[#cbd5e1] leading-relaxed">
                                {facility.stateObservation}
                              </p>
                              <div className="mt-2 text-xs text-[#64748b] font-mono">
                                Observed {formatDistanceToNow(facility.syncTimestamp, { addSuffix: true })}
                              </div>
                            </div>
                          )}

                          {/* Identified Capture Opportunities */}
                          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#334155]">
                            {/* Uncaptured Revenue / Day */}
                            <div>
                              <div className="text-xs text-[#64748b] uppercase tracking-wide mb-1 font-mono">
                                Identified Opportunity
                              </div>
                              <div className="text-lg font-bold text-emerald-400 font-mono">
                                ${revenueDelta.toLocaleString()}/day
                              </div>
                            </div>

                            {/* Capture Gap: Staffing Acuity vs Billing Status */}
                            {captureGap > 0 && (
                              <div>
                                <div className="text-xs text-[#64748b] uppercase tracking-wide mb-1 font-mono">
                                  Capture Gap
                                </div>
                                <div className="text-lg font-bold text-amber-400 font-mono">
                                  {(facility as any).staffingAcuity} → {(facility as any).billingStatus}
                                </div>
                                <div className="text-xs text-[#fbbf24] mt-1 font-mono">
                                  Under-billing detected
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Evidence Details */}
                          {facility.evidence.acuityMismatch && (
                            <div className="mt-3 pt-3 border-t border-[#334155]">
                              <div className="flex items-center gap-2 text-xs text-[#fbbf24] font-mono">
                                <AlertCircle className="w-3 h-3" />
                                <span>Acuity mismatch detected</span>
                              </div>
                            </div>
                          )}

                          {/* Last Sync */}
                          <div className="flex items-center gap-2 text-xs text-[#64748b] font-mono mt-2">
                            <Clock className="w-3 h-3" />
                            <span>Last sync: {formatDistanceToNow(facility.syncTimestamp, { addSuffix: true })}</span>
                          </div>
                        </div>

                        {/* Right: View Details Button */}
                        <div className="flex-shrink-0">
                          <Button
                            onClick={() => navigate(`/facility/${facility.id}`)}
                            className="bg-[#1e293b] border border-emerald-400/50 text-emerald-400 hover:bg-[#334155] hover:border-emerald-400 font-mono text-sm"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legal Disclaimer */}
            <LegalDisclaimer />
          </div>
        </div>
      </main>
    </div>
  );
};

export default RevenueIntegrity;

