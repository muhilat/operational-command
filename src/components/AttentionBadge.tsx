import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Legacy Attention Badge
 *
 * NOTE: Numeric scores and getScoreCategory have been deprecated.
 * This component now accepts a qualitative intensity label directly.
 */
interface AttentionBadgeProps {
  label?: 'Low' | 'Elevated' | 'Critical';
  size?: 'sm' | 'md' | 'lg';
}

export const AttentionBadge: React.FC<AttentionBadgeProps> = ({
  label = 'Elevated',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 min-w-[48px]',
    md: 'text-sm px-2 py-1 min-w-[56px]',
    lg: 'text-base px-3 py-1.5 min-w-[64px]',
  };

  const colorMap: Record<'Low' | 'Elevated' | 'Critical', string> = {
    Low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    Elevated: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    Critical: 'bg-red-500/20 text-red-400 border-red-500/40',
  };

  const style = colorMap[label] || colorMap.Elevated;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-mono font-bold rounded-full border',
        sizeClasses[size],
        style
      )}
    >
      {label.toUpperCase()}
    </span>
  );
};
