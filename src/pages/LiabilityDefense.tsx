/**
 * Liability Defense Page
 * 
 * Displays all mitigation events (defense memos) from the database.
 * Shows Facility Name, Observation Type, Date, and UUID (Integrity Hash).
 * Allows downloading hashed PDFs from Supabase storage.
 * 
 * REFACTORED: Uses BriefingContext as Single Source of Truth.
 * Removed direct Supabase queries - data flows through context.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { Shield, Download, ArrowLeft, FileText, Calendar, Hash, Loader2, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabaseService } from '@/lib/services/supabase';
import { useBriefingContext } from '@/context/BriefingContext';
import { AmberStateFallback } from '@/components/AmberStateFallback';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { generateMemo, fetchMemoHistory } from '@/lib/api/generateMemo';
import type { MitigationEvent } from '@/types/snf';
import { formatDistanceToNow } from 'date-fns';
import { isDataStale } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const LiabilityDefense: React.FC = () => {
  const navigate = useNavigate();
  const { facilities: canonicalFacilities } = useBriefingContext();
  const [mitigationEvents, setMitigationEvents] = useState<MitigationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [isGeneratingMemo, setIsGeneratingMemo] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  // Load memo history from database
  useEffect(() => {
    let mounted = true;

    async function loadMemoHistory() {
      try {
        if (mounted) {
          setIsLoading(true);
        }

        // Try to fetch from Supabase
        const memos = await fetchMemoHistory(50);

        if (!mounted) return; // Component unmounted, don't update state

        if (memos && memos.length > 0) {
          // Convert database memos to MitigationEvent format
          const events: MitigationEvent[] = memos.map((memo: any) => ({
            id: memo.id,
            facilityId: memo.facility_id,
            userId: memo.created_by || 'system',
            type: 'defense-memo',
            actionTaken: `Defense memo generated with hash ${memo.hash.substring(0, 8)}...`,
            evidencePayload: {
              observations: memo.observations,
              hash: memo.hash,
              pdfStoragePath: null, // Will be added when PDF is generated
            },
            timestamp: new Date(memo.created_at),
          }));

          setMitigationEvents(events);
        } else {
          // Fallback to localStorage if no database memos
          const stored = localStorage.getItem('mitigation_events') || '[]';
          const events = JSON.parse(stored).map((event: any) => ({
            ...event,
            timestamp: event.timestamp instanceof Date
              ? event.timestamp
              : new Date(event.timestamp),
          }));
          setMitigationEvents(events);
        }
      } catch (error) {
        console.error('[LiabilityDefense] Error loading memo history:', error);
        
        if (!mounted) return; // Component unmounted, don't update state

        // Fallback to localStorage
        try {
          const stored = localStorage.getItem('mitigation_events') || '[]';
          const events = JSON.parse(stored).map((event: any) => ({
            ...event,
            timestamp: event.timestamp instanceof Date
              ? event.timestamp
              : new Date(event.timestamp),
          }));
          setMitigationEvents(events);
        } catch (err) {
          setMitigationEvents([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadMemoHistory();

    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

  // Get facility name from canonical facilities (defensive with optional chaining)
  const getFacilityName = (facilityId: string): string => {
    const facility = canonicalFacilities?.find(f => f?.id === facilityId);
    return facility?.name ?? facilityId;
  };

  // Check if data is stale or missing (defensive guard)
  const isDataDegraded = useMemo(() => {
    if (!canonicalFacilities || canonicalFacilities.length === 0) {
      return true; // No facilities = degraded
    }
    
    // Check if any facility has stale sync (>6 hours)
    const hasStaleData = canonicalFacilities.some(facility => {
      if (!facility?.syncTimestamp) return true;
      return isDataStale(facility.syncTimestamp);
    });
    
    return hasStaleData;
  }, [canonicalFacilities]);

  // Format observation type (Signal Type)
  const formatObservationType = (type: MitigationEvent['type']): string => {
    const typeMap: Record<MitigationEvent['type'], string> = {
      'agency-call': 'Agency Call Signal',
      'float-pool-offer': 'Float Pool Signal',
      'don-notification': 'DON Notification Signal',
      'defense-memo': 'Defense Memo Signal',
      'other': 'Other Signal',
    };
    return typeMap[type] || type;
  };

  // Generate new memo
  const handleGenerateMemo = async () => {
    if (!selectedFacilityId) return;

    const facility = canonicalFacilities?.find(f => f?.id === selectedFacilityId);
    if (!facility) {
      alert('Facility not found');
      return;
    }

    setIsGeneratingMemo(true);
    try {
      const memo = await generateMemo(facility);
      
      // Show success message
      alert(`✅ Memo generated successfully!\n\nHash: ${memo.hash.substring(0, 16)}...\n\nMemo ID: ${memo.id.substring(0, 8)}...`);
      
      // Refresh memo history
      const updatedMemos = await fetchMemoHistory(50);
      if (updatedMemos && updatedMemos.length > 0) {
        const events: MitigationEvent[] = updatedMemos.map((m: any) => ({
          id: m.id,
          facilityId: m.facility_id,
          userId: m.created_by || 'system',
          type: 'defense-memo',
          actionTaken: `Defense memo generated with hash ${m.hash.substring(0, 8)}...`,
          evidencePayload: {
            observations: m.observations,
            hash: m.hash,
            pdfStoragePath: null,
          },
          timestamp: new Date(m.created_at),
        }));
        setMitigationEvents(events);
      }
      
      setShowGenerateDialog(false);
      setSelectedFacilityId(null);
    } catch (error) {
      console.error('[LiabilityDefense] Error generating memo:', error);
      alert(`❌ Failed to generate memo: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`);
    } finally {
      setIsGeneratingMemo(false);
    }
  };

  // Download PDF (defensive with optional chaining)
  const handleDownloadPDF = async (event: MitigationEvent | null | undefined) => {
    // Defensive guard: Check if event exists
    if (!event?.id) {
      alert('PDF not available. Event data is missing.');
      return;
    }

    const storagePath = (event?.evidencePayload as any)?.pdfStoragePath;
    
    // Defensive guard: Check if storage path exists
    if (!storagePath) {
      alert('PDF not available. Storage path not found.');
      return;
    }

    try {
      const eventId = event.id ?? 'unknown';
      setDownloadingIds(prev => new Set(prev).add(eventId));
      
      // In production, this would download from Supabase Storage
      // For now, use the service (which is mocked) with defensive access
      const pdfBlob = await supabaseService?.downloadPDF?.(storagePath);
      
      if (pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VRT3X-Defense-Memo-${eventId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Development fallback: Show alert
        alert(`PDF download requested for: ${storagePath}\n\nIn production, this would download from Supabase Storage.`);
      }
    } catch (error) {
      console.error('[LiabilityDefense] Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    } finally {
      const eventId = event?.id ?? 'unknown';
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  // Defensive guard: Show AMBER fallback if data is degraded
  if (isDataDegraded || !canonicalFacilities || canonicalFacilities.length === 0) {
    return (
      <div className="flex min-h-screen w-full bg-[#020617]">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <AmberStateFallback
              title="Attention Degraded"
              message="Sync Required. Facility data is missing or stale. Please refresh or check system sync status."
              actionLabel="Refresh Data"
              onAction={() => window.location.reload()}
              showRefresh={true}
            />
          </div>
        </main>
      </div>
    );
  }

  // Defensive guard: Show AMBER loader if loading
  if (isLoading) {
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
              <Shield className="w-5 h-5 text-[#fbbf24]" />
              <h1 className="text-lg font-semibold text-white font-mono">Liability Defense</h1>
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
            {/* Generate New Memo Section */}
            <div className="mb-6 bg-[#0f172a] border border-[#334155] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white font-mono mb-1">
                    Generate New Memo
                  </h2>
                  <p className="text-sm text-[#94a3b8] font-mono">
                    Create a defense memo with SHA-256 hash for audit trail
                  </p>
                </div>
                <Button
                  onClick={() => setShowGenerateDialog(true)}
                  className="bg-[#1e293b] border border-[#d97706] text-[#fbbf24] hover:bg-[#334155] hover:border-[#fbbf24] font-mono"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Memo
                </Button>
              </div>
            </div>

            {/* Memo History Section */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white font-mono mb-2">
                Memo History
              </h2>
            </div>

            {mitigationEvents.length === 0 ? (
              // Empty state
              <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-12 text-center">
                <Shield className="w-16 h-16 text-[#64748b] mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white font-mono mb-2">
                  Current State: Active Surveillance
                </h2>
                <p className="text-sm text-[#94a3b8] font-mono mb-4">
                  No critical deviations observed in last sync.
                </p>
                <p className="text-xs text-[#64748b] font-mono">
                  System monitoring operational signals. State observations will appear here when detected.
                </p>
              </div>
            ) : (
              // List of mitigation events
              <div className="space-y-4">
                <div className="text-sm text-[#94a3b8] font-mono mb-4">
                  {mitigationEvents.length} {mitigationEvents.length === 1 ? 'event' : 'events'} logged
                </div>
                
                {mitigationEvents.map((event) => {
                  // Defensive guards: Safe access with optional chaining
                  const facilityId = event?.facilityId ?? 'unknown';
                  const facilityName = getFacilityName(facilityId);
                  const isDownloading = downloadingIds?.has(event?.id ?? '') ?? false;
                  const eventId = event?.id ?? 'unknown';
                  
                  // Check if event data is stale
                  const eventTimestamp = event?.timestamp ? new Date(event.timestamp) : null;
                  const isEventStale = eventTimestamp ? isDataStale(eventTimestamp) : true;
                  
                  return (
                    <div
                      key={eventId}
                      className={`
                        bg-[#0f172a] border rounded-lg p-6 transition-colors
                        ${isEventStale 
                          ? 'border-[#f59e0b] shadow-[0_0_0_2px_rgba(245,158,11,0.2)]' 
                          : 'border-[#334155] hover:border-[#475569]'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Event Details */}
                        <div className="flex-1 space-y-3">
                          {/* Facility Name */}
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#fbbf24]" />
                            <span className="font-semibold text-white font-mono">{facilityName}</span>
                          </div>

                          {/* Observation Type */}
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-[#94a3b8]" />
                            <span className="text-sm text-[#94a3b8] font-mono">
                              {formatObservationType(event.type)}
                            </span>
                          </div>

                          {/* Date */}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#94a3b8]" />
                            <span className="text-sm text-[#94a3b8] font-mono">
                              <span>Observed {formatDistanceToNow(event.timestamp, { addSuffix: true })}</span>
                              <span className="text-[#64748b] mx-2">•</span>
                              <span>{new Date(event.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}</span>
                            </span>
                          </div>

                          {/* UUID (Integrity Hash) - Defensive */}
                          {eventId && (
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-[#fbbf24]" />
                              <span className="text-xs text-[#fbbf24] font-mono break-all">
                                {eventId}
                              </span>
                            </div>
                          )}

                          {/* Stale Data Warning */}
                          {isEventStale && (
                            <div className="mt-2">
                              <AmberStateFallback
                                title="Event Data Stale"
                                message="This mitigation event's data is older than 6 hours. Verification suggested."
                                className="p-3 text-sm"
                                showRefresh={false}
                              />
                            </div>
                          )}

                          {/* Action Taken Preview */}
                          {event.actionTaken && (
                            <div className="mt-3 pt-3 border-t border-[#334155]">
                              <p className="text-xs text-[#64748b] uppercase tracking-wide mb-1 font-mono">
                                Action Taken
                              </p>
                              <p className="text-sm text-[#94a3b8] line-clamp-2">
                                {event.actionTaken}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Right: Download Button */}
                        <div className="flex-shrink-0">
                          <Button
                            onClick={() => handleDownloadPDF(event)}
                            disabled={isDownloading}
                            className="bg-[#1e293b] border border-[#d97706] text-[#fbbf24] hover:bg-[#334155] hover:border-[#fbbf24] font-mono text-sm"
                          >
                            {isDownloading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                              </>
                            )}
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

      {/* Generate Memo Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="bg-[#0f172a] border-[#334155] text-white">
          <DialogHeader>
            <DialogTitle className="font-mono text-white">Generate Defense Memo</DialogTitle>
            <DialogDescription className="text-[#94a3b8] font-mono">
              Select a facility to generate a defense memo with SHA-256 hash for audit trail.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-[#94a3b8] font-mono mb-2 block">
                Select Facility
              </label>
              <select
                value={selectedFacilityId || ''}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] text-white rounded px-4 py-2 font-mono text-sm focus:outline-none focus:border-[#475569]"
              >
                <option value="">Choose a facility...</option>
                {canonicalFacilities?.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedFacilityId && (
              <div className="p-3 bg-[#1e293b] border border-[#334155] rounded text-sm text-[#94a3b8] font-mono">
                <p className="mb-1">
                  <strong className="text-white">Facility:</strong> {canonicalFacilities?.find(f => f.id === selectedFacilityId)?.name}
                </p>
                <p className="mb-1">
                  <strong className="text-white">Intensity:</strong> {canonicalFacilities?.find(f => f.id === selectedFacilityId)?.intensity}
                </p>
                <p>
                  <strong className="text-white">Observation:</strong> {canonicalFacilities?.find(f => f.id === selectedFacilityId)?.stateObservation}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGenerateDialog(false);
                setSelectedFacilityId(null);
              }}
              className="border-[#334155] text-white hover:bg-[#1e293b] font-mono"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateMemo}
              disabled={!selectedFacilityId || isGeneratingMemo}
              className="bg-[#1e293b] border border-[#d97706] text-[#fbbf24] hover:bg-[#334155] hover:border-[#fbbf24] font-mono"
            >
              {isGeneratingMemo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Generate & Hash Memo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiabilityDefense;

