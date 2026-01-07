import React from 'react';
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

const navItems = [
  { 
    title: 'Regional Overview', 
    path: '/', 
    icon: LayoutDashboard,
    description: 'Facility attention priorities'
  },
  { 
    title: 'Compliance Vault', 
    path: '/compliance', 
    icon: Shield,
    description: 'Regulatory documentation',
    disabled: true,
  },
  { 
    title: 'Revenue Opportunities', 
    path: '/revenue', 
    icon: DollarSign,
    description: 'PDPM capture analysis',
    disabled: true,
  },
  { 
    title: 'Settings', 
    path: '/settings', 
    icon: Settings,
    description: 'System configuration',
    disabled: true,
  },
];

export const AppSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <BrandLogo size="md" />
            {/* Green glowing dot - Regulatory Shield Active */}
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5">
              <div className="w-full h-full rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse"></div>
              <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-50 animate-ping"></div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-bold font-vrt3x text-sm text-foreground tracking-widest">
                VRT<span className="text-cyan-400">3</span>X
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="text-xxs text-muted-foreground uppercase tracking-wider">SNF Operations</div>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]"></div>
              <span className="text-[8px] text-muted-foreground/70 leading-none">Regulatory Shield Active</span>
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
