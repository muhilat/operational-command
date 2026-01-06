import React from 'react';
import { FacilityData, getActionStatusLabel } from '@/data/facilityData';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: FacilityData['actionStatus'];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusStyles: Record<FacilityData['actionStatus'], string> = {
    'defense-memo-needed': 'bg-red-500/15 text-red-400 border-red-500/30',
    'escalated': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    'under-review': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'audit-ready': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium',
        statusStyles[status]
      )}
    >
      {getActionStatusLabel(status)}
    </span>
  );
};
