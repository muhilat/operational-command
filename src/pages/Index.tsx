import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { AttentionBadge } from '@/components/AttentionBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { Sparkline } from '@/components/Sparkline';
import { facilities } from '@/data/facilityData';
import { AlertTriangle, TrendingDown, Clock } from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  // Sort facilities by attention score (highest first)
  const sortedFacilities = [...facilities].sort((a, b) => b.attentionScore - a.attentionScore);

  // Calculate summary stats
  const criticalCount = facilities.filter(f => f.attentionScore >= 80).length;
  const warningCount = facilities.filter(f => f.attentionScore >= 50 && f.attentionScore < 80).length;
  const totalUncaptured = facilities.reduce((sum, f) => sum + f.uncapturedRevenue, 0);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Regional Command Center</h1>
              <p className="text-sm text-muted-foreground">Midwest Region • 15 Facilities</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Monday, January 6, 2025 • 08:42 AM CST</span>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
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
