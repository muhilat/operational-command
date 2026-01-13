import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Shield, 
  DollarSign, 
  Settings,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useBriefingContext } from '@/context/BriefingContext';
import { formatDistanceToNow } from 'date-fns';
import type { CalibrationAnswers } from '@/components/dashboard/CalibrationHandshake';

const SESSION_STORAGE_KEY = 'vrt3x_calibration';

const navItems = [
  { 
    title: 'Regional Overview', 
    path: '/', 
    icon: LayoutDashboard,
    description: 'Facility attention priorities'
  },
  { 
    title: 'Liability Defense', 
    path: '/liability-defense', 
    icon: Shield,
    description: 'Regulatory documentation',
  },
  { 
    title: 'Revenue Integrity', 
    path: '/revenue-integrity', 
    icon: DollarSign,
    description: 'PDPM capture analysis',
  },
  { 
    title: 'Settings', 
    path: '/settings', 
    icon: Settings,
    description: 'System configuration',
    disabled: false,
  },
];

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { facilities: canonicalFacilities } = useBriefingContext();
  const [calibration, setCalibration] = useState<CalibrationAnswers | null>(null);

  // Load calibration to apply causal styling
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCalibration(parsed);
      }
    } catch (error) {
      // Ignore errors
    }
  }, []);

  // SSoT: Get most recent sync timestamp from canonical facilities
  const mostRecentSync = useMemo(() => {
    if (canonicalFacilities.length === 0) return null;
    const timestamps = canonicalFacilities.map(f => f.syncTimestamp.getTime());
    const mostRecent = new Date(Math.max(...timestamps));
    return mostRecent;
  }, [canonicalFacilities]);

  // Calculate sync status from most recent facility sync
  const syncStatus = useMemo(() => {
    if (!mostRecentSync) {
      return {
        timeAgo: 'Never',
        statusColor: 'amber' as const,
        isCaptureGap: true,
      };
    }
    
    const hoursSinceSync = (Date.now() - mostRecentSync.getTime()) / (1000 * 60 * 60);
    const isCaptureGap = hoursSinceSync > 4; // 4 hour threshold
    
    return {
      timeAgo: formatDistanceToNow(mostRecentSync, { addSuffix: true }),
      statusColor: (isCaptureGap ? 'amber' : 'green') as 'amber' | 'green',
      isCaptureGap,
    };
  }, [mostRecentSync]);

  return (
    <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <BrandLogo size="md" />
            {/* Sync Status Pulse Light */}
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5">
              <div className={`w-full h-full rounded-full ${
                syncStatus.statusColor === 'green' 
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' 
                  : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
              } animate-pulse`}></div>
              {syncStatus.statusColor === 'green' && (
                <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-50 animate-ping"></div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-bold font-vrt3x text-sm tracking-widest" style={{ color: '#FFFFFF', opacity: 1 }}>
                VRT<span className="text-cyan-400" style={{ opacity: 1 }}>3</span>X
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="text-xxs text-muted-foreground uppercase tracking-wider">SNF Operations</div>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[8px] leading-none ${
                syncStatus.statusColor === 'green' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                Last Sync: {syncStatus.timeAgo}
              </span>
              {syncStatus.isCaptureGap && (
                <span className="text-[8px] text-amber-400">• Gap</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            // Causal logic: If focus is 'staffing', make revenue link secondary
            const isSecondary = 
              item.path === '/revenue' && 
              calibration?.focusArea === 'staffing';
            
            if (item.disabled) {
              return (
                <li key={item.path}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded text-sm',
                      'text-muted-foreground/50 cursor-not-allowed'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </div>
                </li>
              );
            }

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : isSecondary
                      ? 'text-muted-foreground/60 hover:bg-sidebar-accent/30 hover:text-muted-foreground/80'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xxs text-muted-foreground">
          <div className="flex items-center justify-between mb-1">
            <span>Data Sync</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Live
            </span>
          </div>
          <div className="text-muted-foreground/60">Last update: 2 min ago</div>
        </div>
      </div>
    </aside>
  );
};
