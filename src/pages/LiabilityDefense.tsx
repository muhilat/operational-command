/**
 * Liability Defense Page
 * 
 * Displays all mitigation events (defense memos) from the database.
 * Shows Facility Name, Observation Type, Date, and UUID (Integrity Hash).
 * Allows downloading hashed PDFs from Supabase storage.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { Shield, Download, ArrowLeft, FileText, Calendar, Hash, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabaseService } from '@/lib/services/supabase';
import { useBriefingContext } from '@/context/BriefingContext';
import type { MitigationEvent } from '@/types/snf';
import { formatDistanceToNow } from 'date-fns';

const LiabilityDefense: React.FC = () => {
  const navigate = useNavigate();
  const { facilities: canonicalFacilities } = useBriefingContext();
  const [mitigationEvents, setMitigationEvents] = useState<MitigationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  // Load all mitigation events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const events = await supabaseService.getAllMitigationEvents();
        setMitigationEvents(events);
      } catch (error) {
        console.error('[LiabilityDefense] Error loading mitigation events:', error);
        setMitigationEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Get facility name from canonical facilities
  const getFacilityName = (facilityId: string): string => {
    const facility = canonicalFacilities.find(f => f.id === facilityId);
    return facility?.name || facilityId;
  };

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

  // Download PDF
  const handleDownloadPDF = async (event: MitigationEvent) => {
    const storagePath = (event.evidencePayload as any)?.pdfStoragePath;
    
    if (!storagePath) {
      alert('PDF not available. Storage path not found.');
      return;
    }

    try {
      setDownloadingIds(prev => new Set(prev).add(event.id));
      
      // In production, this would download from Supabase Storage
      const pdfBlob = await supabaseService.downloadPDF(storagePath);
      
      if (pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VRT3X-Defense-Memo-${event.id}.pdf`;
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
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(event.id);
        return newSet;
      });
    }
  };

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
                  const facilityName = getFacilityName(event.facilityId);
                  const isDownloading = downloadingIds.has(event.id);
                  
                  return (
                    <div
                      key={event.id}
                      className="bg-[#0f172a] border border-[#334155] rounded-lg p-6 hover:border-[#475569] transition-colors"
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

                          {/* UUID (Integrity Hash) */}
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-[#fbbf24]" />
                            <span className="text-xs text-[#fbbf24] font-mono break-all">
                              {event.id}
                            </span>
                          </div>

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
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiabilityDefense;

