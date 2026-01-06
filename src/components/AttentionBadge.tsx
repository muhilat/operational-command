import React from 'react';
import { getScoreCategory } from '@/data/facilityData';
import { cn } from '@/lib/utils';

interface AttentionBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AttentionBadge: React.FC<AttentionBadgeProps> = ({
  score,
  showLabel = false,
  size = 'md',
}) => {
  const category = getScoreCategory(score);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 min-w-[32px]',
    md: 'text-sm px-2 py-1 min-w-[40px]',
    lg: 'text-base px-3 py-1.5 min-w-[48px]',
  };

  const categoryClasses = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    stable: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'font-mono font-bold rounded border text-center inline-block',
          sizeClasses[size],
          categoryClasses[category]
        )}
      >
        {score}
      </span>
      {showLabel && (
        <span className={cn(
          'text-xs uppercase tracking-wide',
          category === 'critical' && 'text-red-400',
          category === 'warning' && 'text-amber-400',
          category === 'stable' && 'text-slate-400',
        )}>
          {category}
        </span>
      )}
    </div>
  );
};
