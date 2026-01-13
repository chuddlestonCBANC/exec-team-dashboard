'use client';

import Link from 'next/link';
import { PillarWithScore, MetricStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TrendIndicator } from '@/components/ui/TrendIndicator';
import { formatPercentage } from '@/lib/utils/formatting';
import { getStatusColor, getStatusBgColor } from '@/lib/utils/scoring';
import { TrendingUp, TrendingDown, Target, ChevronRight } from 'lucide-react';

interface PillarCardProps {
  pillar: PillarWithScore;
}

export function PillarCard({ pillar }: PillarCardProps) {
  const statusColor = getStatusColor(pillar.status);
  const statusBgColor = getStatusBgColor(pillar.status);

  // Calculate metrics summary
  const greenMetrics = pillar.metrics.filter(
    (m) => m.currentValue / m.targetValue >= 0.9
  ).length;
  const totalMetrics = pillar.metrics.length;

  // Get overall trend based on metrics
  const improvingMetrics = pillar.metrics.filter(
    (m) => m.trendDirection === 'up'
  ).length;
  const decliningMetrics = pillar.metrics.filter(
    (m) => m.trendDirection === 'down'
  ).length;

  return (
    <Link href={`/pillar/${pillar.id}`}>
      <div
        className="pillar-card bg-white rounded-xl border-2 p-6 cursor-pointer h-full"
        style={{ borderColor: statusColor }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--gray-800)] leading-tight">
              {pillar.name}
            </h3>
            <p className="text-sm text-[var(--gray-500)] mt-1 line-clamp-2">
              {pillar.description}
            </p>
          </div>
          <ChevronRight size={20} className="text-[var(--gray-400)] flex-shrink-0 ml-2" />
        </div>

        {/* Score Display */}
        <div
          className="rounded-lg p-4 mb-4"
          style={{ backgroundColor: statusBgColor }}
        >
          <div className="flex items-center justify-between">
            <div>
              <span
                className="text-4xl font-bold"
                style={{ color: statusColor }}
              >
                {pillar.score}
              </span>
              <span className="text-lg text-[var(--gray-500)] ml-1">%</span>
            </div>
            <StatusBadge status={pillar.status} size="lg" />
          </div>
        </div>

        {/* Metrics Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[var(--gray-600)]">
              <Target size={14} />
              <span>Key Results on Track</span>
            </div>
            <span className="font-medium text-[var(--gray-800)]">
              {greenMetrics}/{totalMetrics}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-[var(--success)]" />
              <span className="text-[var(--gray-600)]">{improvingMetrics} improving</span>
            </div>
            {decliningMetrics > 0 && (
              <div className="flex items-center gap-1.5">
                <TrendingDown size={14} className="text-[var(--danger)]" />
                <span className="text-[var(--gray-600)]">{decliningMetrics} declining</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
