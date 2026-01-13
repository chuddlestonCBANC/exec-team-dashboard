'use client';

import { OverviewSummary as OverviewSummaryType } from '@/types';
import { TrendIndicator } from '@/components/ui/TrendIndicator';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target, Users } from 'lucide-react';

interface OverviewSummaryProps {
  overview: OverviewSummaryType;
}

export function OverviewSummary({ overview }: OverviewSummaryProps) {
  const {
    overallScore,
    overallStatus,
    narrative,
    highlights,
    concerns,
    weekOverWeekChange,
    pillarsOnTrack,
    pillarsAtRisk,
    pillarsOffTrack,
    activeCommitments,
    metricsImproved,
    metricsDeclined,
  } = overview;

  const totalPillars = pillarsOnTrack + pillarsAtRisk + pillarsOffTrack;

  const getScoreColor = () => {
    switch (overallStatus) {
      case 'green':
        return 'from-emerald-500 to-emerald-600';
      case 'yellow':
        return 'from-amber-500 to-amber-600';
      case 'red':
        return 'from-red-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getScoreRingColor = () => {
    switch (overallStatus) {
      case 'green':
        return 'stroke-emerald-500';
      case 'yellow':
        return 'stroke-amber-500';
      case 'red':
        return 'stroke-red-500';
      default:
        return 'stroke-gray-500';
    }
  };

  const getStatusLabel = () => {
    switch (overallStatus) {
      case 'green':
        return 'On Track';
      case 'yellow':
        return 'Needs Attention';
      case 'red':
        return 'Off Track';
      default:
        return 'Unknown';
    }
  };

  // Calculate the stroke dasharray for the circular progress
  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDasharray = `${(overallScore / 100) * circumference} ${circumference}`;

  return (
    <div className="bg-white rounded-2xl border border-[var(--gray-200)] shadow-lg overflow-hidden">
      <div className="grid lg:grid-cols-[280px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-[var(--gray-100)]">
        {/* Left: Score Display */}
        <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-br from-[var(--gray-50)] to-white">
          <div className="relative">
            {/* Circular Progress Ring */}
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-100"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={getScoreRingColor()}
                strokeDasharray={strokeDasharray}
                style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
              />
            </svg>
            {/* Score in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold bg-gradient-to-r ${getScoreColor()} bg-clip-text text-transparent`}>
                {overallScore}%
              </span>
              <span className="text-xs text-[var(--gray-500)] font-medium mt-0.5">
                Overall Score
              </span>
            </div>
          </div>

          {/* Status and Trend */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              overallStatus === 'green'
                ? 'bg-emerald-100 text-emerald-700'
                : overallStatus === 'yellow'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {getStatusLabel()}
            </span>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-[var(--gray-500)]">vs last week</span>
              <TrendIndicator
                direction={weekOverWeekChange >= 0 ? 'up' : 'down'}
                value={Math.abs(weekOverWeekChange)}
                isPositive={weekOverWeekChange >= 0}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex flex-col">
          {/* Header and Narrative */}
          <div className="p-6 border-b border-[var(--gray-100)]">
            <h2 className="text-lg font-bold text-[var(--gray-900)] mb-3">
              Weekly Summary
            </h2>
            <div className="text-[var(--gray-700)] leading-relaxed text-[15px] space-y-4">
              {narrative.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[var(--gray-100)]">
            <QuickStat
              icon={<Target className="w-5 h-5" />}
              value={pillarsOnTrack}
              total={totalPillars}
              label="Pillars On Track"
              color="emerald"
            />
            <QuickStat
              icon={<AlertTriangle className="w-5 h-5" />}
              value={pillarsAtRisk + pillarsOffTrack}
              total={totalPillars}
              label="Need Attention"
              color="amber"
            />
            <QuickStat
              icon={<Users className="w-5 h-5" />}
              value={activeCommitments}
              label="Active Commitments"
              color="violet"
            />
            <QuickStat
              icon={metricsImproved >= metricsDeclined ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              value={metricsImproved}
              subtitle={metricsDeclined > 0 ? `${metricsDeclined} declined` : undefined}
              label="Metrics Improved"
              color="blue"
            />
          </div>

          {/* Highlights and Concerns */}
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--gray-100)]">
            {/* Highlights */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--gray-800)]">
                  Highlights
                </h3>
              </div>
              <ul className="space-y-2">
                {highlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="text-sm text-[var(--gray-600)] flex items-start gap-2 leading-snug"
                  >
                    <span className="text-emerald-500 mt-1 flex-shrink-0">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Concerns */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-amber-100">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--gray-800)]">
                  Areas of Focus
                </h3>
              </div>
              <ul className="space-y-2">
                {concerns.map((concern, index) => (
                  <li
                    key={index}
                    className="text-sm text-[var(--gray-600)] flex items-start gap-2 leading-snug"
                  >
                    <span className="text-amber-500 mt-1 flex-shrink-0">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuickStatProps {
  icon: React.ReactNode;
  value: number;
  total?: number;
  subtitle?: string;
  label: string;
  color: 'emerald' | 'amber' | 'violet' | 'blue';
}

function QuickStat({ icon, value, total, subtitle, label, color }: QuickStatProps) {
  const colorClasses = {
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    violet: 'text-violet-600 bg-violet-50',
    blue: 'text-blue-600 bg-blue-50',
  };

  const valueColors = {
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    violet: 'text-violet-700',
    blue: 'text-blue-700',
  };

  return (
    <div className="p-4 flex flex-col items-center text-center">
      <div className={`p-2 rounded-xl ${colorClasses[color]} mb-2`}>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${valueColors[color]}`}>
        {value}
        {total !== undefined && (
          <span className="text-[var(--gray-400)] text-base font-normal">/{total}</span>
        )}
      </div>
      {subtitle && (
        <div className="text-xs text-[var(--gray-400)]">{subtitle}</div>
      )}
      <div className="text-xs text-[var(--gray-500)] mt-0.5">{label}</div>
    </div>
  );
}
