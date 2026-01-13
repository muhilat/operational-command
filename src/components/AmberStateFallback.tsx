/**
 * AmberStateFallback Component
 * 
 * Displays an Amber state fallback when data is missing or stale.
 * Follows VRT3X design system: Amber/Gold (#F59E0B) for degraded states.
 */

import React from 'react';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AmberStateFallbackProps {
  /** Title of the fallback state */
  title?: string;
  /** Description message */
  message?: string;
  /** Optional action button text */
  actionLabel?: string;
  /** Optional action handler */
  onAction?: () => void;
  /** Additional className for styling */
  className?: string;
  /** Show refresh icon */
  showRefresh?: boolean;
}

export const AmberStateFallback: React.FC<AmberStateFallbackProps> = ({
  title = 'Attention Degraded',
  message = 'Sync Required. Data processing error detected.',
  actionLabel,
  onAction,
  className,
  showRefresh = true,
}) => {
  return (
    <div
      className={cn(
        'bg-[#0f172a] border-2 border-[#f59e0b] rounded-lg p-6',
        'shadow-[0_0_0_2px_rgba(245,158,11,0.2)]',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#f59e0b]/20 flex items-center justify-center">
            {showRefresh ? (
              <RefreshCw className="w-5 h-5 text-[#f59e0b] animate-spin" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#f59e0b]" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[#f59e0b] font-mono mb-1">
            {title}
          </h3>
          <p className="text-sm text-[#cbd5e1] font-mono leading-relaxed">
            {message}
          </p>

          {/* Action Button */}
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="mt-4 px-4 py-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded text-sm text-[#f59e0b] font-mono hover:bg-[#f59e0b]/20 transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="mt-4 pt-4 border-t border-[#f59e0b]/20 flex items-center gap-2 text-xs text-[#f59e0b]/70 font-mono">
        <Clock className="w-3 h-3" />
        <span>Last checked: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

