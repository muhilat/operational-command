import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { AttentionBadge } from '@/components/AttentionBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { Sparkline } from '@/components/Sparkline';
import { facilities } from '@/data/facilityData';
import { calculateRevenueLeak, detectRevenueLeakage } from '@/lib/logic/scoring';
import { AlertTriangle, TrendingDown, Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  // Sort facilities by attention score (highest first)
  const sortedFacilities = [...facilities].sort((a, b) => b.attentionScore - a.attentionScore);

  // Calculate summary stats
  const criticalCount = facilities.filter(f => f.attentionScore >= 80).length;
  const warningCount = facilities.filter(f => f.attentionScore >= 50 && f.attentionScore < 80).length;
  const totalUncaptured = facilities.reduce((sum, f) => sum + f.uncapturedRevenue, 0);

  // Calculate Revenue Leakage Alerts (Acuity/Billing Mismatch) for all facilities
  const revenueLeakageAlerts = useMemo(() => {
    const allAlerts: Array<{ facilityId: string; facilityName: string; alert: ReturnType<typeof detectRevenueLeakage>[0] }> = [];

    facilities.forEach((facility) => {
      const alerts = detectRevenueLeakage(facility);
      alerts.forEach(alert => {
        allAlerts.push({
          facilityId: facility.id,
          facilityName: facility.name,
          alert,
        });
      });
    });

    return allAlerts.sort((a, b) => b.alert.dailyLeakage - a.alert.dailyLeakage);
  }, []);

  // Calculate Revenue Leak (PDPM Opportunity) for all facilities
  const revenueLeakAnalysis = useMemo(() => {
    let totalPDPMOpportunity = 0;
    let facilitiesWithLeak = 0;
    const facilityLeaks: Array<{ facilityId: string; facilityName: string; opportunity: number; gapPercentage: number }> = [];

    facilities.forEach((facility) => {
      // Combine all staffing records
      const allStaffingRecords = [
        ...facility.staffingDetails.rn.map(r => ({ role: 'RN' as const, scheduled: r.scheduled, actual: r.actual, period: new Date() })),
        ...facility.staffingDetails.lpn.map(r => ({ role: 'LPN' as const, scheduled: r.scheduled, actual: r.actual, period: new Date() })),
        ...facility.staffingDetails.cna.map(r => ({ role: 'CNA' as const, scheduled: r.scheduled, actual: r.actual, period: new Date() })),
      ];

      // Calculate revenue leak (using estimated census if not available)
      // For mock data, estimate census based on typical ratios (roughly 1.5-2 residents per CNA hour)
      const estimatedCensus = facility.census || Math.round(
        facility.staffingDetails.cna.reduce((sum, r) => sum + r.scheduled, 0) / 1.8
      );

      const leakResult = calculateRevenueLeak(allStaffingRecords, estimatedCensus);

      if (leakResult.detected) {
        totalPDPMOpportunity += leakResult.dailyOpportunity;
        facilitiesWithLeak++;
        facilityLeaks.push({
          facilityId: facility.id,
          facilityName: facility.name,
          opportunity: leakResult.dailyOpportunity,
          gapPercentage: leakResult.staffingGapPercentage,
        });
      }
    });

    return {
      totalPDPMOpportunity,
      facilitiesWithLeak,
      facilityLeaks: facilityLeaks.sort((a, b) => b.opportunity - a.opportunity),
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground font-vrt3x tracking-wide">VRT3X Operational Integrity</h1>
              <p className="text-sm text-muted-foreground">Midwest Region • 15 Facilities</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Monday, January 6, 2025 • 08:42 AM CST</span>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Prominent Revenue Leakage Alerts (Acuity/Billing Mismatch) */}
          {revenueLeakageAlerts.length > 0 && (
            <div className="panel border-2 border-amber-500/50 bg-amber-500/5">
              <div className="panel-body">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-amber-500/20 flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-amber-400">
                        Revenue Leakage Detected - Acuity/Billing Mismatch
                      </h3>
                      <DollarSign className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {revenueLeakageAlerts.length} {revenueLeakageAlerts.length === 1 ? 'alert' : 'alerts'} found where observed clinical acuity exceeds current billing status, indicating under-billing for NTA reimbursement.
                    </p>
                    <div className="space-y-3">
                      {revenueLeakageAlerts.slice(0, 5).map((item, index) => (
                        <div key={`${item.facilityId}-${index}`} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-foreground">{item.facilityName}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  item.alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                  item.alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                  item.alert.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-slate-500/20 text-slate-400'
                                }`}>
                                  {item.alert.severity.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-sm text-amber-400 font-medium mb-1">
                                {item.alert.alertMessage}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Observed: {item.alert.observedAcuity} → Billing: {item.alert.billingStatus}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-amber-400 font-mono">
                                ${item.alert.dailyLeakage}
                              </div>
                              <div className="text-xs text-muted-foreground">/day</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {revenueLeakageAlerts.length > 5 && (
                      <div className="mt-3 text-xs text-muted-foreground text-center">
                        +{revenueLeakageAlerts.length - 5} more {revenueLeakageAlerts.length - 5 === 1 ? 'alert' : 'alerts'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prominent PDPM Revenue Leak Alert */}
          {revenueLeakAnalysis.totalPDPMOpportunity > 0 && (
            <div className="panel border-2 border-emerald-500/50 bg-emerald-500/5">
              <div className="panel-body">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-emerald-500/20 flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-emerald-400">
                        Uncaptured PDPM Opportunity Detected
                      </h3>
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {revenueLeakAnalysis.facilitiesWithLeak} {revenueLeakAnalysis.facilitiesWithLeak === 1 ? 'facility' : 'facilities'} showing 
                      staffing gaps {'>'}10% with high census, indicating potential under-billing for care complexity.
                    </p>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Daily Opportunity</span>
                        <span className="text-3xl font-bold text-emerald-400 font-mono">
                          ${revenueLeakAnalysis.totalPDPMOpportunity.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">/day</span>
                      </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Based on $180 per resident per day when actual hours {'<'} scheduled by {'>'}10%
                          </div>
                    </div>
                    {revenueLeakAnalysis.facilityLeaks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-emerald-500/20">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                          Top Opportunities:
                        </div>
                        <div className="space-y-2">
                          {revenueLeakAnalysis.facilityLeaks.slice(0, 3).map((leak) => (
                            <div key={leak.facilityId} className="flex items-center justify-between text-sm">
                              <span className="text-foreground">{leak.facilityName}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground text-xs">
                                  {leak.gapPercentage.toFixed(1)}% gap
                                </span>
                                <span className="font-mono font-semibold text-emerald-400">
                                  ${leak.opportunity.toLocaleString()}/day
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="panel">
              <div className="panel-body">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="metric-label">Critical Attention</div>
                    <div className="metric-value text-red-400">{criticalCount}</div>
                  </div>
                  <div className="p-2 rounded bg-red-500/10">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Facilities requiring immediate review</div>
              </div>
            </div>
            
            <div className="panel">
              <div className="panel-body">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="metric-label">Elevated Attention</div>
                    <div className="metric-value text-amber-400">{warningCount}</div>
                  </div>
                  <div className="p-2 rounded bg-amber-500/10">
                    <TrendingDown className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Trending toward stress threshold</div>
              </div>
            </div>
            
            <div className="panel">
              <div className="panel-body">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="metric-label">Stable Operations</div>
                    <div className="metric-value text-slate-400">{facilities.length - criticalCount - warningCount}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-500/10">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Within operational parameters</div>
              </div>
            </div>
            
            <div className="panel">
              <div className="panel-body">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="metric-label">Uncaptured Revenue</div>
                    <div className="metric-value text-emerald-400">${(totalUncaptured / 1000).toFixed(1)}k</div>
                  </div>
                  <div className="p-2 rounded bg-emerald-500/10">
                    <span className="text-emerald-400 font-bold text-lg">$</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Daily potential across region</div>
              </div>
            </div>
          </div>

          {/* Attention Priority Table */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Attention Priority Ranking</h2>
              <span className="text-xs text-muted-foreground">Sorted by operational stress signals</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-24">Attention Priority</th>
                    <th>Facility</th>
                    <th>Primary Stress Signal</th>
                    <th className="w-32">Staffing Trend (7d)</th>
                    <th className="text-right">Uncaptured Revenue</th>
                    <th className="text-right">PDPM Opportunity</th>
                    <th>Action Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFacilities.map((facility, index) => (
                    <tr 
                      key={facility.id}
                      onClick={() => navigate(`/facility/${facility.id}`)}
                      className="cursor-pointer transition-colors hover:bg-surface-2"
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono w-4">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <AttentionBadge score={facility.attentionScore} />
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-foreground">{facility.name}</div>
                      </td>
                      <td>
                        <span className={`text-sm ${
                          facility.attentionScore >= 80 ? 'text-red-400' :
                          facility.attentionScore >= 50 ? 'text-amber-400' : 'text-muted-foreground'
                        }`}>
                          {facility.primaryStressSignal}
                        </span>
                      </td>
                      <td>
                        <Sparkline data={facility.staffingTrend} />
                      </td>
                      <td className="text-right">
                        {facility.uncapturedRevenue > 0 ? (
                          <span className="font-mono text-emerald-400 font-medium">
                            ${facility.uncapturedRevenue.toLocaleString()}/day
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        {(() => {
                          // Calculate revenue leak for this facility
                          const allStaffingRecords = [
                            ...facility.staffingDetails.rn.map(r => ({ role: 'RN' as const, scheduled: r.scheduled, actual: r.actual, period: new Date() })),
                            ...facility.staffingDetails.lpn.map(r => ({ role: 'LPN' as const, scheduled: r.scheduled, actual: r.actual, period: new Date() })),
                            ...facility.staffingDetails.cna.map(r => ({ role: 'CNA' as const, scheduled: r.scheduled, actual: r.actual, period: new Date() })),
                          ];
                          const estimatedCensus = facility.census || Math.round(
                            facility.staffingDetails.cna.reduce((sum, r) => sum + r.scheduled, 0) / 1.8
                          );
                          const leakResult = calculateRevenueLeak(allStaffingRecords, estimatedCensus);
                          
                          if (leakResult.detected) {
                            return (
                              <span className="font-mono text-emerald-400 font-semibold">
                                ${leakResult.dailyOpportunity.toLocaleString()}/day
                              </span>
                            );
                          }
                          return <span className="text-muted-foreground text-sm">—</span>;
                        })()}
                      </td>
                      <td>
                        <StatusBadge status={facility.actionStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
