import React, { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { useBriefingContext } from '@/context/BriefingContext';
import { getCardState, getCardStateStyles } from '@/lib/utils/cardState';
import type { CalibrationAnswers } from '@/components/dashboard/CalibrationHandshake';
import { 
  ArrowLeft, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Circle,
  Clock,
  TrendingUp,
  Shield,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabaseService } from '@/lib/services/supabase';
import { useToast } from '@/hooks/use-toast';
import { createHashedMemo } from '@/lib/utils/generateMemo';

const FacilityDrillDown: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { facilities: canonicalFacilities } = useBriefingContext();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Get canonical facility from SSoT context
  const canonicalFacility = useMemo(() => {
    return canonicalFacilities.find(f => f.id === facilityId);
  }, [canonicalFacilities, facilityId]);
  
  // Load calibration to determine causal logic
  const [calibration, setCalibration] = useState<CalibrationAnswers | null>(null);
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('vrt3x_calibration');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCalibration(parsed);
      }
    } catch (error) {
      // Ignore
    }
  }, []);
  
  if (!canonicalFacility) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground mb-2">Facility Not Found</h1>
            <button 
              onClick={() => navigate('/')}
              className="action-serious"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Overview
            </button>
          </div>
        </main>
      </div>
    );
  }

  // SSoT: Use canonical data (no local calculations)
  const facility = canonicalFacility.rawData;
  const intensity = canonicalFacility.intensity;
  const observation = canonicalFacility.observation;
  const lastSync = canonicalFacility.syncTimestamp; // SSoT: Single source of truth
  const revenueDelta = canonicalFacility.revenueDelta; // SSoT: Standardized $250/day calculation
  const isDataStale = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60) > 4; // 4 hour threshold
  
  // Causal Hierarchy: If Focus = 'Staffing', Node 1 is visually primary
  const isStaffingFocus = calibration?.focusArea === 'staffing';
  const isCriticalSignal = intensity === 'Critical';
  
  // Get card state for Node 1 (Capture/Staffing) - NEVER mute if it's the selected focus
  const node1State = getCardState(
    true, // Always in scope for drilldown
    isStaffingFocus, // Selected focus - makes Node 1 visually primary
    isCriticalSignal, // Critical signal
    lastSync,
    4
  );
  const node1Styles = getCardStateStyles(node1State);
  
  // Get card state for Node 2 and Node 3 (always in scope for drilldown, but may be AMBER if stale)
  const node2State = getCardState(true, false, false, lastSync, 4);
  const node2Styles = getCardStateStyles(node2State);
  const node3State = getCardState(true, false, false, lastSync, 4);
  const node3Styles = getCardStateStyles(node3State);

  const acuityColors = {
    LOW: 'text-slate-400',
    STANDARD: 'text-slate-300',
    HIGH: 'text-amber-400',
    CRITICAL: 'text-red-400',
  };

  /**
   * Handle "Generate Defense Memo" button click
   * Opens dialog to collect "Action Taken" input
   */
  const handleGenerateMemo = () => {
    setIsDialogOpen(true);
    setActionTaken('');
  };

  /**
   * Create hashed defense memo with database handshake
   * 
   * This implements "The Shield" - every operational failure is
   * be paired with documented mitigation efforts.
   * 
   * Workflow:
   * 1. Insert mitigation_event into database (get UUID)
   * 2. Generate PDF with UUID footer
   * 3. Upload PDF to Supabase Storage 'defense-vault'
   * 4. Link PDF to mitigation_event record
   */
  const handleCreateMitigationEvent = async () => {
    if (!actionTaken.trim()) {
      toast({
        title: 'Action Required',
        description: 'Please describe the action taken before generating the memo.',
        variant: 'destructive',
      });
      return;
    }

    if (!canonicalFacility) {
      toast({
        title: 'Error',
        description: 'Facility data not available.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get current user ID (in production, this would come from auth context)
      const userId = 'current-user-id'; // TODO: Replace with actual auth

      // Use the new hashed memo workflow
      const result = await createHashedMemo({
        userId,
        facility: canonicalFacility,
        actionTaken: actionTaken.trim(),
        evidencePayload: {
          facilityName: canonicalFacility.name,
          intensity: canonicalFacility.intensity,
          stressCategory: canonicalFacility.stressCategory,
          headline: canonicalFacility.headline,
          observation: canonicalFacility.observation,
          evidence: canonicalFacility.evidence,
        },
      });

      // Download PDF automatically
      const url = URL.createObjectURL(result.pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `VRT3X-Defense-Memo-${result.mitigationEvent.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Defense Memo Generated',
        description: `Audit Reference: ${result.mitigationEvent.auditReferenceId}. PDF saved to defense-vault.`,
      });

      setIsDialogOpen(false);
      setActionTaken('');
    } catch (error) {
      console.error('❌ FacilityDrillDown: Error creating hashed memo:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create defense memo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#334155] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2 rounded hover:bg-surface-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold text-foreground">{facility.name}</h1>
                  <span className={cn(
                    "text-xs font-mono px-2 py-0.5 rounded border",
                    intensity === 'Critical' && "bg-[#1e293b] text-red-400 border-red-500/50",
                    intensity === 'Elevated' && "bg-[#1e293b] text-amber-400 border-amber-500/50",
                    intensity === 'Low' && "bg-[#1e293b] text-slate-400 border-slate-500/50"
                  )}>
                    {intensity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {observation} {/* SSoT: Use canonical observation, not raw data */}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  <span>Last sync: {formatDistanceToNow(lastSync, { addSuffix: true })}</span>
                  {isDataStale && (
                    <span className="text-[#fbbf24] ml-2">• Attention Degraded</span>
                  )}
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleGenerateMemo}
              className={cn(
                "font-mono text-sm tracking-wide border-2",
                intensity === 'Critical' 
                  ? "bg-[#1e293b] border-red-500/50 text-red-400 hover:bg-[#334155] hover:border-red-500/70"
                  : "bg-[#1e293b] border-vrt3x-accent/50 text-vrt3x-accent hover:bg-[#334155] hover:border-vrt3x-accent/70"
              )}
            >
              <Shield className="w-4 h-4 mr-2" />
              <span className="font-vrt3x">VRT3X</span> Defense Protocol
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* VRT3X Three-Pillar Architecture */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Node 1: Capture (The Sucker) - Live staffing stream */}
            {/* Causal Hierarchy: If Focus = 'Staffing', Node 1 is visually primary (enhanced border) */}
            <div 
              className={cn(
                "panel",
                node1State === 'ACTIVE' && isStaffingFocus && "border-cyan-400 border-2", // Enhanced border for visual priority
                node1State === 'ACTIVE' && !isStaffingFocus && "border-cyan-400/50",
                node1State === 'AMBER' && "border-[#d97706]"
              )}
              style={{ 
                backgroundColor: node1Styles.backgroundColor,
                borderColor: node1State === 'ACTIVE' ? (isStaffingFocus ? '#22d3ee' : '#22d3ee80') : node1Styles.borderColor,
                opacity: node1Styles.opacity,
                boxShadow: node1Styles.boxShadow || (isStaffingFocus ? '0 0 0 2px rgba(34, 211, 238, 0.2)' : 'none') // Subtle glow for priority
              }}
            >
              <div className={cn(
                "panel-header",
                node1State === 'ACTIVE' && "border-cyan-400/50",
                node1State === 'AMBER' && "border-[#d97706]"
              )}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]"></div>
                  <h2 
                    className="panel-title"
                    style={{ color: node1Styles.textColor }}
                  >
                    Node 1: Capture
                  </h2>
                  <span 
                    className="text-xs font-mono"
                    style={{ color: node1Styles.textColor, opacity: 0.7 }}
                  >
                    (The Sucker)
                  </span>
                  {node1Styles.showSyncBadge && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0f172a] text-[#fbbf24] border border-[#d97706] ml-2 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Sync Required
                    </span>
                  )}
                </div>
              </div>
              <div className="panel-body space-y-4">
                {/* Spark Indicators - Text Deltas, Not Charts */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#1e293b] rounded border border-[#334155]">
                    <span className="text-sm text-muted-foreground">RN Trend</span>
                    <span className="font-mono text-sm">
                      {(() => {
                        const rnGap = facility.staffingDetails.rn[0]?.scheduled - facility.staffingDetails.rn[0]?.actual || 0;
                        return rnGap > 0 ? `↓ -${rnGap}h` : rnGap < 0 ? `↑ +${Math.abs(rnGap)}h` : '→ stable';
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1e293b] rounded border border-[#334155]">
                    <span className="text-sm text-muted-foreground">LPN Trend</span>
                    <span className="font-mono text-sm">
                      {(() => {
                        const lpnGap = facility.staffingDetails.lpn[0]?.scheduled - facility.staffingDetails.lpn[0]?.actual || 0;
                        return lpnGap > 0 ? `↓ -${lpnGap}h` : lpnGap < 0 ? `↑ +${Math.abs(lpnGap)}h` : '→ stable';
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1e293b] rounded border border-[#334155]">
                    <span className="text-sm text-muted-foreground">CNA Trend</span>
                    <span className="font-mono text-sm">
                      {(() => {
                        const cnaGap = facility.staffingDetails.cna[0]?.scheduled - facility.staffingDetails.cna[0]?.actual || 0;
                        return cnaGap > 0 ? `↓ -${cnaGap}h` : cnaGap < 0 ? `↑ +${Math.abs(cnaGap)}h` : '→ stable';
                      })()}
                    </span>
                  </div>
                </div>
                
                {/* Alerts */}
                {facility.staffingDetails.alerts.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    {facility.staffingDetails.alerts.map((alert, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-2 p-2 rounded bg-[#1e293b] border border-red-500/50"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-red-400">{alert}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Node 2: Defense (The Shield) - Good Faith Effort documentation */}
            <div 
              className={cn(
                "panel",
                node2State === 'ACTIVE' && "border-amber-400/50",
                node2State === 'AMBER' && "border-[#d97706]"
              )}
              style={{ 
                backgroundColor: node2Styles.backgroundColor,
                borderColor: node2State === 'ACTIVE' ? '#f59e0b' : node2Styles.borderColor,
                opacity: node2Styles.opacity,
                boxShadow: node2Styles.boxShadow || 'none'
              }}
            >
              <div className={cn(
                "panel-header",
                node2State === 'ACTIVE' && "border-amber-400/50",
                node2State === 'AMBER' && "border-[#d97706]"
              )}>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: node2Styles.textColor }} />
                  <h2 className="panel-title" style={{ color: node2Styles.textColor }}>Node 2: Defense</h2>
                  <span className="text-xs font-mono" style={{ color: node2Styles.textColor, opacity: 0.7 }}>(The Shield)</span>
                  {node2Styles.showSyncBadge && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0f172a] text-[#fbbf24] border border-[#d97706] ml-2 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Sync Required
                    </span>
                  )}
                </div>
              </div>
              <div className="panel-body space-y-4">
                {/* Node 2 Focus: Clinical Documentation Gaps */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1e293b] rounded p-3 border border-[#334155]">
                    <div className="text-xxs text-muted-foreground uppercase mb-1">Observed Clinical Acuity</div>
                    <div className={cn("font-mono font-bold text-lg", acuityColors[facility.revenueDetails.observedAcuity])}>
                      {facility.revenueDetails.observedAcuity}
                    </div>
                  </div>
                  <div className="bg-[#1e293b] rounded p-3 border border-[#334155]">
                    <div className="text-xxs text-muted-foreground uppercase mb-1">Documented Acuity Level</div>
                    <div className={cn("font-mono font-bold text-lg", acuityColors[facility.revenueDetails.billingStatus])}>
                      {facility.revenueDetails.billingStatus}
                    </div>
                  </div>
                </div>

                {/* System Observation - Clinical Documentation Focus */}
                <div className="p-3 bg-[#1e293b] rounded border-l-2 border-amber-400/50 border border-[#334155]">
                  <div className="text-xxs text-muted-foreground uppercase mb-1">System Observation</div>
                  <div className="text-sm text-foreground">
                    {facility.revenueDetails.observedAcuity !== facility.revenueDetails.billingStatus
                      ? `Observation: Clinical documentation gap detected. Observed clinical acuity (${facility.revenueDetails.observedAcuity}) differs from documented acuity level (${facility.revenueDetails.billingStatus}).`
                      : 'Observation: Clinical documentation aligns with observed acuity levels.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Node 3: Profit (The Bridge) - Billing Code Integrity */}
            <div 
              className={cn(
                "panel",
                node3State === 'ACTIVE' && "border-emerald-400/50",
                node3State === 'AMBER' && "border-[#d97706]"
              )}
              style={{ 
                backgroundColor: node3Styles.backgroundColor,
                borderColor: node3State === 'ACTIVE' ? '#10b981' : node3Styles.borderColor,
                opacity: node3Styles.opacity,
                boxShadow: node3Styles.boxShadow || 'none'
              }}
            >
              <div className={cn(
                "panel-header",
                node3State === 'ACTIVE' && "border-emerald-400/50",
                node3State === 'AMBER' && "border-[#d97706]"
              )}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: node3Styles.textColor }} />
                  <h2 className="panel-title" style={{ color: node3Styles.textColor }}>Node 3: Profit</h2>
                  <span className="text-xs font-mono" style={{ color: node3Styles.textColor, opacity: 0.7 }}>(The Bridge)</span>
                  {node3Styles.showSyncBadge && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0f172a] text-[#fbbf24] border border-[#d97706] ml-2 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Sync Required
                    </span>
                  )}
                </div>
              </div>
              <div className="panel-body space-y-4">
                {/* Node 3 Focus: Billing Code Integrity */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1e293b] rounded p-3 border border-[#334155]">
                    <div className="text-xxs text-muted-foreground uppercase mb-1">Current Billing Code</div>
                    <div className={cn("font-mono font-bold text-lg", acuityColors[facility.revenueDetails.billingStatus])}>
                      {facility.revenueDetails.billingStatus}
                    </div>
                  </div>
                  <div className="bg-[#1e293b] rounded p-3 border border-[#334155]">
                    <div className="text-xxs text-muted-foreground uppercase mb-1">Billing Alignment</div>
                    <div className={cn(
                      "font-mono font-bold text-lg",
                      facility.revenueDetails.observedAcuity === facility.revenueDetails.billingStatus 
                        ? "text-emerald-400" 
                        : "text-amber-400"
                    )}>
                      {facility.revenueDetails.observedAcuity === facility.revenueDetails.billingStatus ? 'Aligned' : 'Mismatch'}
                    </div>
                  </div>
                </div>

                {/* Revenue Delta - Dimmed to Slate-500 (SSoT) */}
                {revenueDelta > 0 && (
                  <div className="bg-[#1e293b] border border-[#334155] rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm" style={{ color: '#64748B' }}>Uncaptured Revenue</span>
                      <span className="font-mono text-sm" style={{ color: '#64748B' }}>
                        ${revenueDelta.toLocaleString()}/day
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: '#64748B' }}>
                      Estimated NTA reimbursement potential
                    </div>
                  </div>
                )}

                {/* System Observation - Billing Code Integrity Focus (No Recommendations) */}
                <div className="p-3 bg-[#1e293b] rounded border-l-2 border-emerald-400/50 border border-[#334155]">
                  <div className="text-xxs text-muted-foreground uppercase mb-1">System Observation</div>
                  <div className="text-sm text-foreground">
                    {facility.revenueDetails.observedAcuity !== facility.revenueDetails.billingStatus
                      ? `Observation: Billing code integrity discrepancy. Current billing code (${facility.revenueDetails.billingStatus}) does not match observed acuity (${facility.revenueDetails.observedAcuity}).`
                      : 'Observation: Billing code integrity verified. Current billing code aligns with observed acuity.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mitigation Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-vrt3x tracking-wide">VRT3X Defense Protocol</DialogTitle>
            <DialogDescription>
              Document the mitigation actions taken. This creates an audit trail
              and generates a defense memo with VRT3X Integrity Layer verification.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="action-taken">
                Action Taken <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="action-taken"
                placeholder="Describe the mitigation actions taken (e.g., 'Called 3 staffing agencies, offered float pool position, notified DON of staffing gap')"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be specific and include dates, times, and outcomes where applicable.
              </p>
            </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-400">
                  <strong>VRT3X Integrity Layer:</strong> This action will be recorded in the
                  mitigation_events table before the PDF is generated. The system origin
                  and integrity hash will be included in the PDF footer.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMitigationEvent}
              disabled={isGenerating || !actionTaken.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  <span className="font-vrt3x">Execute Defense Protocol</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacilityDrillDown;
