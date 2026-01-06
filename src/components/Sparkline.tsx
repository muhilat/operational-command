import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 96,
  height = 24,
  className = '',
}) => {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Determine color based on trend (last value vs first)
  const trend = data[data.length - 1] - data[0];
  const strokeColor = trend < -0.1 ? 'rgb(239, 68, 68)' : trend < 0 ? 'rgb(251, 191, 36)' : 'rgb(74, 222, 128)';
  const fillColor = trend < -0.1 ? 'rgba(239, 68, 68, 0.1)' : trend < 0 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(74, 222, 128, 0.1)';

  // Create fill path
  const fillPoints = [
    `${padding},${padding + chartHeight}`,
    ...data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return `${x},${y}`;
    }),
    `${padding + chartWidth},${padding + chartHeight}`,
  ].join(' ');

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Fill area */}
      <polygon
        points={fillPoints}
        fill={fillColor}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={padding + chartWidth}
        cy={padding + chartHeight - ((data[data.length - 1] - min) / range) * chartHeight}
        r={2}
        fill={strokeColor}
      />
    </svg>
  );
};
