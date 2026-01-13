'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getMetricById, getExecutives, getCurrentPeriodTarget, getPeriodLabel, MetricTarget } from '@/lib/supabase/queries';
import { MetricWithDetails, Executive } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TrendIndicator } from '@/components/ui/TrendIndicator';
import { TrendChart } from '@/components/metrics/TrendChart';
import { MetricCard } from '@/components/metrics/MetricCard';
import { CommitmentList } from '@/components/executives/CommitmentList';
import { NarrativeSection } from '@/components/executives/NarrativeSection';
import { formatMetricValue } from '@/lib/utils/formatting';
import { getStatusColor, getStatusBgColor } from '@/lib/utils/scoring';
import { ArrowLeft, Target, Users, AlertTriangle } from 'lucide-react';

export default function MetricDetailPage() {
  const params = useParams();
  const [metric, setMetric] = useState<MetricWithDetails | null>(null);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [periodTarget, setPeriodTarget] = useState<MetricTarget | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (params.id) {
        try {
          const [metricData, execData] = await Promise.all([
            getMetricById(params.id as string),
            getExecutives(),
          ]);
          setMetric(metricData);
          setExecutives(execData);

          // Load the current period's target if available
          if (metricData) {
            const target = await getCurrentPeriodTarget(
              metricData.id,
              metricData.cadence as 'weekly' | 'monthly' | 'quarterly' | 'annual'
            );
            setPeriodTarget(target);
          }
        } catch (error) {
          console.error('Failed to load metric:', error);
        }
      }
    };
    loadData();
  }, [params.id]);

  if (!metric) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  const statusColor = getStatusColor(metric.status);
  const statusBgColor = getStatusBgColor(metric.status);

  // Use period-specific target if available, otherwise fall back to metric's default target
  const displayTargetValue = periodTarget?.targetValue ?? metric.targetValue;
  const displayPercentage = Math.round((metric.currentValue / displayTargetValue) * 100);
  const periodLabel = periodTarget ? getPeriodLabel(periodTarget) : null;

  // Calculate trend percentage
  const trendValue = metric.previousValue
    ? Math.round(((metric.currentValue - metric.previousValue) / metric.previousValue) * 100)
    : undefined;

  // Get child metrics by type
  const leadingIndicators = metric.childMetrics?.filter((m) => m.metricType === 'leading_indicator') || [];
  const qualityMetrics = metric.childMetrics?.filter((m) => m.metricType === 'quality') || [];

  return (
    <div className="min-h-screen bg-[var(--gray-100)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--gray-200)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href={`/pillar/${metric.pillarId}`}
              className="flex items-center gap-2 text-[var(--gray-600)] hover:text-[var(--primary)] transition-colors mr-6"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back to Pillar</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metric Overview */}
        <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[var(--gray-900)]">
                    {metric.name}
                  </h1>
                  {metric.description && (
                    <p className="text-[var(--gray-500)] mt-1">{metric.description}</p>
                  )}
                </div>
                <StatusBadge status={metric.status} size="lg" />
              </div>

              {/* Value Display */}
              <div
                className="rounded-xl p-6 mt-6"
                style={{ backgroundColor: statusBgColor }}
              >
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-[var(--gray-500)]">Current Value</p>
                      {periodLabel && (
                        <span className="px-2 py-0.5 text-xs bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
                          {periodLabel} Target
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-4xl font-bold"
                        style={{ color: statusColor }}
                      >
                        {formatMetricValue(metric.currentValue, metric.format)}
                      </span>
                      <span className="text-lg text-[var(--gray-500)]">
                        / {formatMetricValue(displayTargetValue, metric.format)}
                      </span>
                    </div>
                  </div>
                  <TrendIndicator
                    direction={metric.trendDirection}
                    value={trendValue}
                    size="lg"
                  />
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="h-3 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(displayPercentage, 100)}%`,
                        backgroundColor: statusColor,
                      }}
                    />
                  </div>
                  <p className="text-sm text-[var(--gray-600)] mt-2">
                    {displayPercentage}% of {periodLabel ? `${periodLabel.toLowerCase()} ` : ''}target achieved
                  </p>
                </div>
              </div>

              {/* Owners */}
              {metric.owners.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-sm text-[var(--gray-500)] mb-3">
                    <Users size={16} />
                    <span>Owners</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {metric.owners.map((owner) => (
                      <div
                        key={owner.id}
                        className="flex items-center gap-2 px-3 py-2 bg-[var(--gray-50)] rounded-lg"
                      >
                        <Image
                          src={owner.headshotUrl}
                          alt={owner.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-[var(--gray-800)]">
                            {owner.name}
                          </p>
                          <p className="text-xs text-[var(--gray-500)]">{owner.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Trend Chart */}
            <div className="lg:w-[400px]">
              <h3 className="text-sm font-semibold text-[var(--gray-700)] mb-3">
                12-Week Trend
                {periodLabel && (
                  <span className="text-xs font-normal text-[var(--gray-500)] ml-2">
                    ({periodLabel} target shown)
                  </span>
                )}
              </h3>
              <TrendChart
                history={metric.history}
                targetValue={displayTargetValue}
                format={metric.format}
                height={200}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Metrics Drill-down */}
          <div className="lg:col-span-2 space-y-8">
            {/* Leading Indicators */}
            {leadingIndicators.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[var(--gray-800)] mb-4 flex items-center gap-2">
                  <Target size={18} />
                  Leading Indicators
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leadingIndicators.map((m) => (
                    <MetricCard key={m.id} metric={m} showOwners={false} />
                  ))}
                </div>
              </section>
            )}

            {/* Quality Metrics */}
            {qualityMetrics.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[var(--gray-800)] mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Quality Metrics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {qualityMetrics.map((m) => (
                    <MetricCard key={m.id} metric={m} showOwners={false} />
                  ))}
                </div>
              </section>
            )}

            {/* Narratives */}
            <section>
              <NarrativeSection
                narratives={metric.narratives}
                executives={executives}
                currentExecutive={metric.owners[0]}
                metricId={metric.id}
              />
            </section>
          </div>

          {/* Right Column: Commitments */}
          <div>
            <h2 className="text-lg font-semibold text-[var(--gray-800)] mb-4">
              Active Commitments
            </h2>
            <CommitmentList
              commitments={metric.commitments}
              executives={executives}
              currentExecutive={metric.owners[0]}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
