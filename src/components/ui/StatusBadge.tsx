'use client';

import { MetricStatus } from '@/types';
import { getStatusLabel, getStatusColor, getStatusBgColor } from '@/lib/utils/scoring';

interface StatusBadgeProps {
  status: MetricStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function StatusBadge({ status, size = 'md', showLabel = true }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const bgColor = getStatusBgColor(status);
  const label = getStatusLabel(status);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]}`}
      style={{ backgroundColor: bgColor, color }}
    >
      <span
        className={`rounded-full ${dotSizeClasses[size]}`}
        style={{ backgroundColor: color }}
      />
      {showLabel && label}
    </span>
  );
}
