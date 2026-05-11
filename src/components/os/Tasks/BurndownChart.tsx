"use client";

import { useMemo } from "react";

export interface BurndownChartProps {
  ideal: number[];
  actual: number[];
  labels: string[];
  width?: number;
  height?: number;
}

export function BurndownChart({ ideal, actual, labels, width = 600, height = 200 }: BurndownChartProps) {
  const maxPoints = Math.max(...ideal, ...actual, 10);
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const stepX = chartWidth / Math.max(ideal.length - 1, 1);
  
  const getCoordinates = (points: number[]) => {
    return points.map((val, i) => {
      const x = padding + i * stepX;
      const y = padding + chartHeight - (val / maxPoints) * chartHeight;
      return `${x},${y}`;
    }).join(" ");
  };

  const idealPath = useMemo(() => getCoordinates(ideal), [ideal, maxPoints, chartHeight, padding, stepX]);
  const actualPath = useMemo(() => getCoordinates(actual), [actual, maxPoints, chartHeight, padding, stepX]);

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto text-xs font-sans">
        {/* Axes */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" strokeOpacity={0.2} />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity={0.2} />
        
        {/* Ideal Line */}
        <polyline points={idealPath} fill="none" stroke="currentColor" strokeOpacity={0.3} strokeWidth="2" strokeDasharray="4 4" />
        
        {/* Actual Line */}
        <polyline points={actualPath} fill="none" stroke="var(--color-primary)" strokeWidth="3" />
        
        {/* Actual Points */}
        {actual.map((val, i) => {
          const x = padding + i * stepX;
          const y = padding + chartHeight - (val / maxPoints) * chartHeight;
          return (
            <circle key={`pt-${i}`} cx={x} cy={y} r="4" fill="var(--color-primary)" />
          );
        })}
        
        {/* Labels */}
        {labels.map((label, i) => {
          const x = padding + i * stepX;
          return (
            <text key={`lbl-${i}`} x={x} y={height - 5} fill="currentColor" opacity={0.5} textAnchor="middle">
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
