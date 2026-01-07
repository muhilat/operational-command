import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { AttentionBadge } from '@/components/AttentionBadge';
import { StaffingChart } from '@/components/StaffingChart';
import { getFacilityById, getScoreCategory } from '@/data/facilityData';
import { 
  ArrowLeft, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Circle,
  Clock,
  TrendingUp,
  Shield,
  Loader2
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

const FacilityDrillDown: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const facility = getFacilityById(facilityId || '');
  
  if (!facility) {
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

  const scoreCategory = getScoreCategory(facility.attentionScore);
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
   * Create mitigation event and generate PDF
   * This implements "The Shield" - every operational failure must
   * be paired with documented mitigation efforts.
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

    setIsGenerating(true);

    try {
      // Get current user ID (in production, this would come from auth context)
      const userId = 'current-user-id'; // TODO: Replace with actual auth

      // Create mitigation event in database FIRST
      const mitigationEvent = await supabaseService.createMitigationEvent(
        userId,
        facility.id,
        'defense-memo',
        actionTaken.trim(),
        {
          facilityName: facility.name,
          attentionScore: facility.attentionScore,
          primaryStressSignal: facility.primaryStressSignal,
          timestamp: new Date().toISOString(),
        },
        facility.incidentSignals && facility.incidentSignals.length > 0 
          ? facility.incidentSignals[0].id 
          : undefined
      );

      // Generate PDF with audit reference ID
      await generateDefenseMemoPDF(mitigationEvent.auditReferenceId!);

      toast({
        title: 'Defense Memo Generated',
        description: `Audit Reference: ${mitigationEvent.auditReferenceId}`,
      });

      setIsDialogOpen(false);
      setActionTaken('');
    } catch (error) {
      console.error('Error creating mitigation event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create mitigation event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Generate PDF with audit reference ID in footer
   * In production, this would use a PDF generation library like jsPDF or pdfkit
   */
  const generateDefenseMemoPDF = async (auditReferenceId: string): Promise<void> => {
    // Mock PDF generation - in production, use actual PDF library
    const pdfContent = {
      facility: facility.name,
      date: new Date().toLocaleDateString(),
      attentionScore: facility.attentionScore,
      primarySignal: facility.primaryStressSignal,
      actionTaken: actionTaken,
      auditReferenceId: auditReferenceId,
    };

    console.log('[PDF] Generating defense memo:', pdfContent);

    // Simulate PDF generation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, this would:
    // 1. Create PDF document
    // 2. Add content
    // 3. Add footer with audit reference ID
    // 4. Download or open PDF

    // For now, just log the audit reference
    console.log(`[PDF] System Origin: VRT3X Integrity Layer. This record is a verified operational defense log. [ID: ${auditReferenceId}]`);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
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
                  <AttentionBadge score={facility.attentionScore} showLabel />
                </div>
                <p className="text-sm text-muted-foreground">
                  Primary Signal: {facility.primaryStressSignal}
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleGenerateMemo}
              className={cn(
                "font-mono text-sm tracking-wide border-2",
                scoreCategory === 'critical' 
                  ? "bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500/70"
                  : "bg-vrt3x-accent/10 border-vrt3x-accent/50 text-vrt3x-accent hover:bg-vrt3x-accent/20 hover:border-vrt3x-accent/70"
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
            <div className="panel border-cyan-400/20">
              <div className="panel-header border-cyan-400/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]"></div>
                  <h2 className="panel-title">Node 1: Capture</h2>
                  <span className="text-xs text-cyan-400/70 font-mono">(The Sucker)</span>
                </div>
              </div>
              <div className="panel-body space-y-4">
                <StaffingChart 
                  rn={facility.staffingDetails.rn}
                  lpn={facility.staffingDetails.lpn}
                  cna={facility.staffingDetails.cna}
                />
                
                {/* Alerts */}
                {facility.staffingDetails.alerts.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    {facility.staffingDetails.alerts.map((alert, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/20"
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
            <div className="panel border-amber-400/20">
              <div className="panel-header border-amber-400/30">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <h2 className="panel-title">Node 2: Defense</h2>
                  <span className="text-xs text-amber-400/70 font-mono">(The Shield)</span>
                </div>
              </div>
              <div className="panel-body space-y-4">
                {/* Acuity Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-2 rounded p-3">
                    <div className="text-xxs text-muted-foreground uppercase mb-1">Observed Clinical Acuity</div>
                    <div className={cn("font-mono font-bold text-lg", acuityColors[facility.revenueDetails.observedAcuity])}>
                      {facility.revenueDetails.observedAcuity}
                    </div>
                  </div>
                  <div className="bg-surface-2 rounded p-3">
                    <div className="text-xxs text-muted-foreground uppercase mb-1">Current Billing Status</div>
                    <div className={cn("font-mono font-bold text-lg", acuityColors[facility.revenueDetails.billingStatus])}>
                      {facility.revenueDetails.billingStatus}
                    </div>
                  </div>
                </div>

                {/* Mismatch Indicator */}
                {facility.revenueDetails.dailyMismatch > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Daily Capture Gap</span>
                      <span className="font-mono font-bold text-2xl text-emerald-400">
                        ${facility.revenueDetails.dailyMismatch.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Estimated NTA reimbursement potential
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                <div className="p-3 bg-surface-2 rounded border-l-2 border-primary">
                  <div className="text-xxs text-muted-foreground uppercase mb-1">Recommendation</div>
                  <div className="text-sm text-foreground">{facility.revenueDetails.recommendation}</div>
                </div>
              </div>
            </div>

            {/* Node 3: Profit (The Bridge) - PDPM Revenue Audit */}
            <div className="panel border-emerald-400/20">
              <div className="panel-header border-emerald-400/30">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h2 className="panel-title">Node 3: Profit</h2>
                  <span className="text-xs text-emerald-400/70 font-mono">(The Bridge)</span>
                </div>
              </div>
              <div className="panel-body space-y-4">
                {/* PDPM Revenue Audit */}
                {/* Acuity Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-2 rounded p-3">
                    <div className="text-xxs text-muted-foreground uppercase mb-1">Observed Clinical Acuity</div>
                    <div className={cn("font-mono font-bold text-lg", acuityColors[facility.revenueDetails.observedAcuity])}>
                      {facility.revenueDetails.observedAcuity}
                    </div>
                  </div>
                  <div className="bg-surface-2 rounded p-3">
                    <div className="text-xxs text-muted-foreground uppercase mb-1">Current Billing Status</div>
                    <div className={cn("font-mono font-bold text-lg", acuityColors[facility.revenueDetails.billingStatus])}>
                      {facility.revenueDetails.billingStatus}
                    </div>
                  </div>
                </div>

                {/* Mismatch Indicator */}
                {facility.revenueDetails.dailyMismatch > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Daily Capture Gap</span>
                      <span className="font-mono font-bold text-2xl text-emerald-400">
                        ${facility.revenueDetails.dailyMismatch.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Estimated NTA reimbursement potential
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                <div className="p-3 bg-surface-2 rounded border-l-2 border-emerald-400/50">
                  <div className="text-xxs text-muted-foreground uppercase mb-1">Recommendation</div>
                  <div className="text-sm text-foreground">{facility.revenueDetails.recommendation}</div>
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
