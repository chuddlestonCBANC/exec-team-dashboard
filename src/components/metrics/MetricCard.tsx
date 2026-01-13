'use client';

import Link from 'next/link';
import { MetricWithDetails } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TrendIndicator } from '@/components/ui/TrendIndicator';
import { formatMetricValue } from '@/lib/utils/formatting';
import { getStatusColor, getStatusBgColor, getMetricStatus, getPercentageOfTarget } from '@/lib/utils/scoring';
import { User, ChevronRight } from 'lucide-react';

interface MetricCardProps {
  metric: MetricWithDetails;
  showOwners?: boolean;
}

export function MetricCard({ metric, showOwners = true }: MetricCardProps) {
  const status = getMetricStatus(metric.currentValue, metric.targetValue);
  const percentage = getPercentageOfTarget(metric.currentValue, metric.targetValue);
  const statusColor = getStatusColor(status);
  const statusBgColor = getStatusBgColor(status);

  // Calculate trend percentage
  const trendValue = metric.previousValue
    ? Math.round(((metric.currentValue - metric.previousValue) / metric.previousValue) * 100)
    : undefined;

  return (
    <Link href={`/metric/${metric.id}`}>
      <div
        className="bg-white rounded-xl border border-[var(--gray-200)] p-5 cursor-pointer hover:border-[var(--primary)] hover:shadow-md transition-all"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="text-base font-semibold text-[var(--gray-800)]">
              {metric.name}
            </h4>
            {metric.description && (
              <p className="text-sm text-[var(--gray-500)] mt-0.5 line-clamp-1">
                {metric.description}
              </p>
            )}
          </div>
          <ChevronRight size={18} className="text-[var(--gray-400)] flex-shrink-0 ml-2" />
        </div>

        {/* Value Display */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-2xl font-bold text-[var(--gray-900)]">
              {formatMetricValue(metric.currentValue, metric.format)}
            </span>
            <span className="text-sm text-[var(--gray-500)] ml-1">
              / {formatMetricValue(metric.targetValue, metric.format)}
            </span>
          </div>
          <TrendIndicator
            direction={metric.trendDirection}
            value={trendValue}
            size="md"
          />
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: statusColor,
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-[var(--gray-500)]">{percentage}% of target</span>
            <StatusBadge status={status} size="sm" />
          </div>
        </div>

        {/* Owners */}
        {showOwners && metric.owners && metric.owners.length > 0 && (
          <div className="flex items-center gap-2 pt-3 border-t border-[var(--gray-100)]">
            <User size={14} className="text-[var(--gray-400)]" />
            <span className="text-xs text-[var(--gray-600)]">
              {metric.owners.map((o) => o.name.split(' ')[0]).join(', ')}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
