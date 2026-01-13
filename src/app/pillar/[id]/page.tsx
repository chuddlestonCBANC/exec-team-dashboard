'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getPillarById } from '@/lib/data/mockData';
import { PillarWithScore, MetricWithDetails } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MetricCard } from '@/components/metrics/MetricCard';
import { TrendChart } from '@/components/metrics/TrendChart';
import { getStatusColor, getStatusBgColor } from '@/lib/utils/scoring';
import { ArrowLeft, TrendingUp, TrendingDown, Target } from 'lucide-react';

export default function PillarDetailPage() {
  const params = useParams();
  const [pillar, setPillar] = useState<PillarWithScore | null>(null);

  useEffect(() => {
    if (params.id) {
      const data = getPillarById(params.id as string);
      setPillar(data);
    }
  }, [params.id]);

  if (!pillar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  const keyResults = pillar.metrics.filter((m) => m.metricType === 'key_result');
  const leadingIndicators = pillar.metrics.filter((m) => m.metricType === 'leading_indicator');
  const qualityMetrics = pillar.metrics.filter((m) => m.metricType === 'quality');

  const statusColor = getStatusColor(pillar.status);
  const statusBgColor = getStatusBgColor(pillar.status);

  // Calculate trend stats
  const improvingMetrics = pillar.metrics.filter((m) => m.trendDirection === 'up').length;
  const decliningMetrics = pillar.metrics.filter((m) => m.trendDirection === 'down').length;
  const onTrackMetrics = keyResults.filter((m) => m.status === 'green').length;

  return (
    <div className="min-h-screen bg-[var(--gray-100)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--gray-200)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-[var(--gray-600)] hover:text-[var(--primary)] transition-colors mr-6"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pillar Overview */}
        <div
          className="rounded-xl border-2 p-6 mb-8"
          style={{ borderColor: statusColor, backgroundColor: 'white' }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[var(--gray-900)]">
                {pillar.name}
              </h1>
              <p className="text-[var(--gray-500)] mt-1">{pillar.description}</p>
            </div>

            <div className="flex items-center gap-6">
              {/* Score Display */}
              <div
                className="rounded-xl p-4 text-center min-w-[140px]"
                style={{ backgroundColor: statusBgColor }}
              >
                <div className="flex items-baseline justify-center">
                  <span
                    className="text-4xl font-bold"
                    style={{ color: statusColor }}
                  >
                    {pillar.score}
                  </span>
                  <span className="text-lg text-[var(--gray-500)] ml-1">%</span>
                </div>
                <StatusBadge status={pillar.status} size="md" />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-[var(--gray-100)]">
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--gray-50)] rounded-lg">
              <Target size={16} className="text-[var(--gray-500)]" />
              <span className="text-sm text-[var(--gray-600)]">
                <span className="font-semibold">{onTrackMetrics}/{keyResults.length}</span> Key Results on track
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--success-bg)] rounded-lg">
              <TrendingUp size={16} className="text-[var(--success)]" />
              <span className="text-sm text-[var(--success)]">
                <span className="font-semibold">{improvingMetrics}</span> metrics improving
              </span>
            </div>
            {decliningMetrics > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--danger-bg)] rounded-lg">
                <TrendingDown size={16} className="text-[var(--danger)]" />
                <span className="text-sm text-[var(--danger)]">
                  <span className="font-semibold">{decliningMetrics}</span> metrics declining
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Key Results */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-[var(--gray-800)] mb-4">
            Key Result Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {keyResults.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </section>

        {/* Trend Overview */}
        {keyResults.length > 0 && keyResults[0].history.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--gray-800)] mb-4">
              Trend Overview - {keyResults[0].name}
            </h2>
            <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
              <TrendChart
                history={keyResults[0].history}
                targetValue={keyResults[0].targetValue}
                format={keyResults[0].format}
                height={300}
              />
            </div>
          </section>
        )}

        {/* Leading Indicators */}
        {leadingIndicators.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--gray-800)] mb-4">
              Leading Indicators
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leadingIndicators.map((metric) => (
                <MetricCard key={metric.id} metric={metric} showOwners={false} />
              ))}
            </div>
          </section>
        )}

        {/* Quality Metrics */}
        {qualityMetrics.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--gray-800)] mb-4">
              Quality Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {qualityMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} showOwners={false} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
