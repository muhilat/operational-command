import React from 'react';
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
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FacilityDrillDown: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  
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
            
            <button className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded border font-medium text-sm transition-colors",
              scoreCategory === 'critical' 
                ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                : "bg-surface-3 border-border text-foreground hover:bg-surface-2"
            )}>
              <FileText className="w-4 h-4" />
              Generate Good Faith Defense Memo
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* Three Column Grid */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Column 1: Staffing Stress */}
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="panel-title">72-Hour Staffing Reality</h2>
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

            {/* Column 2: Acuity vs Revenue */}
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h2 className="panel-title">PDPM Capture Opportunity</h2>
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

            {/* Column 3: Defensibility Status */}
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <h2 className="panel-title">Regulatory Audit Readiness</h2>
                </div>
              </div>
              <div className="panel-body space-y-4">
                {/* Checklist */}
                <div className="space-y-2">
                  <div className={cn(
                    "flex items-center gap-3 p-2.5 rounded border",
                    facility.defensibility.agencyCallsDocumented 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : "bg-red-500/5 border-red-500/20"
                  )}>
                    {facility.defensibility.agencyCallsDocumented ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm">Agency call logs documented</span>
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-3 p-2.5 rounded border",
                    facility.defensibility.floatPoolOffered 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : "bg-red-500/5 border-red-500/20"
                  )}>
                    {facility.defensibility.floatPoolOffered ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm">Internal float pool offered</span>
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-3 p-2.5 rounded border",
                    facility.defensibility.donNotified 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : "bg-red-500/5 border-red-500/20"
                  )}>
                    {facility.defensibility.donNotified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm">DON notified of staffing gap</span>
                  </div>
                </div>

                {/* Last Memo */}
                <div className="bg-surface-2 rounded p-3">
                  <div className="text-xxs text-muted-foreground uppercase mb-1">Last Defense Memo</div>
                  <div className="text-sm font-medium">
                    {facility.defensibility.lastMemoDate || 'None on record'}
                  </div>
                </div>

                {/* Action Button */}
                <button className="action-serious w-full justify-center">
                  <FileText className="w-4 h-4" />
                  View Historical Defense Memos
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FacilityDrillDown;
