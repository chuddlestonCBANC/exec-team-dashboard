'use client';

import { MetricWithDetails, MetricType } from '@/types';
import { MetricCard } from './MetricCard';

interface MetricListProps {
  metrics: MetricWithDetails[];
  type?: MetricType;
  title?: string;
  columns?: 1 | 2 | 3;
}

export function MetricList({ metrics, type, title, columns = 3 }: MetricListProps) {
  const filteredMetrics = type
    ? metrics.filter((m) => m.metricType === type)
    : metrics;

  if (filteredMetrics.length === 0) {
    return null;
  }

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-[var(--gray-800)]">{title}</h3>
      )}
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {filteredMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </div>
  );
}
