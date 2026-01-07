import React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: { logo: 'w-6 h-6', text: 'text-xs' },
  md: { logo: 'w-8 h-8', text: 'text-sm' },
  lg: { logo: 'w-12 h-12', text: 'text-lg' },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  className,
  showText = false 
}) => {
  const sizes = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Metallic Triangle Logo */}
      <div className={cn('flex-shrink-0', sizes.logo)}>
        <svg 
          viewBox="0 0 64 64" 
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#cbd5e1', stopOpacity:1}} />
              <stop offset="50%" style={{stopColor:'#94a3b8', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#64748b', stopOpacity:1}} />
            </linearGradient>
            <filter id="metallicGlow">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Interlocking Triangle - Valknut style */}
          <g filter="url(#metallicGlow)">
            {/* Top-left band */}
            <path 
              d="M32 8 L8 32 L32 56 L32 40 L16 32 Z" 
              fill="url(#metallicGradient)" 
              stroke="#e2e8f0" 
              strokeWidth="0.5"
              opacity="0.95"
            />
            {/* Top-right band */}
            <path 
              d="M32 8 L56 32 L32 56 L32 40 L48 32 Z" 
              fill="url(#metallicGradient)" 
              stroke="#e2e8f0" 
              strokeWidth="0.5"
              opacity="0.95"
            />
            {/* Bottom horizontal band */}
            <path 
              d="M16 32 L32 56 L48 32 L32 40 Z" 
              fill="url(#metallicGradient)" 
              stroke="#e2e8f0" 
              strokeWidth="0.5"
              opacity="0.95"
            />
          </g>
        </svg>
      </div>
      
      {showText && (
        <span className={cn('font-mono font-bold tracking-widest text-foreground', sizes.text)}>
          VRT<span className="text-cyan-400">3</span>X
        </span>
      )}
    </div>
  );
};

