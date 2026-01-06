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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground tracking-tight">TraceLayer</div>
            <div className="text-xxs text-muted-foreground uppercase tracking-wider">SNF Operations</div>
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
